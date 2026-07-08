import { describe, test, expect } from "@jest/globals";
import { calculateScalingCoefficient } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1314: [edge] スケーリング係数と補正係数の自動計算 - 人員スケーリング係数が100倍以上の極値となる場合、上限チェックエラーを検出する
  test("人員スケーリング係数が101以上の極値の場合、上限値超過エラーを検出し計算を中断する", () => {
    // 入力: 人員スケーリング係数 = 101 (100倍以上の上限超過)
    const input_staffScalingCoefficient = 101;
    const input_initialStaffCount = 30;
    const input_targetStaffCount = 700;
    const input_accuracyDataPoints = 45;
    const input_processTimeMinutes = 1350;

    // 期待結果: 上限値超過を示すエラーが発動
    expect(() =>
      calculateScalingCoefficient({
        staffScalingCoefficient: input_staffScalingCoefficient,
        initialStaffCount: input_initialStaffCount,
        targetStaffCount: input_targetStaffCount,
        accuracyDataPoints: input_accuracyDataPoints,
        processTimeMinutes: input_processTimeMinutes,
      })
    ).toThrow(/上限値/);
  });

  test("人員スケーリング係数が100.0の上限値（含む）の場合、計算が実行される", () => {
    // 入力: 人員スケーリング係数 = 100.0 (上限値)
    const input_staffScalingCoefficient = 100.0;
    const input_initialStaffCount = 30;
    const input_targetStaffCount = 700;
    const input_accuracyDataPoints = 45;
    const input_processTimeMinutes = 1350;

    // 期待結果: 計算が正常に実行される
    // staffScalingCoefficient = (targetStaffCount / initialStaffCount) = (700 / 30) = 23.333...
    // 与えられた係数100.0と実計算値の乖離は考慮し、与えられた係数を使用
    // 補正後の処理時間 = processTimeMinutes / staffScalingCoefficient = 1350 / 100.0 = 13.5 分
    // 補正後の精度 = accuracyDataPoints * staffScalingCoefficient = 45 * 100.0 = 4500
    const result = calculateScalingCoefficient({
      staffScalingCoefficient: input_staffScalingCoefficient,
      initialStaffCount: input_initialStaffCount,
      targetStaffCount: input_targetStaffCount,
      accuracyDataPoints: input_accuracyDataPoints,
      processTimeMinutes: input_processTimeMinutes,
    });

    expect(result.staffScalingCoefficient).toBe(100.0);
    expect(result.correctedProcessTimeMinutes).toBe(13.5);
    expect(result.correctedAccuracyDataPoints).toBe(4500);
    expect(result.errorDetected).toBe(false);
  });

  test("人員スケーリング係数が50.5の正常範囲の場合、補正係数が正確に計算される", () => {
    // 入力: 人員スケーリング係数 = 50.5 (正常範囲)
    const input_staffScalingCoefficient = 50.5;
    const input_initialStaffCount = 30;
    const input_targetStaffCount = 700;
    const input_accuracyDataPoints = 80;
    const input_processTimeMinutes = 2025;

    // 期待結果: 計算が正常に実行される
    // 補正後の処理時間 = processTimeMinutes / staffScalingCoefficient = 2025 / 50.5 = 40.099... ≈ 40.1 分
    // 補正後の精度 = accuracyDataPoints * staffScalingCoefficient = 80 * 50.5 = 4040
    const result = calculateScalingCoefficient({
      staffScalingCoefficient: input_staffScalingCoefficient,
      initialStaffCount: input_initialStaffCount,
      targetStaffCount: input_targetStaffCount,
      accuracyDataPoints: input_accuracyDataPoints,
      processTimeMinutes: input_processTimeMinutes,
    });

    expect(result.staffScalingCoefficient).toBe(50.5);
    expect(result.correctedProcessTimeMinutes).toBeCloseTo(40.1, 1);
    expect(result.correctedAccuracyDataPoints).toBe(4040);
    expect(result.errorDetected).toBe(false);
  });

  test("人員スケーリング係数が101.1の場合、上限値超過エラーメッセージが記録される", () => {
    // 入力: 人員スケーリング係数 = 101.1 (明らかな上限超過)
    const input_staffScalingCoefficient = 101.1;
    const input_initialStaffCount = 30;
    const input_targetStaffCount = 700;
    const input_accuracyDataPoints = 50;
    const input_processTimeMinutes = 1500;

    // 期待結果: エラーメッセージに上限値超過を示すキーワードが含まれる
    expect(() =>
      calculateScalingCoefficient({
        staffScalingCoefficient: input_staffScalingCoefficient,
        initialStaffCount: input_initialStaffCount,
        targetStaffCount: input_targetStaffCount,
        accuracyDataPoints: input_accuracyDataPoints,
        processTimeMinutes: input_processTimeMinutes,
      })
    ).toThrow(/上限値/);
  });

  test("人員スケーリング係数が1000の極値の場合、上限値超過エラーを検出する", () => {
    // 入力: 人員スケーリング係数 = 1000 (極度の超過)
    const input_staffScalingCoefficient = 1000;
    const input_initialStaffCount = 30;
    const input_targetStaffCount = 700;
    const input_accuracyDataPoints = 30;
    const input_processTimeMinutes = 900;

    // 期待結果: 上限値超過エラーが発動
    expect(() =>
      calculateScalingCoefficient({
        staffScalingCoefficient: input_staffScalingCoefficient,
        initialStaffCount: input_initialStaffCount,
        targetStaffCount: input_targetStaffCount,
        accuracyDataPoints: input_accuracyDataPoints,
        processTimeMinutes: input_processTimeMinutes,
      })
    ).toThrow(/上限値/);
  });

  test("人員スケーリング係数が0.5の下限値の場合、計算が正常に実行される", () => {
    // 入力: 人員スケーリング係数 = 0.5 (下限値)
    const input_staffScalingCoefficient = 0.5;
    const input_initialStaffCount = 30;
    const input_targetStaffCount = 700;
    const input_accuracyDataPoints = 60;
    const input_processTimeMinutes = 1800;

    // 期待結果: 計算が正常に実行される
    // 補正後の処理時間 = processTimeMinutes / staffScalingCoefficient = 1800 / 0.5 = 3600 分
    // 補正後の精度 = accuracyDataPoints * staffScalingCoefficient = 60 * 0.5 = 30
    const result = calculateScalingCoefficient({
      staffScalingCoefficient: input_staffScalingCoefficient,
      initialStaffCount: input_initialStaffCount,
      targetStaffCount: input_targetStaffCount,
      accuracyDataPoints: input_accuracyDataPoints,
      processTimeMinutes: input_processTimeMinutes,
    });

    expect(result.staffScalingCoefficient).toBe(0.5);
    expect(result.correctedProcessTimeMinutes).toBe(3600);
    expect(result.correctedAccuracyDataPoints).toBe(30);
    expect(result.errorDetected).toBe(false);
  });
});