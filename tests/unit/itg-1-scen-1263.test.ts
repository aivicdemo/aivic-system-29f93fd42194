import { describe, it, expect, beforeEach } from "@jest/globals";
import { applyDiscount } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1263: [edge] 割引判定・照合機能 - 割引率が 0 ～ 100% の範囲外の場合、境界値エラーとして判定される
  it("should throw boundary value error when discount rate is outside 0-100% range", () => {
    const baseAmount = 10000;

    // Test case 1: -0.1% (below minimum boundary)
    expect(() =>
      applyDiscount({
        baseAmount,
        discountRate: -0.1,
      })
    ).toThrow(/割引率/);

    // Test case 2: 100.1% (above maximum boundary)
    expect(() =>
      applyDiscount({
        baseAmount,
        discountRate: 100.1,
      })
    ).toThrow(/割引率/);

    // Test case 3: -100% (significantly below range)
    expect(() =>
      applyDiscount({
        baseAmount,
        discountRate: -100,
      })
    ).toThrow(/割引率/);

    // Test case 4: 200% (significantly above range)
    expect(() =>
      applyDiscount({
        baseAmount,
        discountRate: 200,
      })
    ).toThrow(/割引率/);

    // Valid boundary cases should succeed
    const resultZeroPercent = applyDiscount({
      baseAmount,
      discountRate: 0,
    });
    expect(resultZeroPercent.discountedAmount).toBe(10000);
    expect(resultZeroPercent.discountRate).toBe(0);

    const resultHundredPercent = applyDiscount({
      baseAmount,
      discountRate: 100,
    });
    expect(resultHundredPercent.discountedAmount).toBe(0);
    expect(resultHundredPercent.discountRate).toBe(100);

    const resultFiftyPercent = applyDiscount({
      baseAmount,
      discountRate: 50,
    });
    expect(resultFiftyPercent.discountedAmount).toBe(5000);
    expect(resultFiftyPercent.discountRate).toBe(50);
  });
});