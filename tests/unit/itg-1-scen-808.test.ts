import { describe, test, expect } from "@jest/globals";
import { validateBillingDataAnomalies } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証", () => {
  // SCEN-808
  test("請求額が契約金額の150%を超える異常値である場合に警告が表示される", () => {
    const contractAmount = 100000;
    const billingAmount = 151000;

    const result = validateBillingDataAnomalies({
      contractAmount,
      billingAmount,
    });

    expect(result.isAnomalous).toBe(true);
    expect(result.warningLevel).toBe("high");
    expect(result.excessPercentage).toBe(51);
    expect(result.warningMessage).toContain("異常値");
    expect(result.warningMessage).toContain("151000");
    expect(result.warningMessage).toContain("100000");
    expect(result.warningMessage).toContain("151");
    expect(result.details).toEqual({
      contractAmount: 100000,
      billingAmount: 151000,
      threshold: 150000,
      excessAmount: 1000,
      excessPercentage: 51,
    });
  });
});