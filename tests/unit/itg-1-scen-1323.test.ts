import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  extractSalesDataItems,
  extractBillingDataItems,
  extractReportDataItems,
  createMappingTemplate,
  assignMappingPairs,
  validateNoUnmappedItems,
  validateOneToOneMapping,
  validateMappingIntegrity,
  verifyMappingWithTestData,
} from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データマッピング仕様書の作成', () => {
  // SCEN-1323
  test('営業システムのデータ項目と顧客請求・レポート出力が1対1でマッピングされる', () => {
    // 手順1: 営業システムのデータベースから全営業データ項目を抽出
    const sales_data_items = extractSalesDataItems();
    expect(sales_data_items).toEqual([
      { item_id: 'SD001', item_name: 'アポ数', unit: '件', data_type: 'integer' },
      { item_id: 'SD002', item_name: '成約数', unit: '件', data_type: 'integer' },
      { item_id: 'SD003', item_name: '顧客反応', unit: 'スコア', data_type: 'integer' },
      { item_id: 'SD004', item_name: 'サービス種別', unit: 'テキスト', data_type: 'string' },
    ]);
    expect(sales_data_items.length).toBe(4);

    // 手順2: 顧客請求システムで使用されるデータ項目の一覧を取得
    const billing_data_items = extractBillingDataItems();
    expect(billing_data_items).toEqual([
      { item_id: 'B001', item_name: '請求対象アポ数', unit: '件', data_type: 'integer' },
      { item_id: 'B002', item_name: '請求対象成約数', unit: '件', data_type: 'integer' },
      { item_id: 'B003', item_name: 'サービスコード', unit: 'テキスト', data_type: 'string' },
    ]);
    expect(billing_data_items.length).toBe(3);

    // 手順3: レポート出力機能で必要とされるデータ項目の一覧を取得
    const report_data_items = extractReportDataItems();
    expect(report_data_items).toEqual([
      { item_id: 'R001', item_name: 'レポート_アポ数', unit: '件', data_type: 'integer' },
      { item_id: 'R002', item_name: 'レポート_成約数', unit: '件', data_type: 'integer' },
      { item_id: 'R003', item_name: 'レポート_顧客反応平均', unit: 'スコア', data_type: 'decimal' },
      { item_id: 'R004', item_name: 'レポート_サービス名', unit: 'テキスト', data_type: 'string' },
    ]);
    expect(report_data_items.length).toBe(4);

    // 手順4: 営業データマッピング仕様書のテンプレートを作成
    const mapping_template = createMappingTemplate(
      sales_data_items,
      billing_data_items,
      report_data_items
    );
    expect(mapping_template).toEqual({
      template_id: 'TEMPLATE001',
      created_at: '2024-01-15T11:00:00Z',
      status: 'draft',
      mapping_entries: [],
      validation_errors: [],
    });
    expect(mapping_template.status).toBe('draft');
    expect(Array.isArray(mapping_template.mapping_entries)).toBe(true);

    // 手順5: 営業システムの各データ項目に対して、請求・レポート出力側の対応項目を1件ずつ割り当てる
    const mapping_pairs = [
      {
        sales_item_id: 'SD001',
        sales_item_name: 'アポ数',
        billing_item_id: 'B001',
        billing_item_name: '請求対象アポ数',
        report_item_id: 'R001',
        report_item_name: 'レポート_アポ数',
      },
      {
        sales_item_id: 'SD002',
        sales_item_name: '成約数',
        billing_item_id: 'B002',
        billing_item_name: '請求対象成約数',
        report_item_id: 'R002',
        report_item_name: 'レポート_成約数',
      },
      {
        sales_item_id: 'SD003',
        sales_item_name: '顧客反応',
        billing_item_id: null,
        billing_item_name: null,
        report_item_id: 'R003',
        report_item_name: 'レポート_顧客反応平均',
      },
      {
        sales_item_id: 'SD004',
        sales_item_name: 'サービス種別',
        billing_item_id: 'B003',
        billing_item_name: 'サービスコード',
        report_item_id: 'R004',
        report_item_name: 'レポート_サービス名',
      },
    ];

    const assigned_mapping = assignMappingPairs(mapping_template, mapping_pairs);
    expect(assigned_mapping.mapping_entries.length).toBe(4);
    expect(assigned_mapping.mapping_entries[0]).toEqual({
      sales_item_id: 'SD001',
      sales_item_name: 'アポ数',
      billing_item_id: 'B001',
      billing_item_name: '請求対象アポ数',
      report_item_id: 'R001',
      report_item_name: 'レポート_アポ数',
    });
    expect(assigned_mapping.status).toBe('draft');

    // 手順6: マッピング対象外のデータ項目がないか確認
    const unmapped_validation = validateNoUnmappedItems(
      sales_data_items,
      assigned_mapping.mapping_entries
    );
    expect(unmapped_validation.is_valid).toBe(true);
    expect(unmapped_validation.unmapped_items).toEqual([]);
    expect(unmapped_validation.error_count).toBe(0);

    // 手順7: 1対多または多対1のマッピングが発生していないか検証
    const one_to_one_validation = validateOneToOneMapping(assigned_mapping.mapping_entries);
    expect(one_to_one_validation.is_valid).toBe(true);
    expect(one_to_one_validation.duplicate_mappings).toEqual([]);
    expect(one_to_one_validation.error_count).toBe(0);

    // 手順8: マッピング仕様書の整合性をレビュー
    const integrity_validation = validateMappingIntegrity(
      assigned_mapping,
      sales_data_items,
      billing_data_items,
      report_data_items
    );
    expect(integrity_validation.is_valid).toBe(true);
    expect(integrity_validation.validation_errors.length).toBe(0);
    expect(integrity_validation.reviewed_at).toBe('2024-01-15T11:00:00Z');

    // 手順9: 営業システムのテストデータを使用してマッピング結果を検証
    const test_data_input = {
      sales_records: [
        {
          sales_id: 'REC001',
          apo_count: 10,
          contract_count: 3,
          customer_sentiment: 85,
          service_type: 'Premium',
        },
        {
          sales_id: 'REC002',
          apo_count: 15,
          contract_count: 5,
          customer_sentiment: 90,
          service_type: 'Standard',
        },
      ],
    };

    const mapping_verification = verifyMappingWithTestData(
      assigned_mapping,
      test_data_input
    );
    expect(mapping_verification.is_valid).toBe(true);
    expect(mapping_verification.verified_record_count).toBe(2);
    expect(mapping_verification.mapping_errors).toEqual([]);
    expect(mapping_verification.transformed_data).toEqual([
      {
        sales_id: 'REC001',
        billing_apo_count: 10,
        billing_contract_count: 3,
        report_apo_count: 10,
        report_contract_count: 3,
        report_customer_sentiment_avg: 85,
        report_service_name: 'Premium',
      },
      {
        sales_id: 'REC002',
        billing_apo_count: 15,
        billing_contract_count: 5,
        report_apo_count: 15,
        report_contract_count: 5,
        report_customer_sentiment_avg: 90,
        report_service_name: 'Standard',
      },
    ]);

    // 期待結果の総合検証：
    // 営業システムの全データ項目が顧客請求・レポート出力の対応項目に対して1対1でマッピングされ、
    // 重複や未マッピングがなく、マッピング仕様書に記録される
    expect(assigned_mapping.mapping_entries.length).toBe(sales_data_items.length);
    expect(unmapped_validation.is_valid).toBe(true);
    expect(one_to_one_validation.is_valid).toBe(true);
    expect(integrity_validation.is_valid).toBe(true);
    expect(mapping_verification.is_valid).toBe(true);
  });
});