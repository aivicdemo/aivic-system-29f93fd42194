import { calculateBillingAmount } from "../../src/logic/it-1-2-1";

describe("請求額計算機能", () => {
  // SCEN-602
  test("複数割引ルールが適用される場合に請求額が正確に計算される", () => {
    const baseAmount = 100000;
    const discountRules = [
      { type: "quantity", rate: 0.1, order: 1 },
      { type: "earlyPayment", rate: 0.05, order: 2 },
      { type: "membership", rate: 0.03, order: 3 },
    ];

    // 計算過程
    // 基本金額: 100,000円
    // ステップ1: 数量割引10%を適用 → 100,000 * (1 - 0.1) = 90,000円
    // ステップ2: 早期支払割引5%を適用 → 90,000 * (1 - 0.05) = 85,500円
    // ステップ3: 会員割引3%を適用 → 85,500 * (1 - 0.03) = 82,935円
    const expectedBillingAmount = 82935;

    const result = calculateBillingAmount({
      baseAmount,
      discountRules,
    });

    expect(result.finalAmount).toBe(expectedBillingAmount);
    expect(result.appliedDiscounts).toHaveLength(3);
    expect(result.appliedDiscounts[0]).toEqual({
      type: "quantity",
      rate: 0.1,
      amountAfter: 90000,
    });
    expect(result.appliedDiscounts[1]).toEqual({
      type: "earlyPayment",
      rate: 0.05,
      amountAfter: 85500,
    });
    expect(result.appliedDiscounts[2]).toEqual({
      type: "membership",
      rate: 0.03,
      amountAfter: 82935,
    });
  });
});