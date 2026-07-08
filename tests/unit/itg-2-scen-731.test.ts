import { calculateDeviation } from "../../src/logic/it-6-2-2-2";

describe("相場乖離率段階別表示", () => {
  // SCEN-731
  test("乖離率の計算がNaNになった場合、エラーが記録される", () => {
    // ハッピーパス: 正常な数値計算
    const validResult = calculateDeviation({
      estimatedPrice: 1000000,
      marketPrice: 950000,
    });
    expect(validResult.deviationRate).toBe(5.26);
    expect(validResult.deviationAmount).toBe(50000);
    expect(validResult.hasError).toBe(false);
    expect(validResult.errorMessage).toBe("");

    // エラーケース1: estimatedPrice が null
    const nullEstimateResult = calculateDeviation({
      estimatedPrice: null,
      marketPrice: 950000,
    });
    expect(isNaN(nullEstimateResult.deviationRate)).toBe(true);
    expect(nullEstimateResult.hasError).toBe(true);
    expect(nullEstimateResult.errorMessage).toMatch(/予定価格/);
    expect(nullEstimateResult.errorLog).toMatch(/発生日時/);
    expect(nullEstimateResult.errorLog).toMatch(/NaN/);

    // エラーケース2: marketPrice が undefined
    const undefinedMarketResult = calculateDeviation({
      estimatedPrice: 1000000,
      marketPrice: undefined,
    });
    expect(isNaN(undefinedMarketResult.deviationRate)).toBe(true);
    expect(undefinedMarketResult.hasError).toBe(true);
    expect(undefinedMarketResult.errorMessage).toMatch(/相場価格/);
    expect(undefinedMarketResult.errorLog).toMatch(/処理内容/);

    // エラーケース3: estimatedPrice が非数値文字列
    const nonNumericEstimateResult = calculateDeviation({
      estimatedPrice: "abc" as any,
      marketPrice: 950000,
    });
    expect(isNaN(nonNumericEstimateResult.deviationRate)).toBe(true);
    expect(nonNumericEstimateResult.hasError).toBe(true);
    expect(nonNumericEstimateResult.errorMessage).toMatch(/入力値/);
    expect(nonNumericEstimateResult.errorLog).toMatch(/NaN発生原因/);

    // エラーケース4: marketPrice が非数値文字列
    const nonNumericMarketResult = calculateDeviation({
      estimatedPrice: 1000000,
      marketPrice: "xyz" as any,
    });
    expect(isNaN(nonNumericMarketResult.deviationRate)).toBe(true);
    expect(nonNumericMarketResult.hasError).toBe(true);
    expect(nonNumericMarketResult.errorMessage).toMatch(/修正/);

    // エラーケース5: 両方とも null
    const bothNullResult = calculateDeviation({
      estimatedPrice: null,
      marketPrice: null,
    });
    expect(isNaN(bothNullResult.deviationRate)).toBe(true);
    expect(bothNullResult.hasError).toBe(true);
    expect(bothNullResult.errorLog).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/); // ISO 形式の日時

    // エラーケース6: marketPrice が 0（ゼロ除算）
    const zeroDivisionResult = calculateDeviation({
      estimatedPrice: 1000000,
      marketPrice: 0,
    });
    expect(isNaN(zeroDivisionResult.deviationRate)).toBe(true);
    expect(zeroDivisionResult.hasError).toBe(true);
    expect(zeroDivisionResult.errorMessage).toMatch(/相場価格/);
  });
});