import { analyzeDiagnosticQuality } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-980: [edge] 品質低下原因の自動診断と配置調整・改善施策提示 - 品質指標が閾値ちょうど（±0.1%以内）の場合、修正判定の必要性が明示的に結果に含まれる
  test("品質指標が閾値ちょうど（±0.1%以内）の場合、修正判定の必要性が明示的に診断結果に含まれ、配置調整・改善施策が提示される", () => {
    const threshold = 80.0; // 品質指標基準値: 80.0%
    const toleranceMargin = 0.1; // 許容誤差: ±0.1%

    // ケース 1: 品質指標が閾値ちょうど（80.0%）
    const qualityMetrics_exact = {
      assessorId: "A001",
      assessorName: "査定員A",
      estimateAccuracyRate: 80.0,
      marketDeviationRate: 5.5,
      consistencyScore: 78.2,
      processingTimeMinutes: 24.5,
      caseCount: 45,
      assessmentDate: "2024-01-15",
    };

    const diagnosis_exact = analyzeDiagnosticQuality(
      qualityMetrics_exact,
      threshold,
      toleranceMargin
    );

    expect(diagnosis_exact).toHaveProperty("requiresReview");
    expect(diagnosis_exact.requiresReview).toBe(true);
    expect(diagnosis_exact).toHaveProperty("necessityLevel");
    expect(diagnosis_exact.necessityLevel).toBe("REQUIRED");
    expect(diagnosis_exact).toHaveProperty("rootCauses");
    expect(Array.isArray(diagnosis_exact.rootCauses)).toBe(true);
    expect(diagnosis_exact).toHaveProperty("recommendations");
    expect(Array.isArray(diagnosis_exact.recommendations)).toBe(true);
    expect(diagnosis_exact.recommendations.length).toBeGreaterThan(0);
    expect(diagnosis_exact).toHaveProperty("staffingAdjustments");
    expect(diagnosis_exact.staffingAdjustments).toHaveProperty(
      "adjustmentRequired"
    );
    expect(diagnosis_exact.staffingAdjustments.adjustmentRequired).toBe(true);

    // ケース 2: 品質指標が閾値 + 0.08%（閾値内の上限）
    const qualityMetrics_upperBound = {
      assessorId: "A002",
      assessorName: "査定員B",
      estimateAccuracyRate: 80.08,
      marketDeviationRate: 6.2,
      consistencyScore: 79.1,
      processingTimeMinutes: 25.0,
      caseCount: 42,
      assessmentDate: "2024-01-15",
    };

    const diagnosis_upperBound = analyzeDiagnosticQuality(
      qualityMetrics_upperBound,
      threshold,
      toleranceMargin
    );

    expect(diagnosis_upperBound).toHaveProperty("requiresReview");
    expect(diagnosis_upperBound.requiresReview).toBe(true);
    expect(diagnosis_upperBound).toHaveProperty("necessityLevel");
    expect(diagnosis_upperBound.necessityLevel).toBe("REQUIRED");
    expect(diagnosis_upperBound).toHaveProperty("rootCauses");
    expect(diagnosis_upperBound).toHaveProperty("recommendations");
    expect(diagnosis_upperBound.recommendations.length).toBeGreaterThan(0);

    // ケース 3: 品質指標が閾値 - 0.09%（閾値内の下限）
    const qualityMetrics_lowerBound = {
      assessorId: "A003",
      assessorName: "査定員C",
      estimateAccuracyRate: 79.91,
      marketDeviationRate: 5.8,
      consistencyScore: 77.5,
      processingTimeMinutes: 26.0,
      caseCount: 48,
      assessmentDate: "2024-01-15",
    };

    const diagnosis_lowerBound = analyzeDiagnosticQuality(
      qualityMetrics_lowerBound,
      threshold,
      toleranceMargin
    );

    expect(diagnosis_lowerBound).toHaveProperty("requiresReview");
    expect(diagnosis_lowerBound.requiresReview).toBe(true);
    expect(diagnosis_lowerBound).toHaveProperty("necessityLevel");
    expect(diagnosis_lowerBound.necessityLevel).toBe("REQUIRED");
    expect(diagnosis_lowerBound).toHaveProperty("rootCauses");
    expect(diagnosis_lowerBound).toHaveProperty("recommendations");
    expect(diagnosis_lowerBound.recommendations.length).toBeGreaterThan(0);
    expect(diagnosis_lowerBound).toHaveProperty("staffingAdjustments");
    expect(diagnosis_lowerBound.staffingAdjustments).toHaveProperty(
      "recommendedAdjustment"
    );
    expect(typeof diagnosis_lowerBound.staffingAdjustments.recommendedAdjustment).toBe(
      "string"
    );

    // ケース 4: 品質指標が閾値内での差異は小さく、複数の推奨施策が提示される
    const qualityMetrics_edge = {
      assessorId: "A004",
      assessorName: "査定員D",
      estimateAccuracyRate: 80.0,
      marketDeviationRate: 5.9,
      consistencyScore: 78.8,
      processingTimeMinutes: 24.8,
      caseCount: 50,
      assessmentDate: "2024-01-15",
    };

    const diagnosis_edge = analyzeDiagnosticQuality(
      qualityMetrics_edge,
      threshold,
      toleranceMargin
    );

    expect(diagnosis_edge).toHaveProperty("necessityLevel");
    expect(["REQUIRED", "CONDITIONAL"]).toContain(
      diagnosis_edge.necessityLevel
    );
    expect(diagnosis_edge).toHaveProperty("recommendations");
    expect(diagnosis_edge.recommendations.length).toBeGreaterThanOrEqual(1);

    // 複数の推奨施策の構造を検証
    diagnosis_edge.recommendations.forEach((rec: any) => {
      expect(rec).toHaveProperty("action");
      expect(typeof rec.action).toBe("string");
      expect(rec).toHaveProperty("priority");
      expect(["HIGH", "MEDIUM", "LOW"]).toContain(rec.priority);
      expect(rec).toHaveProperty("expectedEffect");
      expect(typeof rec.expectedEffect).toBe("string");
    });

    // 配置調整の詳細が含まれることを検証
    expect(diagnosis_edge).toHaveProperty("staffingAdjustments");
    expect(diagnosis_edge.staffingAdjustments).toHaveProperty("action");
    expect(diagnosis_edge.staffingAdjustments).toHaveProperty("targetCount");
    expect(typeof diagnosis_edge.staffingAdjustments.targetCount).toBe("number");
    expect(diagnosis_edge.staffingAdjustments).toHaveProperty("executionTiming");
    expect(typeof diagnosis_edge.staffingAdjustments.executionTiming).toBe(
      "string"
    );

    // 診断タイムスタンプが記録されていることを検証
    expect(diagnosis_edge).toHaveProperty("diagnosisTimestamp");
    expect(typeof diagnosis_edge.diagnosisTimestamp).toBe("string");

    // 閾値との乖離量が記録されていることを検証
    expect(diagnosis_edge).toHaveProperty("thresholdDeviation");
    expect(typeof diagnosis_edge.thresholdDeviation).toBe("number");
    expect(Math.abs(diagnosis_edge.thresholdDeviation)).toBeLessThanOrEqual(
      0.1
    );

    // ケース 5: エラーテスト - 無効な入力（品質指標が負の値）
    const invalidMetrics = {
      assessorId: "A005",
      assessorName: "査定員E",
      estimateAccuracyRate: -5.0,
      marketDeviationRate: 5.5,
      consistencyScore: 80.0,
      processingTimeMinutes: 25.0,
      caseCount: 40,
      assessmentDate: "2024-01-15",
    };

    expect(() => {
      analyzeDiagnosticQuality(invalidMetrics, threshold, toleranceMargin);
    }).toThrow(/品質指標/);

    // ケース 6: エラーテスト - 無効な閾値（負の値）
    expect(() => {
      analyzeDiagnosticQuality(qualityMetrics_exact, -10, toleranceMargin);
    }).toThrow(/閾値/);

    // ケース 7: エラーテスト - 無効な許容誤差（100%以上）
    expect(() => {
      analyzeDiagnosticQuality(qualityMetrics_exact, threshold, 150);
    }).toThrow(/許容誤差/);
  });
});