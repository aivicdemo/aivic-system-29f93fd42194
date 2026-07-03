import { validateBillingAmountAgainstProcedure } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-964: [edge] 請求額計算結果の手順書照合検証
  test('請求額が手順書の計算ルールの境界値（最小請求額または最大割引率）に達した場合、正確に判定される', () => {
    // テストデータ: 最小請求額の境界値 (10,000円) に該当するケース
    const minBillingAmount = 10000;
    const maxDiscountRate = 0.30; // 30%

    // ケース 1: 計算結果が正確に最小請求額と一致する場合
    const inputAtMinBoundary = {
      baseAmount: 9500,
      discountRate: 0.05,
      minimumBillingAmount: minBillingAmount,
      maximumDiscountRate: maxDiscountRate,
    };
    const resultAtMinBoundary = validateBillingAmountAgainstProcedure(inputAtMinBoundary);
    expect(resultAtMinBoundary.finalAmount).toBe(10000);
    expect(resultAtMinBoundary.appliedMinimum).toBe(true);
    expect(resultAtMinBoundary.isCompliant).toBe(true);

    // ケース 2: 最小請求額の境界値を1円下回るデータで計算し、最小請求額が適用される場合
    const inputBelowMinBoundary = {
      baseAmount: 9900,
      discountRate: 0.01,
      minimumBillingAmount: minBillingAmount,
      maximumDiscountRate: maxDiscountRate,
    };
    const resultBelowMinBoundary = validateBillingAmountAgainstProcedure(inputBelowMinBoundary);
    expect(resultBelowMinBoundary.finalAmount).toBe(10000);
    expect(resultBelowMinBoundary.appliedMinimum).toBe(true);
    expect(resultBelowMinBoundary.isCompliant).toBe(true);

    // ケース 3: 最大割引率の境界値に該当する割引データ（割引後額が計算値と一致）
    const inputAtMaxDiscount = {
      baseAmount: 50000,
      discountRate: 0.30, // 最大割引率 30%
      minimumBillingAmount: minBillingAmount,
      maximumDiscountRate: maxDiscountRate,
    };
    const resultAtMaxDiscount = validateBillingAmountAgainstProcedure(inputAtMaxDiscount);
    expect(resultAtMaxDiscount.finalAmount).toBe(35000); // 50000 * (1 - 0.30)
    expect(resultAtMaxDiscount.appliedMaxDiscount).toBe(false); // 上限に達していない、正常範囲
    expect(resultAtMaxDiscount.isCompliant).toBe(true);

    // ケース 4: 最大割引率の境界値を0.1%上回るデータで計算し、割引が上限に制限される場合
    const inputAboveMaxDiscount = {
      baseAmount: 50000,
      discountRate: 0.31, // 最大割引率を0.1%上回る
      minimumBillingAmount: minBillingAmount,
      maximumDiscountRate: maxDiscountRate,
    };
    const resultAboveMaxDiscount = validateBillingAmountAgainstProcedure(inputAboveMaxDiscount);
    expect(resultAboveMaxDiscount.finalAmount).toBe(35000); // 50000 * (1 - 0.30) に制限される
    expect(resultAboveMaxDiscount.appliedMaxDiscount).toBe(true);
    expect(resultAboveMaxDiscount.isCompliant).toBe(true);

    // ケース 5: 最小請求額が適用される場合、割引率が高くても最小請求額が優先される
    const inputMinAndDiscount = {
      baseAmount: 15000,
      discountRate: 0.40, // 最大割引率を超える
      minimumBillingAmount: minBillingAmount,
      maximumDiscountRate: maxDiscountRate,
    };
    const resultMinAndDiscount = validateBillingAmountAgainstProcedure(inputMinAndDiscount);
    // 割引適用後: 15000 * (1 - 0.30) = 10500
    // 最小請求額: 10000
    // 結果: 10500 (最小値より大きいため最小値未適用)
    expect(resultMinAndDiscount.finalAmount).toBe(10500);
    expect(resultMinAndDiscount.appliedMinimum).toBe(false);
    expect(resultMinAndDiscount.isCompliant).toBe(true);

    // ケース 6: 全体の手順書ルール照合の確認
    const allCasesCompliant = [
      resultAtMinBoundary,
      resultBelowMinBoundary,
      resultAtMaxDiscount,
      resultAboveMaxDiscount,
      resultMinAndDiscount,
    ].every((result) => result.isCompliant === true);
    expect(allCasesCompliant).toBe(true);
  });
});