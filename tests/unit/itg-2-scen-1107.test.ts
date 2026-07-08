import { aggregateAssessorMetrics } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン・処理時間分析", () => {
  // SCEN-1107
  test("月次査定結果分析・集計機能 - 査定員別の判定精度・乖離パターン・処理時間を正常に集計し比較分析できる", () => {
    // 【前提】
    // - 3名の査定員による査定結果データが蓄積
    // - 査定員A: 10件処理、判定精度80%、乖離パターン分布
    // - 査定員B: 12件処理、判定精度90%、乖離パターン分布
    // - 査定員C: 8件処理、判定精度75%、乖離パターン分布
    // - 各査定員の処理時間記録が完全

    const assessmentDataList = [
      {
        assessor_id: "assessor_001",
        assessor_name: "査定員A",
        assessment_count: 10,
        correct_count: 8,
        total_processing_time_minutes: 480,
        deviation_pattern_under_count: 3,
        deviation_pattern_over_count: 2,
        deviation_pattern_standard_count: 5,
      },
      {
        assessor_id: "assessor_002",
        assessor_name: "査定員B",
        assessment_count: 12,
        correct_count: 11,
        total_processing_time_minutes: 540,
        deviation_pattern_under_count: 2,
        deviation_pattern_over_count: 1,
        deviation_pattern_standard_count: 9,
      },
      {
        assessor_id: "assessor_003",
        assessor_name: "査定員C",
        assessment_count: 8,
        correct_count: 6,
        total_processing_time_minutes: 400,
        deviation_pattern_under_count: 2,
        deviation_pattern_over_count: 3,
        deviation_pattern_standard_count: 3,
      },
    ];

    // 【実行】
    const result = aggregateAssessorMetrics(assessmentDataList);

    // 【期待値計算】
    // 判定精度（正答率） = 正答件数 / 総件数 * 100
    // 査定員A: 8/10 * 100 = 80%
    // 査定員B: 11/12 * 100 ≈ 91.67%
    // 査定員C: 6/8 * 100 = 75%

    // 乖離パターン割合 = 各パターン件数 / 総件数 * 100
    // 査定員A: under=30%, over=20%, standard=50%
    // 査定員B: under=16.67%, over=8.33%, standard=75%
    // 査定員C: under=25%, over=37.5%, standard=37.5%

    // 1件あたりの平均処理時間 = 総処理時間 / 件数（単位:分）
    // 査定員A: 480/10 = 48分
    // 査定員B: 540/12 = 45分
    // 査定員C: 400/8 = 50分

    // 全体合計値
    // 総件数: 10 + 12 + 8 = 30件
    // 総正答件数: 8 + 11 + 6 = 25件
    // 全体判定精度: 25/30 * 100 ≈ 83.33%
    // 総処理時間: 480 + 540 + 400 = 1420分

    // 【検証】
    // 1. 返却データが存在し、配列形式であることを確認
    expect(Array.isArray(result.metrics)).toBe(true);
    expect(result.metrics.length).toBe(3);

    // 2. 査定員A の判定精度を検証
    const assessorA = result.metrics.find(
      (m) => m.assessor_id === "assessor_001"
    );
    expect(assessorA).toBeDefined();
    expect(assessorA.accuracy_rate).toBe(80);
    expect(assessorA.assessment_count).toBe(10);
    expect(assessorA.avg_processing_time_minutes).toBe(48);

    // 3. 査定員A の乖離パターン分布を検証
    expect(assessorA.deviation_pattern_under_percentage).toBeCloseTo(30, 1);
    expect(assessorA.deviation_pattern_over_percentage).toBeCloseTo(20, 1);
    expect(assessorA.deviation_pattern_standard_percentage).toBeCloseTo(50, 1);

    // 4. 査定員B の判定精度を検証
    const assessorB = result.metrics.find(
      (m) => m.assessor_id === "assessor_002"
    );
    expect(assessorB).toBeDefined();
    expect(assessorB.accuracy_rate).toBeCloseTo(91.67, 1);
    expect(assessorB.assessment_count).toBe(12);
    expect(assessorB.avg_processing_time_minutes).toBe(45);

    // 5. 査定員B の乖離パターン分布を検証
    expect(assessorB.deviation_pattern_under_percentage).toBeCloseTo(16.67, 1);
    expect(assessorB.deviation_pattern_over_percentage).toBeCloseTo(8.33, 1);
    expect(assessorB.deviation_pattern_standard_percentage).toBeCloseTo(75, 1);

    // 6. 査定員C の判定精度を検証
    const assessorC = result.metrics.find(
      (m) => m.assessor_id === "assessor_003"
    );
    expect(assessorC).toBeDefined();
    expect(assessorC.accuracy_rate).toBe(75);
    expect(assessorC.assessment_count).toBe(8);
    expect(assessorC.avg_processing_time_minutes).toBe(50);

    // 7. 査定員C の乖離パターン分布を検証
    expect(assessorC.deviation_pattern_under_percentage).toBeCloseTo(25, 1);
    expect(assessorC.deviation_pattern_over_percentage).toBeCloseTo(37.5, 1);
    expect(assessorC.deviation_pattern_standard_percentage).toBeCloseTo(37.5, 1);

    // 8. 全体集計値を検証
    expect(result.summary).toBeDefined();
    expect(result.summary.total_assessment_count).toBe(30);
    expect(result.summary.total_correct_count).toBe(25);
    expect(result.summary.overall_accuracy_rate).toBeCloseTo(83.33, 1);
    expect(result.summary.total_processing_time_minutes).toBe(1420);
    expect(result.summary.average_processing_time_minutes).toBeCloseTo(47.33, 1);

    // 9. 複数査定員データが比較可能な形式であることを確認
    expect(result.metrics[0]).toHaveProperty("assessor_id");
    expect(result.metrics[0]).toHaveProperty("assessor_name");
    expect(result.metrics[0]).toHaveProperty("accuracy_rate");
    expect(result.metrics[0]).toHaveProperty("assessment_count");
    expect(result.metrics[0]).toHaveProperty("avg_processing_time_minutes");
    expect(result.metrics[0]).toHaveProperty(
      "deviation_pattern_under_percentage"
    );
    expect(result.metrics[0]).toHaveProperty(
      "deviation_pattern_over_percentage"
    );
    expect(result.metrics[0]).toHaveProperty(
      "deviation_pattern_standard_percentage"
    );

    // 10. エクスポート用CSV形式データが生成されていることを確認
    expect(result.export_csv).toBeDefined();
    expect(typeof result.export_csv).toBe("string");
    expect(result.export_csv).toContain("assessor_id");
    expect(result.export_csv).toContain("accuracy_rate");
    expect(result.export_csv).toContain("avg_processing_time_minutes");
    expect(result.export_csv).toContain("査定員A");
    expect(result.export_csv).toContain("査定員B");
    expect(result.export_csv).toContain("査定員C");

    // 11. CSV出力に全必須カラムが含まれていることを確認
    const csv_lines = result.export_csv.split("\n");
    expect(csv_lines.length).toBeGreaterThanOrEqual(4); // ヘッダー + 3行データ
    const header = csv_lines[0];
    expect(header).toContain("assessor_id");
    expect(header).toContain("assessor_name");
    expect(header).toContain("accuracy_rate");
    expect(header).toContain("assessment_count");
    expect(header).toContain("avg_processing_time_minutes");
    expect(header).toContain("deviation_pattern_under_percentage");
    expect(header).toContain("deviation_pattern_over_percentage");
    expect(header).toContain("deviation_pattern_standard_percentage");

    // 12. 各査定員のデータがCSVに正しく含まれていることを確認
    expect(csv_lines.some((line) => line.includes("assessor_001"))).toBe(true);
    expect(csv_lines.some((line) => line.includes("assessor_002"))).toBe(true);
    expect(csv_lines.some((line) => line.includes("assessor_003"))).toBe(true);

    // 13. 集計データの合計値が各査定員データの合計と一致することを確認
    const sum_assessment_count = result.metrics.reduce(
      (sum, m) => sum + m.assessment_count,
      0
    );
    expect(sum_assessment_count).toBe(
      result.summary.total_assessment_count
    );

    const sum_correct_count = result.metrics.reduce(
      (sum, m) => sum + Math.round((m.accuracy_rate / 100) * m.assessment_count),
      0
    );
    expect(sum_correct_count).toBe(result.summary.total_correct_count);

    const sum_processing_time = result.metrics.reduce(
      (sum, m) => sum + m.avg_processing_time_minutes * m.assessment_count,
      0
    );
    expect(sum_processing_time).toBe(
      result.summary.total_processing_time_minutes
    );

    // 14. 返却値の構造が完全であることを確認
    expect(result).toHaveProperty("metrics");
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("export_csv");
    expect(result).toHaveProperty("generated_at");

    // 15. 生成時刻が記録されていることを確認
    expect(result.generated_at).toBeDefined();
    expect(typeof result.generated_at).toBe("string");
  });
});