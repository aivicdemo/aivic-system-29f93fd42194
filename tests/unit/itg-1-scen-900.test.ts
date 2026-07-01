import { applyDiscountLogic } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 割引・キャンペーン適用判定', () => {
  // SCEN-900
  test('[normal] 割引ルールが成果データに不適用で、割引率が 0 となる', () => {
    // テストデータ: 割引ルールが定義されていない契約
    const contract = {
      contract_id: 'CONTRACT-001',
      customer_id: 'CUST-100',
      service_id: 'SERVICE-A',
      base_price: 100000,
      discount_rules: [], // 割引ルール定義なし
      campaign_rules: [], // キャンペーンルール定義なし
    };

    // 成果データ
    const performanceData = {
      performance_id: 'PERF-001',
      contract_id: 'CONTRACT-001',
      customer_id: 'CUST-100',
      service_id: 'SERVICE-A',
      appointment_count: 5,
      deal_count: 2,
      customer_response_positive: true,
      performance_date: '2024-01-15',
    };

    // 割引・キャンペーン適用判定機能を実行
    const result = applyDiscountLogic({
      contract,
      performanceData,
    });

    // 期待結果: 割引ルールが適用されず、割引率が 0 で返される
    expect(result.discount_rate).toBe(0);
    expect(result.discount_applied).toBe(false);
    expect(result.campaign_applied).toBe(false);
    expect(result.discounted_amount).toBe(0);

    // 割引なしの状態で請求額が計算されることを確認
    const billing_amount = contract.base_price - result.discounted_amount;
    expect(billing_amount).toBe(100000);

    // 割引適用フラグが未適用状態となっていることを確認
    expect(result.discount_applied).toBe(false);
    expect(result.applied_discount_rules).toEqual([]);
  });
});