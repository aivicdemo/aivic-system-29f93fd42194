import { calculateBillingAmount } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-595: [edge] 請求額の計算と検証 - 割引率が0%（割引なし）の場合、元の請求額が計算結果として返される
  test('割引率が0%の場合、元の請求額がそのまま計算結果として返される', () => {
    const originalAmount = 10000;
    const discountRate = 0;

    const result = calculateBillingAmount({
      originalAmount,
      discountRate,
    });

    expect(result).toBe(10000);
  });
});