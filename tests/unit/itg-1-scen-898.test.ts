import { calculateBillingAmountWithDiscount } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理 - 割引率が100%に近い場合の請求額計算', () => {
  // SCEN-898: [edge] 適用請求ルール・割引基準の明確化 - 割引率が100%に近い場合、請求額計算ロジックが正確に機能する
  test('割引率99.9%で売上100,000円の場合、請求額は100円になること', () => {
    const salesAmount = 100000;
    const discountRate = 0.999;
    const result = calculateBillingAmountWithDiscount(salesAmount, discountRate);
    expect(result).toBe(100);
  });

  test('割引率99.99%で売上100,000円の場合、請求額は1円になること', () => {
    const salesAmount = 100000;
    const discountRate = 0.9999;
    const result = calculateBillingAmountWithDiscount(salesAmount, discountRate);
    expect(result).toBe(1);
  });

  test('割引率99.999%で売上100,000円の場合、システムの丸め処理により正の値が返されること', () => {
    const salesAmount = 100000;
    const discountRate = 0.99999;
    const result = calculateBillingAmountWithDiscount(salesAmount, discountRate);
    expect(result).toBeGreaterThan(0);
  });

  test('割引率99.9%で売上1円の場合、請求額は正の値であること', () => {
    const salesAmount = 1;
    const discountRate = 0.999;
    const result = calculateBillingAmountWithDiscount(salesAmount, discountRate);
    expect(result).toBeGreaterThan(0);
  });

  test('割引率99.9%で売上1,000円の場合、請求額は1円になること', () => {
    const salesAmount = 1000;
    const discountRate = 0.999;
    const result = calculateBillingAmountWithDiscount(salesAmount, discountRate);
    expect(result).toBe(1);
  });

  test('割引率99.9%で売上1,000,000円の場合、請求額は1,000円になること', () => {
    const salesAmount = 1000000;
    const discountRate = 0.999;
    const result = calculateBillingAmountWithDiscount(salesAmount, discountRate);
    expect(result).toBe(1000);
  });

  test('割引率99.99%で売上1,000,000円の場合、請求額は100円になること', () => {
    const salesAmount = 1000000;
    const discountRate = 0.9999;
    const result = calculateBillingAmountWithDiscount(salesAmount, discountRate);
    expect(result).toBe(100);
  });

  test('割引率100%を超える場合、例外が発生すること', () => {
    const salesAmount = 100000;
    const discountRate = 1.001;
    expect(() => calculateBillingAmountWithDiscount(salesAmount, discountRate)).toThrow(/割引率/);
  });

  test('割引率が負の場合、例外が発生すること', () => {
    const salesAmount = 100000;
    const discountRate = -0.1;
    expect(() => calculateBillingAmountWithDiscount(salesAmount, discountRate)).toThrow(/割引率/);
  });

  test('売上金額が負の場合、例外が発生すること', () => {
    const salesAmount = -100000;
    const discountRate = 0.999;
    expect(() => calculateBillingAmountWithDiscount(salesAmount, discountRate)).toThrow(/売上/);
  });

  test('複数の高割引率ケースで計算ロジックの一貫性が保たれること', () => {
    const testCases = [
      { sales: 100000, discount: 0.99, expectedMin: 999, expectedMax: 1001 },
      { sales: 100000, discount: 0.999, expectedMin: 99, expectedMax: 101 },
      { sales: 100000, discount: 0.9999, expectedMin: 0.9, expectedMax: 1.1 },
    ];

    testCases.forEach(({ sales, discount, expectedMin, expectedMax }) => {
      const result = calculateBillingAmountWithDiscount(sales, discount);
      expect(result).toBeGreaterThanOrEqual(expectedMin);
      expect(result).toBeLessThanOrEqual(expectedMax);
    });
  });

  test('割引率0%（割引なし）の場合、請求額は売上金額と同じになること', () => {
    const salesAmount = 100000;
    const discountRate = 0;
    const result = calculateBillingAmountWithDiscount(salesAmount, discountRate);
    expect(result).toBe(100000);
  });

  test('割引率50%の場合、請求額は売上金額の50%になること', () => {
    const salesAmount = 100000;
    const discountRate = 0.5;
    const result = calculateBillingAmountWithDiscount(salesAmount, discountRate);
    expect(result).toBe(50000);
  });
});