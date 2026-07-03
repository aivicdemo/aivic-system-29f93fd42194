import { applyBillingRules } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-884: [edge] 請求ルール適用ロジック機能 - 割引率が0%の場合に割引を適用しない計算が実行される
  test('割引率が0%の場合、割引額は0円となり、最終請求額は元の請求金額と同じ金額が返されること', () => {
    // 準備: 割引率が0%に設定された請求データを準備
    const billingData = {
      customerId: 'CUST-001',
      serviceId: 'SVC-A',
      baseAmount: 100000, // 基本請求金額: 100,000円
      discountRate: 0, // 割引率: 0%
      minimumBillingAmount: 0,
      maximumBillingAmount: 999999999,
    };

    // 実行: 割引率0%の条件で請求ルール適用ロジックを実行
    const result = applyBillingRules(billingData);

    // 検証: 計算結果の割引額を検証
    // 割引額 = 100,000 * (0 / 100) = 0円
    expect(result.discountAmount).toBe(0);

    // 検証: 計算結果の最終請求額を検証
    // 最終請求額 = 100,000 - 0 = 100,000円
    expect(result.finalBillingAmount).toBe(100000);

    // 検証: 元の請求金額と最終請求額が同じであることを確認
    expect(result.finalBillingAmount).toEqual(result.baseAmount);

    // 検証: 割引が適用されていないことを確認（割引額が0円）
    expect(result.discountAmount).toBe(0);
  });
});