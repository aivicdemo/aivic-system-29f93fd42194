import { calculateDiscountedBillingAmount } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-593: [normal] 請求額の計算と検証 - 契約書の割引ルールが適用される場合、割引後の請求額が正確に計算される
  test("should calculate discounted billing amount correctly for multiple discount patterns", () => {
    // 固定額割引パターン
    const fixedDiscountInput = {
      contractId: "CONTRACT-001",
      baseBillingAmount: 100000,
      discountType: "fixed" as const,
      discountValue: 10000,
    };
    const fixedDiscountResult = calculateDiscountedBillingAmount(
      fixedDiscountInput
    );
    expect(fixedDiscountResult.discountAmount).toBe(10000);
    expect(fixedDiscountResult.discountedAmount).toBe(90000);
    expect(fixedDiscountResult.discountPercentage).toBe(10);

    // 率割引パターン（10%割引）
    const rateDiscountInput = {
      contractId: "CONTRACT-002",
      baseBillingAmount: 100000,
      discountType: "rate" as const,
      discountValue: 10,
    };
    const rateDiscountResult =
      calculateDiscountedBillingAmount(rateDiscountInput);
    expect(rateDiscountResult.discountAmount).toBe(10000);
    expect(rateDiscountResult.discountedAmount).toBe(90000);
    expect(rateDiscountResult.discountPercentage).toBe(10);

    // 段階割引パターン（売上段階に応じた割引：50万以上で5%）
    const stepDiscountInput = {
      contractId: "CONTRACT-003",
      baseBillingAmount: 500000,
      discountType: "step" as const,
      discountValue: 5,
    };
    const stepDiscountResult =
      calculateDiscountedBillingAmount(stepDiscountInput);
    expect(stepDiscountResult.discountAmount).toBe(25000);
    expect(stepDiscountResult.discountedAmount).toBe(475000);
    expect(stepDiscountResult.discountPercentage).toBe(5);

    // 割引なしパターン
    const noDiscountInput = {
      contractId: "CONTRACT-004",
      baseBillingAmount: 100000,
      discountType: "none" as const,
      discountValue: 0,
    };
    const noDiscountResult = calculateDiscountedBillingAmount(noDiscountInput);
    expect(noDiscountResult.discountAmount).toBe(0);
    expect(noDiscountResult.discountedAmount).toBe(100000);
    expect(noDiscountResult.discountPercentage).toBe(0);

    // 小数点以下の端数処理が含まれる複雑な割引パターン（率割引で端数が生じる場合）
    const complexDiscountInput = {
      contractId: "CONTRACT-005",
      baseBillingAmount: 123456,
      discountType: "rate" as const,
      discountValue: 7,
    };
    const complexDiscountResult =
      calculateDiscountedBillingAmount(complexDiscountInput);
    const expectedDiscountAmount = Math.floor(123456 * 0.07);
    const expectedDiscountedAmount = 123456 - expectedDiscountAmount;
    expect(complexDiscountResult.discountAmount).toBe(expectedDiscountAmount);
    expect(complexDiscountResult.discountedAmount).toBe(expectedDiscountedAmount);
    expect(
      complexDiscountResult.discountedAmount + complexDiscountResult.discountAmount
    ).toBe(123456);
  });
});