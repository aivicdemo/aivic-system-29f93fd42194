import { validateBillingAmountValidity } from "../../src/logic/it-1781935279444-2-2-1";

describe("請求データ妥当性自動検証機能", () => {
  // SCEN-820
  test("請求金額が異常値の場合に警告が表示される", () => {
    // 負数入力時の検証
    const negativeAmountResult = validateBillingAmountValidity({
      billingAmount: -10000,
    });
    expect(negativeAmountResult.isValid).toBe(false);
    expect(negativeAmountResult.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringMatching(/請求金額が異常値です/),
        }),
      ])
    );

    // 0入力時の検証
    const zeroAmountResult = validateBillingAmountValidity({
      billingAmount: 0,
    });
    expect(zeroAmountResult.isValid).toBe(false);
    expect(zeroAmountResult.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringMatching(/請求金額が異常値です/),
        }),
      ])
    );

    // 正常な正数値入力時の検証
    const positiveAmountResult = validateBillingAmountValidity({
      billingAmount: 50000,
    });
    expect(positiveAmountResult.isValid).toBe(true);
    expect(positiveAmountResult.warnings).toEqual([]);
  });
});