import { validateAmountRangeDefinition } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-895: [error] 金額帯別の許容乖離幅定義 - 定義済み金額帯に該当しない項目に対してエラーが返却される
  test("定義済み金額帯に該当しない項目に対してエラーが返却される", () => {
    // 定義済み金額帯の範囲
    const definedRanges = [
      { min: 0, max: 1000000, rangeId: "range_small" },
      { min: 1000001, max: 5000000, rangeId: "range_medium" },
      { min: 5000001, max: 50000000, rangeId: "range_large" },
    ];

    // テストケース1: 負の値（定義済み金額帯外）
    expect(() => {
      validateAmountRangeDefinition(-100000, definedRanges);
    }).toThrow(/金額帯の範囲外/);

    // テストケース2: 極めて高い値（定義済み金額帯外）
    expect(() => {
      validateAmountRangeDefinition(100000000, definedRanges);
    }).toThrow(/無効な金額帯/);

    // テストケース3: null 値（定義済み金額帯外）
    expect(() => {
      validateAmountRangeDefinition(null as any, definedRanges);
    }).toThrow(/金額帯/);

    // テストケース4: 正常値（定義済み金額帯内）- エラーが発生しないことを確認
    const validAmount = 2500000;
    const result = validateAmountRangeDefinition(validAmount, definedRanges);
    expect(result).toEqual({
      isValid: true,
      matchedRangeId: "range_medium",
      amount: 2500000,
    });

    // テストケース5: 境界値（定義済み金額帯の下限値）- 正常に処理される
    const boundaryMinAmount = 1000000;
    const resultMin = validateAmountRangeDefinition(
      boundaryMinAmount,
      definedRanges
    );
    expect(resultMin).toEqual({
      isValid: true,
      matchedRangeId: "range_small",
      amount: 1000000,
    });

    // テストケース6: 境界値（定義済み金額帯の上限値）- 正常に処理される
    const boundaryMaxAmount = 5000000;
    const resultMax = validateAmountRangeDefinition(
      boundaryMaxAmount,
      definedRanges
    );
    expect(resultMax).toEqual({
      isValid: true,
      matchedRangeId: "range_medium",
      amount: 5000000,
    });

    // テストケース7: 空の金額帯定義リスト
    expect(() => {
      validateAmountRangeDefinition(2500000, []);
    }).toThrow(/金額帯の範囲外/);

    // テストケース8: 定義済み金額帯に該当しないギャップ値（例：500000.5）
    const gapAmount = 500000.5;
    const resultGap = validateAmountRangeDefinition(gapAmount, definedRanges);
    expect(resultGap).toEqual({
      isValid: true,
      matchedRangeId: "range_small",
      amount: 500000.5,
    });

    // テストケース9: 文字列が渡された場合のエラーハンドリング
    expect(() => {
      validateAmountRangeDefinition("invalid" as any, definedRanges);
    }).toThrow(/無効な金額帯/);

    // テストケース10: 0 値（定義済み金額帯内）- 正常に処理される
    const zeroAmount = 0;
    const resultZero = validateAmountRangeDefinition(zeroAmount, definedRanges);
    expect(resultZero).toEqual({
      isValid: true,
      matchedRangeId: "range_small",
      amount: 0,
    });
  });
});