import {
  measureModelAccuracyBeforeAfter,
  calculateAccuracyImprovement,
  recordAccuracyMeasurement,
  generateAccuracyComparisonReport,
} from "../../src/logic/it-6-3-1";

describe("モデル更新前後精度計測・比較機能", () => {
  // SCEN-1116
  test("モデル再学習完了後にOCR精度とAI判定精度の更新前後値を自動計測できる", () => {
    // ===== テスト環境セットアップ: モデル更新前の基準値を記録 =====
    const baselineOcrAccuracy = 0.87; // 87%
    const baselineAiJudgmentAccuracy = 0.92; // 92%
    const modelUpdateTimestamp = new Date("2024-06-15T10:00:00Z");

    // ===== モデル再学習プロセス完了後のOCR精度とAI判定精度を計測 =====
    const afterModelUpdateOcrAccuracy = 0.89; // 89%
    const afterModelUpdateAiJudgmentAccuracy = 0.95; // 95%
    const measurementTimestamp = new Date("2024-06-15T10:30:00Z");

    // ===== 精度計測を実行 =====
    const accuracyMeasurement = measureModelAccuracyBeforeAfter({
      baselineOcrAccuracy,
      baselineAiJudgmentAccuracy,
      baselineTimestamp: modelUpdateTimestamp,
      afterUpdateOcrAccuracy: afterModelUpdateOcrAccuracy,
      afterUpdateAiJudgmentAccuracy: afterModelUpdateAiJudgmentAccuracy,
      measurementTimestamp,
    });

    // ===== 更新後のOCR精度値を検証 =====
    expect(accuracyMeasurement.afterOcrAccuracy).toBe(0.89);

    // ===== 更新後のAI判定精度値を検証 =====
    expect(accuracyMeasurement.afterAiJudgmentAccuracy).toBe(0.95);

    // ===== 精度差分値を計算・検証 =====
    const improvementData = calculateAccuracyImprovement({
      beforeOcrAccuracy: baselineOcrAccuracy,
      afterOcrAccuracy: afterModelUpdateOcrAccuracy,
      beforeAiJudgmentAccuracy: baselineAiJudgmentAccuracy,
      afterAiJudgmentAccuracy: afterModelUpdateAiJudgmentAccuracy,
    });

    // OCR精度の改善度: 0.89 - 0.87 = 0.02 (2%)
    expect(improvementData.ocrAccuracyImprovement).toBe(0.02);

    // AI判定精度の改善度: 0.95 - 0.92 = 0.03 (3%)
    expect(improvementData.aiJudgmentAccuracyImprovement).toBe(0.03);

    // 改善率（相対値）: (0.89 - 0.87) / 0.87 = 2.30%
    expect(Math.round(improvementData.ocrImprovementRate * 100) / 100).toBe(0.02);

    // AI判定改善率（相対値）: (0.95 - 0.92) / 0.92 = 3.26%
    expect(Math.round(improvementData.aiJudgmentImprovementRate * 100) / 100).toBe(0.03);

    // ===== 精度計測結果がシステムに自動記録されることを検証 =====
    const recordedMeasurement = recordAccuracyMeasurement({
      measurementId: "MEAS-001",
      modelUpdateId: "MODEL-UPD-001",
      beforeOcrAccuracy: baselineOcrAccuracy,
      afterOcrAccuracy: afterModelUpdateOcrAccuracy,
      beforeAiJudgmentAccuracy: baselineAiJudgmentAccuracy,
      afterAiJudgmentAccuracy: afterModelUpdateAiJudgmentAccuracy,
      recordedAt: measurementTimestamp,
      recordedBy: "system",
    });

    expect(recordedMeasurement.measurementId).toBe("MEAS-001");
    expect(recordedMeasurement.modelUpdateId).toBe("MODEL-UPD-001");
    expect(recordedMeasurement.isRecorded).toBe(true);
    expect(recordedMeasurement.recordedAt).toEqual(measurementTimestamp);

    // ===== 更新前後の精度値の比較結果がレポートとして出力されることを検証 =====
    const comparisonReport = generateAccuracyComparisonReport({
      beforeOcrAccuracy: baselineOcrAccuracy,
      afterOcrAccuracy: afterModelUpdateOcrAccuracy,
      beforeAiJudgmentAccuracy: baselineAiJudgmentAccuracy,
      afterAiJudgmentAccuracy: afterModelUpdateAiJudgmentAccuracy,
      ocrImprovementPercentage:
        ((afterModelUpdateOcrAccuracy - baselineOcrAccuracy) / baselineOcrAccuracy) * 100,
      aiJudgmentImprovementPercentage:
        ((afterModelUpdateAiJudgmentAccuracy - baselineAiJudgmentAccuracy) /
          baselineAiJudgmentAccuracy) *
        100,
      measurementDate: measurementTimestamp,
    });

    expect(comparisonReport.reportType).toBe("MODEL_ACCURACY_COMPARISON");
    expect(comparisonReport.beforeOcrAccuracy).toBe(0.87);
    expect(comparisonReport.afterOcrAccuracy).toBe(0.89);
    expect(comparisonReport.beforeAiJudgmentAccuracy).toBe(0.92);
    expect(comparisonReport.afterAiJudgmentAccuracy).toBe(0.95);
    // OCR改善率: (0.89 - 0.87) / 0.87 * 100 ≈ 2.30%
    expect(Math.round(comparisonReport.ocrImprovementPercentage * 100) / 100).toBe(2.30);
    // AI判定改善率: (0.95 - 0.92) / 0.92 * 100 ≈ 3.26%
    expect(Math.round(comparisonReport.aiJudgmentImprovementPercentage * 100) / 100).toBe(3.26);
    expect(comparisonReport.status).toBe("COMPLETED");
    expect(comparisonReport.isSuccessful).toBe(true);
  });
});