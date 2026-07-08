import { calculateImprovementVerification } from "../../src/logic/it-6-2-1-1";

describe("改善対策効果検証機能 - 期待改善率が0%の場合の判定", () => {
  test("SCEN-1271: 期待改善率0%で改善後精度が改善前以上の場合、成功と判定される", () => {
    const input = {
      expectedImprovementRate: 0,
      preImprovementAccuracy: 85,
      postImprovementAccuracy: 85,
    };

    const result = calculateImprovementVerification(input);

    expect(result.isSuccess).toBe(true);
    expect(result.judgmentResult).toBe("成功");
    expect(result.preImprovementAccuracy).toBe(85);
    expect(result.postImprovementAccuracy).toBe(85);
    expect(result.actualImprovementRate).toBe(0);
    expect(result.meetsExpectation).toBe(true);
  });

  test("SCEN-1271: 期待改善率0%で改善後精度が改善前より高い場合、成功と判定される", () => {
    const input = {
      expectedImprovementRate: 0,
      preImprovementAccuracy: 80,
      postImprovementAccuracy: 88,
    };

    const result = calculateImprovementVerification(input);

    expect(result.isSuccess).toBe(true);
    expect(result.judgmentResult).toBe("成功");
    expect(result.actualImprovementRate).toBe(8);
    expect(result.meetsExpectation).toBe(true);
  });

  test("SCEN-1271: 期待改善率0%で改善後精度が改善前より低い場合、失敗と判定される", () => {
    const input = {
      expectedImprovementRate: 0,
      preImprovementAccuracy: 85,
      postImprovementAccuracy: 80,
    };

    const result = calculateImprovementVerification(input);

    expect(result.isSuccess).toBe(false);
    expect(result.judgmentResult).toBe("失敗");
    expect(result.actualImprovementRate).toBe(-5);
    expect(result.meetsExpectation).toBe(false);
  });

  test("SCEN-1271: 期待改善率が正の値の場合、改善前後精度の差が期待値を満たすかで判定される", () => {
    const input = {
      expectedImprovementRate: 5,
      preImprovementAccuracy: 80,
      postImprovementAccuracy: 86,
    };

    const result = calculateImprovementVerification(input);

    expect(result.isSuccess).toBe(true);
    expect(result.judgmentResult).toBe("成功");
    expect(result.actualImprovementRate).toBe(6);
    expect(result.meetsExpectation).toBe(true);
  });

  test("SCEN-1271: 期待改善率が正の値で改善率が不足の場合、失敗と判定される", () => {
    const input = {
      expectedImprovementRate: 10,
      preImprovementAccuracy: 80,
      postImprovementAccuracy: 84,
    };

    const result = calculateImprovementVerification(input);

    expect(result.isSuccess).toBe(false);
    expect(result.judgmentResult).toBe("失敗");
    expect(result.actualImprovementRate).toBe(4);
    expect(result.meetsExpectation).toBe(false);
  });

  test("SCEN-1271: 改善前精度100%、改善後精度100%、期待改善率0%の場合、成功と判定される", () => {
    const input = {
      expectedImprovementRate: 0,
      preImprovementAccuracy: 100,
      postImprovementAccuracy: 100,
    };

    const result = calculateImprovementVerification(input);

    expect(result.isSuccess).toBe(true);
    expect(result.judgmentResult).toBe("成功");
    expect(result.actualImprovementRate).toBe(0);
    expect(result.meetsExpectation).toBe(true);
  });

  test("SCEN-1271: 不正な入力（改善前精度が負の値）の場合、エラーが発生する", () => {
    const input = {
      expectedImprovementRate: 0,
      preImprovementAccuracy: -10,
      postImprovementAccuracy: 85,
    };

    expect(() => calculateImprovementVerification(input)).toThrow(/精度/);
  });

  test("SCEN-1271: 不正な入力（期待改善率が負の値）の場合、エラーが発生する", () => {
    const input = {
      expectedImprovementRate: -5,
      preImprovementAccuracy: 85,
      postImprovementAccuracy: 90,
    };

    expect(() => calculateImprovementVerification(input)).toThrow(/改善率/);
  });

  test("SCEN-1271: 不正な入力（改善後精度が100を超える）の場合、エラーが発生する", () => {
    const input = {
      expectedImprovementRate: 0,
      preImprovementAccuracy: 85,
      postImprovementAccuracy: 105,
    };

    expect(() => calculateImprovementVerification(input)).toThrow(/精度/);
  });
});