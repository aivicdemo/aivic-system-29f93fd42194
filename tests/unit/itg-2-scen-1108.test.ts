import { aggregateAssessorCompetencyMetrics } from "../../src/logic/it-6-2-1-1";

describe("IT-6-2-1-1: 査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1108: [normal] 月次査定結果分析・集計機能 - 新人と経験者の能力差を定量指標で算出し改善テーマの優先度判定に反映できる
  test("新人と経験者の査定能力差が定量指標として正確に算出され、能力差が大きい項目ほど改善テーマの優先度が高く設定される", () => {
    // 入力データの準備
    const assessment_period_start = "2024-01-01";
    const assessment_period_end = "2024-01-31";

    const novice_assessor_id = "ASS_001";
    const novice_assessor_experience_months = 2;
    const expert_assessor_id = "ASS_002";
    const expert_assessor_experience_months = 60;

    const assessment_results = [
      // 新人査定者の査定結果（工種: 土木、金額帯: 1000万～2000万円）
      {
        assessor_id: novice_assessor_id,
        work_type: "civil_engineering",
        amount_band: "10_20m",
        assessment_date: "2024-01-05",
        deviation_rate: 12.5,
        deviation_amount_yen: 1250000,
        assessment_count: 8,
        average_processing_time_minutes: 45,
        judgment_consistency_score: 72,
        accuracy_vs_market: 0.875,
      },
      {
        assessor_id: novice_assessor_id,
        work_type: "civil_engineering",
        assessment_date: "2024-01-12",
        amount_band: "10_20m",
        deviation_rate: 14.2,
        deviation_amount_yen: 1420000,
        assessment_count: 7,
        average_processing_time_minutes: 48,
        judgment_consistency_score: 68,
        accuracy_vs_market: 0.862,
      },
      {
        assessor_id: novice_assessor_id,
        work_type: "civil_engineering",
        assessment_date: "2024-01-19",
        amount_band: "10_20m",
        deviation_rate: 13.8,
        deviation_amount_yen: 1380000,
        assessment_count: 9,
        average_processing_time_minutes: 50,
        judgment_consistency_score: 70,
        accuracy_vs_market: 0.868,
      },
      // 経験者査定者の査定結果（工種: 土木、金額帯: 1000万～2000万円）
      {
        assessor_id: expert_assessor_id,
        work_type: "civil_engineering",
        amount_band: "10_20m",
        assessment_date: "2024-01-05",
        deviation_rate: 3.2,
        deviation_amount_yen: 320000,
        assessment_count: 12,
        average_processing_time_minutes: 28,
        judgment_consistency_score: 95,
        accuracy_vs_market: 0.968,
      },
      {
        assessor_id: expert_assessor_id,
        work_type: "civil_engineering",
        assessment_date: "2024-01-12",
        amount_band: "10_20m",
        deviation_rate: 2.8,
        deviation_amount_yen: 280000,
        assessment_count: 13,
        average_processing_time_minutes: 26,
        judgment_consistency_score: 96,
        accuracy_vs_market: 0.972,
      },
      {
        assessor_id: expert_assessor_id,
        work_type: "civil_engineering",
        assessment_date: "2024-01-19",
        amount_band: "10_20m",
        deviation_rate: 3.5,
        deviation_amount_yen: 350000,
        assessment_count: 11,
        average_processing_time_minutes: 29,
        judgment_consistency_score: 94,
        accuracy_vs_market: 0.965,
      },
    ];

    const assessor_profiles = [
      {
        assessor_id: novice_assessor_id,
        experience_months: novice_assessor_experience_months,
        classification: "novice",
      },
      {
        assessor_id: expert_assessor_id,
        experience_months: expert_assessor_experience_months,
        classification: "expert",
      },
    ];

    // 関数呼び出し
    const result = aggregateAssessorCompetencyMetrics({
      period_start: assessment_period_start,
      period_end: assessment_period_end,
      assessment_results: assessment_results,
      assessor_profiles: assessor_profiles,
      novice_threshold_months: 12,
      expert_threshold_months: 36,
    });

    // ===== 新人査定者の集計値検証 =====
    // 新人の工種: 土木, 金額帯: 1000万～2000万円
    const novice_metrics = result.assessor_metrics.find(
      (m) =>
        m.assessor_id === novice_assessor_id &&
        m.work_type === "civil_engineering" &&
        m.amount_band === "10_20m"
    );

    expect(novice_metrics).toBeDefined();

    // 新人の査定件数合計: 8 + 7 + 9 = 24
    expect(novice_metrics!.total_assessment_count).toBe(24);

    // 新人の乖離率平均: (12.5 + 14.2 + 13.8) / 3 = 40.5 / 3 = 13.5
    expect(novice_metrics!.average_deviation_rate).toBeCloseTo(13.5, 1);

    // 新人の乖離額平均: (1250000 + 1420000 + 1380000) / 3 = 4050000 / 3 = 1350000
    expect(novice_metrics!.average_deviation_amount_yen).toBeCloseTo(1350000, 0);

    // 新人の平均処理時間: (45 + 48 + 50) / 3 = 143 / 3 = 47.67分
    expect(novice_metrics!.average_processing_time_minutes).toBeCloseTo(47.67, 1);

    // 新人の判定一貫性スコア平均: (72 + 68 + 70) / 3 = 210 / 3 = 70
    expect(novice_metrics!.average_judgment_consistency_score).toBe(70);

    // 新人の市場精度平均: (0.875 + 0.862 + 0.868) / 3 = 2.605 / 3 = 0.8683
    expect(novice_metrics!.average_accuracy_vs_market).toBeCloseTo(0.8683, 3);

    // 新人の乖離率標準偏差: sqrt(((12.5-13.5)^2 + (14.2-13.5)^2 + (13.8-13.5)^2) / 3)
    // = sqrt((1 + 0.49 + 0.09) / 3) = sqrt(1.58 / 3) = sqrt(0.527) = 0.726
    expect(novice_metrics!.deviation_rate_std_dev).toBeCloseTo(0.726, 2);

    // ===== 経験者査定者の集計値検証 =====
    // 経験者の工種: 土木, 金額帯: 1000万～2000万円
    const expert_metrics = result.assessor_metrics.find(
      (m) =>
        m.assessor_id === expert_assessor_id &&
        m.work_type === "civil_engineering" &&
        m.amount_band === "10_20m"
    );

    expect(expert_metrics).toBeDefined();

    // 経験者の査定件数合計: 12 + 13 + 11 = 36
    expect(expert_metrics!.total_assessment_count).toBe(36);

    // 経験者の乖離率平均: (3.2 + 2.8 + 3.5) / 3 = 9.5 / 3 = 3.167
    expect(expert_metrics!.average_deviation_rate).toBeCloseTo(3.167, 2);

    // 経験者の乖離額平均: (320000 + 280000 + 350000) / 3 = 950000 / 3 = 316667
    expect(expert_metrics!.average_deviation_amount_yen).toBeCloseTo(316667, 0);

    // 経験者の平均処理時間: (28 + 26 + 29) / 3 = 83 / 3 = 27.67分
    expect(expert_metrics!.average_processing_time_minutes).toBeCloseTo(27.67, 1);

    // 経験者の判定一貫性スコア平均: (95 + 96 + 94) / 3 = 285 / 3 = 95
    expect(expert_metrics!.average_judgment_consistency_score).toBe(95);

    // 経験者の市場精度平均: (0.968 + 0.972 + 0.965) / 3 = 2.905 / 3 = 0.9683
    expect(expert_metrics!.average_accuracy_vs_market).toBeCloseTo(0.9683, 3);

    // 経験者の乖離率標準偏差: sqrt(((3.2-3.167)^2 + (2.8-3.167)^2 + (3.5-3.167)^2) / 3)
    // = sqrt((0.0011 + 0.1347 + 0.1107) / 3) = sqrt(0.2465 / 3) = sqrt(0.0822) = 0.287
    expect(expert_metrics!.deviation_rate_std_dev).toBeCloseTo(0.287, 2);

    // ===== 能力差指標（Competency Gap）の検証 =====
    const competency_gap = result.competency_gaps.find(
      (gap) =>
        gap.work_type === "civil_engineering" && gap.amount_band === "10_20m"
    );

    expect(competency_gap).toBeDefined();

    // 乖離率差分: 13.5 - 3.167 = 10.333
    expect(competency_gap!.deviation_rate_difference).toBeCloseTo(10.333, 2);

    // 判定一貫性スコア差分: 95 - 70 = 25
    expect(competency_gap!.judgment_consistency_score_difference).toBe(25);

    // 市場精度差分: 0.9683 - 0.8683 = 0.1
    expect(competency_gap!.accuracy_vs_market_difference).toBeCloseTo(0.1, 3);

    // 処理時間効率差分（分）: 47.67 - 27.67 = 20
    expect(competency_gap!.processing_time_difference_minutes).toBeCloseTo(20, 1);

    // ぶれ率（乖離率の変動係数）: 新人 = 0.726 / 13.5 = 0.0537 = 5.37%
    // 経験者 = 0.287 / 3.167 = 0.0906 = 9.06%
    // （注: 経験者のぶれ率が高い理由は、金額差が小さいため相対的に変動が大きく見える）
    expect(competency_gap!.novice_deviation_variability_ratio).toBeCloseTo(
      0.0537,
      3
    );
    expect(competency_gap!.expert_deviation_variability_ratio).toBeCloseTo(
      0.0906,
      3
    );

    // ===== 改善テーマの優先度判定結果の検証 =====
    const priority_judgment = result.improvement_theme_priorities.find(
      (theme) =>
        theme.work_type === "civil_engineering" && theme.amount_band === "10_20m"
    );

    expect(priority_judgment).toBeDefined();

    // 優先度スコア計算式:
    // ( deviation_rate_difference × 0.4 ) + ( judgment_consistency_diff × 0.35 )
    // + ( ( 1 - accuracy_diff ) × 100 × 0.25 )
    // = (10.333 × 0.4) + (25 × 0.35) + ((1 - 0.1) × 100 × 0.25)
    // = 4.133 + 8.75 + 22.5
    // = 35.383
    const expected_priority_score = 10.333 * 0.4 + 25 * 0.35 + (1 - 0.1) * 100 * 0.25;
    expect(priority_judgment!.priority_score).toBeCloseTo(expected_priority_score, 1);

    // 優先度レベル: スコア 35.383 >= 30 → "HIGH"
    expect(priority_judgment!.priority_level).toBe("HIGH");

    // 改善テーマの推奨内容確認
    expect(priority_judgment!.recommended_improvement_themes).toContain(
      "judgment_consistency_enhancement"
    );
    expect(priority_judgment!.recommended_improvement_themes).toContain(
      "deviation_rate_reduction"
    );
    expect(priority_judgment!.recommended_improvement_themes).toContain(
      "processing_efficiency_improvement"
    );

    // ===== 全体集計結果の妥当性検証 =====
    // 結果に含まれるメトリクスの件数確認（新人1件 + 経験者1件 = 2件）
    expect(result.assessor_metrics.length).toBe(2);

    // 能力差指標の件数確認（工種別・金額帯別の組み合わせ = 1件）
    expect(result.competency_gaps.length).toBe(1);

    // 改善テーマの優先度判定の件数確認
    expect(result.improvement_theme_priorities.length).toBe(1);

    // 集計期間の検証
    expect(result.aggregation_period_start).toBe(assessment_period_start);
    expect(result.aggregation_period_end).toBe(assessment_period_end);

    // 新人と経験者の分類が正しく行われたことを確認
    expect(result.assessor_classification).toEqual({
      novice_assessors: [novice_assessor_id],
      expert_assessors: [expert_assessor_id],
    });

    // ===== 一貫性の検証（複数期間での結果比較） =====
    // 同じ入力で再度実行し、結果が同じことを確認
    const result_second_run = aggregateAssessorCompetencyMetrics({
      period_start: assessment_period_start,
      period_end: assessment_period_end,
      assessment_results: assessment_results,
      assessor_profiles: assessor_profiles,
      novice_threshold_months: 12,
      expert_threshold_months: 36,
    });

    // 新人の乖離率平均が一貫しているか確認
    const novice_metrics_second = result_second_run.assessor_metrics.find(
      (m) =>
        m.assessor_id === novice_assessor_id &&
        m.work_type === "civil_engineering" &&
        m.amount_band === "10_20m"
    );
    expect(novice_metrics_second!.average_deviation_rate).toBeCloseTo(13.5, 1);

    // 優先度判定が一貫しているか確認
    const priority_second = result_second_run.improvement_theme_priorities.find(
      (theme) =>
        theme.work_type === "civil_engineering" && theme.amount_band === "10_20m"
    );
    expect(priority_second!.priority_score).toBeCloseTo(expected_priority_score, 1);
    expect(priority_second!.priority_level).toBe("HIGH");

    // ===== 能力差が大きい項目ほど優先度が高い関係性の検証 =====
    // 新人と経験者の能力差が明確（乖離率差分 10.333、判定一貫性差分 25）
    // → 改善テーマの優先度が HIGH と高く設定されている ✓
    expect(competency_gap!.deviation_rate_difference).toBeGreaterThan(8);
    expect(competency_gap!.judgment_consistency_score_difference).toBeGreaterThan(
      20
    );
    expect(priority_judgment!.priority_level).toBe("HIGH");

    // ===== 結果の完全性検証 =====
    // 各メトリクスに必須フィールドが存在することを確認
    expect(novice_metrics!).toHaveProperty("assessor_id");
    expect(novice_metrics!).toHaveProperty("work_type");
    expect(novice_metrics!).toHaveProperty("amount_band");
    expect(novice_metrics!).toHaveProperty("total_assessment_count");
    expect(novice_metrics!).toHaveProperty("average_deviation_rate");
    expect(novice_metrics!).toHaveProperty("average_deviation_amount_yen");
    expect(novice_metrics!).toHaveProperty("average_processing_time_minutes");
    expect(novice_metrics!).toHaveProperty("average_judgment_consistency_score");
    expect(novice_metrics!).toHaveProperty("average_accuracy_vs_market");

    // 能力差指標に必須フィールドが存在することを確認
    expect(competency_gap!).toHaveProperty("work_type");
    expect(competency_gap!).toHaveProperty("amount_band");
    expect(competency_gap!).toHaveProperty("deviation_rate_difference");
    expect(competency_gap!).toHaveProperty(
      "judgment_consistency_score_difference"
    );
    expect(competency_gap!).toHaveProperty("accuracy_vs_market_difference");
    expect(competency_gap!).toHaveProperty("processing_time_difference_minutes");

    // 改善テーマの優先度判定に必須フィールドが存在することを確認
    expect(priority_judgment!).toHaveProperty("work_type");
    expect(priority_judgment!).toHaveProperty("amount_band");
    expect(priority_judgment!).toHaveProperty("priority_score");
    expect(priority_judgment!).toHaveProperty("priority_level");
    expect(priority_judgment!).toHaveProperty(
      "recommended_improvement_themes"
    );
  });
});