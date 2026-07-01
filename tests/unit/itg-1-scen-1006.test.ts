import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  extractBillableItemsFromSalesData,
  calculateBillableAggregation,
  validateBillingRuleApplication,
} from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 請求対象項目の自動抽出・集計', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1006: [normal] 営業データから請求対象項目の自動抽出・集計
  test('営業成果データから請求ルールに基づいて請求対象項目が自動判定・抽出される', () => {
    // ===== 前提条件 =====
    // 営業システムに記録された営業成果データ（売上金額、商品種別、契約日、顧客区分等）が存在
    // 請求ルールが定義済み：
    //   - 売上金額 >= 100,000 円（最小請求額）
    //   - 商品種別が除外対象外
    //   - 契約日が当月以前
    //   - 顧客区分が「対象」

    const salesDataList = [
      {
        sales_id: 'SALES001',
        sales_amount: 150000,
        product_type: 'service_a',
        contract_date: '2024-01-10',
        customer_category: 'target',
        customer_id: 'CUST001',
        service_id: 'SVC001',
      },
      {
        sales_id: 'SALES002',
        sales_amount: 50000,
        product_type: 'service_a',
        contract_date: '2024-01-15',
        customer_category: 'target',
        customer_id: 'CUST002',
        service_id: 'SVC001',
      },
      {
        sales_id: 'SALES003',
        sales_amount: 120000,
        product_type: 'excluded_service',
        contract_date: '2024-01-20',
        customer_category: 'target',
        customer_id: 'CUST001',
        service_id: 'SVC002',
      },
      {
        sales_id: 'SALES004',
        sales_amount: 200000,
        product_type: 'service_b',
        contract_date: '2024-02-01',
        customer_category: 'non_target',
        customer_id: 'CUST003',
        service_id: 'SVC003',
      },
      {
        sales_id: 'SALES005',
        sales_amount: 180000,
        product_type: 'service_b',
        contract_date: '2024-01-25',
        customer_category: 'target',
        customer_id: 'CUST001',
        service_id: 'SVC002',
      },
    ];

    const billingRules = {
      minimum_amount: 100000,
      excluded_product_types: ['excluded_service'],
      max_contract_date: '2024-01-31',
      target_customer_categories: ['target'],
    };

    // ===== trigger: 自動抽出・集計機能を実行 =====
    const extractionResult = extractBillableItemsFromSalesData(
      salesDataList,
      billingRules
    );

    // ===== 期待結果1: 請求対象項目が正確に抽出される =====
    // 該当: SALES001（金額150000 >= 100000、商品対象、契約日2024-01-10 <= 2024-01-31、顧客区分target）
    // 該当: SALES005（金額180000 >= 100000、商品対象、契約日2024-01-25 <= 2024-01-31、顧客区分target）
    // 除外: SALES002（金額50000 < 100000）
    // 除外: SALES003（商品タイプ excluded_service）
    // 除外: SALES004（顧客区分 non_target、契約日2024-02-01 > 2024-01-31）

    expect(extractionResult.billable_items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sales_id: 'SALES001',
          is_billable: true,
          applied_rules: [
            'amount_threshold_met',
            'product_type_allowed',
            'contract_date_valid',
            'customer_category_valid',
          ],
        }),
        expect.objectContaining({
          sales_id: 'SALES005',
          is_billable: true,
          applied_rules: [
            'amount_threshold_met',
            'product_type_allowed',
            'contract_date_valid',
            'customer_category_valid',
          ],
        }),
      ])
    );

    // ===== 期待結果2: 請求対象外のデータに除外理由が記録される =====
    const nonBillableItems = extractionResult.billable_items.filter(
      (item: any) => !item.is_billable
    );

    expect(nonBillableItems).toContainEqual(
      expect.objectContaining({
        sales_id: 'SALES002',
        is_billable: false,
        exclusion_reasons: ['amount_below_minimum'],
      })
    );

    expect(nonBillableItems).toContainEqual(
      expect.objectContaining({
        sales_id: 'SALES003',
        is_billable: false,
        exclusion_reasons: ['product_type_excluded'],
      })
    );

    expect(nonBillableItems).toContainEqual(
      expect.objectContaining({
        sales_id: 'SALES004',
        is_billable: false,
        exclusion_reasons: ['contract_date_invalid', 'customer_category_invalid'],
      })
    );

    // ===== 期待結果3: 集計結果が正確に計算される =====
    // 請求対象件数: 2件（SALES001、SALES005）
    // 対象金額合計: 150,000 + 180,000 = 330,000円
    // 除外金額合計: 50,000 + 120,000 + 200,000 = 370,000円

    const aggregation = calculateBillableAggregation(
      extractionResult.billable_items
    );

    expect(aggregation.billable_item_count).toBe(2);
    expect(aggregation.billable_amount_total).toBe(330000);
    expect(aggregation.non_billable_item_count).toBe(3);
    expect(aggregation.non_billable_amount_total).toBe(370000);
    expect(aggregation.total_item_count).toBe(5);
    expect(aggregation.total_amount).toBe(700000);

    // ===== 期待結果4: 顧客ごと・サービスごとの集計 =====
    // 顧客別：
    //   CUST001: 150,000（SALES001）+ 180,000（SALES005）= 330,000
    // サービス別：
    //   SVC001: 150,000（SALES001）
    //   SVC002: 180,000（SALES005）

    expect(aggregation.by_customer).toEqual(
      expect.objectContaining({
        CUST001: 330000,
      })
    );

    expect(aggregation.by_service).toEqual(
      expect.objectContaining({
        SVC001: 150000,
        SVC002: 180000,
      })
    );

    // ===== 期待結果5: ルール適用の検証結果が記録される =====
    const validationResult = validateBillingRuleApplication(
      extractionResult,
      billingRules
    );

    expect(validationResult.validation_status).toBe('passed');
    expect(validationResult.rules_applied_count).toBe(4);
    expect(validationResult.items_passed).toBe(2);
    expect(validationResult.items_excluded).toBe(3);
    expect(validationResult.is_complete).toBe(true);

    // ===== 期待結果6: 各項目の判定根拠が追跡可能 =====
    const billableItem = extractionResult.billable_items.find(
      (item: any) => item.sales_id === 'SALES001'
    );

    expect(billableItem).toBeDefined();
    expect(billableItem.applied_rules).toHaveLength(4);
    expect(billableItem.rule_evaluation_timestamp).toBeDefined();
    expect(billableItem.rule_evaluation_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // ===== 期待結果7: 処理の完全性を確認 =====
    expect(extractionResult.processing_status).toBe('completed');
    expect(extractionResult.processed_item_count).toBe(5);
    expect(extractionResult.processing_timestamp).toBeDefined();
    expect(extractionResult.billable_items).toHaveLength(5);
  });
});