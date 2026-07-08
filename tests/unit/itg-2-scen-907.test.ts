import { validateOutlierThreshold } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-907
  test("外れ値判定の閾値が不正な場合にエラーを返す", () => {
    // 負の値を入力した場合
    expect(() => validateOutlierThreshold(-0.5)).toThrow(/閾値/);

    // 文字列を入力した場合
    expect(() => validateOutlierThreshold("invalid" as any)).toThrow(/閾値/);

    // null を入力した場合
    expect(() => validateOutlierThreshold(null as any)).toThrow(/閾値/);

    // undefined を入力した場合
    expect(() => validateOutlierThreshold(undefined as any)).toThrow(/閾値/);

    // NaN を入力した場合
    expect(() => validateOutlierThreshold(NaN)).toThrow(/閾値/);

    // 正の数値は成功
    expect(validateOutlierThreshold(0)).toBe(true);
    expect(validateOutlierThreshold(0.5)).toBe(true);
    expect(validateOutlierThreshold(1)).toBe(true);
    expect(validateOutlierThreshold(100)).toBe(true);
  });
});