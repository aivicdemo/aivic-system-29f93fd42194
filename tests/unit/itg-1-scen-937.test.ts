import { describe, test, expect } from '@jest/globals';
import {
  calculatePartialMonthBillingAmount,
} from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-937: [edge] 月次請求対象契約・割引基準の確認機能 - 契約の有効期間終了日が当月内の場合、部分月請求対象として正確に識別される
  test('契約有効期間終了日が当月内の場合、部分月請求対象として正確に識別され請求額が計算される', () => {
    // テストデータ: 2024年1月15日に終了する契約
    const contract_partial_month = {
      contract_id: 'CONT-2024-001',
      customer_id: 'CUST-A001',
      service_id: 'SVC-BASIC',
      valid_from: '2024-01-01',
      valid_to: '2024-01-15',
      base_monthly_fee: 30000,
      discount_rate: 0.1,
    };

    const contract_full_month = {
      contract_id: 'CONT-2024-002',
      customer_id: 'CUST-B002',
      service_id: 'SVC-STANDARD',
      valid_from: '2024-01-01',
      valid_to: '2024-01-31',
      base_monthly_fee: 50000,
      discount_rate: 0.05,
    };

    const billing_month_start = '2024-01-01';
    const billing_month_end = '2024-01-31';

    // 部分月契約（1月1日～1月15日 = 15日間）の請求額計算
    // 基本料金: 30,000円 × (15日 / 31日) × (1 - 0.1割引) = 30,000 × 0.4839 × 0.9 ≈ 13,065.3円 → 13,065円
    const result_partial = calculatePartialMonthBillingAmount({
      contract: contract_partial_month,
      billing_month_start,
      billing_month_end,
    });

    // 部分月判定が正確に行われているか
    expect(result_partial.is_partial_month).toBe(true);

    // 請求期間が正確に計算されているか（1月15日までなので15日間）
    expect(result_partial.billing_days).toBe(15);

    // 割引基準が部分月日数に基づいて適切に適用されているか
    // 期待値: 30,000 × (15/31) × (1 - 0.1) = 30,000 × 0.48387 × 0.9 ≈ 13,065円
    expect(result_partial.billing_amount).toBe(13065);

    // 割引額の検証
    expect(result_partial.discount_amount).toBe(1452);

    // 通常契約（1月1日～1月31日 = 31日間）の請求額計算
    // 基本料金: 50,000円 × (31日 / 31日) × (1 - 0.05割引) = 50,000 × 1.0 × 0.95 = 47,500円
    const result_full = calculatePartialMonthBillingAmount({
      contract: contract_full_month,
      billing_month_start,
      billing_month_end,
    });

    // 通常月判定
    expect(result_full.is_partial_month).toBe(false);

    // 請求期間は31日間（満月）
    expect(result_full.billing_days).toBe(31);

    // 通常月の請求額
    expect(result_full.billing_amount).toBe(47500);

    // 割引額の検証
    expect(result_full.discount_amount).toBe(2500);

    // 部分月契約と通常契約の請求額が正確に区別されているか
    expect(result_partial.billing_amount).not.toBe(result_full.billing_amount);

    // 請求対象項目リスト化の検証
    const partial_billing_items = result_partial.billing_items;
    expect(partial_billing_items).toHaveLength(1);
    expect(partial_billing_items[0].item_name).toBe('base_fee_prorated');
    expect(partial_billing_items[0].unit_price).toBe(968); // 30,000 / 31日
    expect(partial_billing_items[0].quantity).toBe(15);
    expect(partial_billing_items[0].subtotal).toBe(14520); // 968 × 15
    expect(partial_billing_items[0].discount_applied).toBe(1452); // 14,520 × 0.1
    expect(partial_billing_items[0].net_amount).toBe(13068); // 14,520 - 1,452

    // 契約の識別情報が正確に含まれているか
    expect(result_partial.contract_id).toBe('CONT-2024-001');
    expect(result_partial.customer_id).toBe('CUST-A001');
    expect(result_partial.service_id).toBe('SVC-BASIC');

    // 終了日が月の途中である場合の例外ケース検証
    expect(result_partial.is_contract_ending_this_month).toBe(true);
    expect(result_full.is_contract_ending_this_month).toBe(false);
  });
});