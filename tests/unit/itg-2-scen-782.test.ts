import { aggregateAssessorDeviation } from "../../src/logic/it-1-br-6-2-1";

describe("査定員別判定ばらつき率と相場乖離傾向の自動集計・分析", () => {
  // SCEN-782
  test("判定基準が存在しない場合にエラーハンドリングが正常に動作する", () => {
    const assessmentResults = [
      {
        assessor_id: "A001",
        case_id: "C001",
        quote_amount: 1000000,
        assessment_decision: "承認",
        deviation_rate: 0.05,
        deviation_amount: 50000,
        reference_data_count: 15,
        correction_factor: 1.02,
      },
      {
        assessor_id: "A002",
        case_id: "C001",
        quote_amount: 1000000,
        assessment_decision: "修正指示",
        deviation_rate: 0.12,
        deviation_amount: 120000,
        reference_data_count: 12,
        correction_factor: 1.05,
      },
    ];

    const judgmentCriteria = null;

    expect(() => {
      aggregateAssessorDeviation(assessmentResults, judgmentCriteria);
    }).toThrow(/判定基準/);
  });

  test("判定基準が存在する場合に査定員別判定ばらつき率を正確に計算する", () => {
    const assessmentResults = [
      {
        assessor_id: "A001",
        case_id: "C001",
        quote_amount: 1000000,
        assessment_decision: "承認",
        deviation_rate: 0.05,
        deviation_amount: 50000,
        reference_data_count: 15,
        correction_factor: 1.02,
        work_type: "建築工事",
        region: "東京都",
        assessment_date: "2024-01-15",
      },
      {
        assessor_id: "A001",
        case_id: "C002",
        quote_amount: 1500000,
        assessment_decision: "承認",
        deviation_rate: 0.03,
        deviation_amount: 45000,
        reference_data_count: 20,
        correction_factor: 1.01,
        work_type: "建築工事",
        region: "東京都",
        assessment_date: "2024-01-15",
      },
      {
        assessor_id: "A002",
        case_id: "C003",
        quote_amount: 2000000,
        assessment_decision: "修正指示",
        deviation_rate: 0.15,
        deviation_amount: 300000,
        reference_data_count: 10,
        correction_factor: 1.08,
        work_type: "建築工事",
        region: "大阪府",
        assessment_date: "2024-01-15",
      },
    ];

    const judgmentCriteria = {
      acceptable_deviation_rate_upper: 0.10,
      acceptable_deviation_rate_lower: -0.05,
      acceptable_deviation_amount_upper: 200000,
      acceptable_deviation_amount_lower: -100000,
      reference_data_count_minimum: 8,
      correction_factor_range_upper: 1.15,
      correction_factor_range_lower: 0.90,
    };

    const result = aggregateAssessorDeviation(
      assessmentResults,
      judgmentCriteria
    );

    expect(result).toEqual({
      summary: {
        total_assessors: 2,
        total_cases: 3,
        analysis_period: "2024-01-15",
      },
      by_assessor: [
        {
          assessor_id: "A001",
          case_count: 2,
          average_deviation_rate: 0.04,
          std_dev_deviation_rate: 0.01,
          deviation_rate_consistency_score: 95,
          average_deviation_amount: 47500,
          std_dev_deviation_amount: 2500,
          within_criteria_count: 2,
          outside_criteria_count: 0,
          adherence_rate: 1.0,
          judgement_patterns: {
            approval: 2,
            modification_instruction: 0,
            rejection: 0,
          },
        },
        {
          assessor_id: "A002",
          case_count: 1,
          average_deviation_rate: 0.15,
          std_dev_deviation_rate: 0,
          deviation_rate_consistency_score: 100,
          average_deviation_amount: 300000,
          std_dev_deviation_amount: 0,
          within_criteria_count: 0,
          outside_criteria_count: 1,
          adherence_rate: 0.0,
          judgement_patterns: {
            approval: 0,
            modification_instruction: 1,
            rejection: 0,
          },
        },
      ],
      consistency_metrics: {
        overall_consistency_score: 97.5,
        assessor_variance_score: 47.5,
        standard_deviation_of_means: 0.055,
        uniformity_index: 0.55,
      },
      deviation_trends: {
        by_work_type: [
          {
            work_type: "建築工事",
            average_deviation_rate: 0.073,
            average_deviation_amount: 131667,
            case_count: 3,
            pattern: "moderate_positive",
          },
        ],
        by_region: [
          {
            region: "東京都",
            average_deviation_rate: 0.04,
            average_deviation_amount: 47500,
            case_count: 2,
            pattern: "low_positive",
          },
          {
            region: "大阪府",
            average_deviation_rate: 0.15,
            average_deviation_amount: 300000,
            case_count: 1,
            pattern: "high_positive",
          },
        ],
      },
      improvement_recommendations: [
        {
          priority: "high",
          assessor_id: "A002",
          issue: "判定基準超過",
          recommendation:
            "査定員A002に対する追加教育が必要。大阪府での相場判定ロジック標準化を優先実施",
          impact_score: 78,
          implementation_difficulty: 35,
        },
      ],
      system_status: {
        error_occurred: false,
        error_message: null,
        recovery_status: "normal",
        timestamp: "2024-01-15T00:00:00Z",
      },
    });
  });

  test("判定基準が空の場合にエラーが適切に処理される", () => {
    const assessmentResults = [
      {
        assessor_id: "A001",
        case_id: "C001",
        quote_amount: 1000000,
        assessment_decision: "承認",
        deviation_rate: 0.05,
        deviation_amount: 50000,
        reference_data_count: 15,
        correction_factor: 1.02,
      },
    ];

    const judgmentCriteria = {};

    expect(() => {
      aggregateAssessorDeviation(assessmentResults, judgmentCriteria);
    }).toThrow(/判定基準/);
  });

  test("評価結果が空配列の場合に適切に処理される", () => {
    const assessmentResults: any[] = [];

    const judgmentCriteria = {
      acceptable_deviation_rate_upper: 0.1,
      acceptable_deviation_rate_lower: -0.05,
      acceptable_deviation_amount_upper: 200000,
      acceptable_deviation_amount_lower: -100000,
      reference_data_count_minimum: 8,
      correction_factor_range_upper: 1.15,
      correction_factor_range_lower: 0.9,
    };

    const result = aggregateAssessorDeviation(
      assessmentResults,
      judgmentCriteria
    );

    expect(result.summary.total_assessors).toBe(0);
    expect(result.summary.total_cases).toBe(0);
    expect(result.by_assessor.length).toBe(0);
  });

  test("複数査定員の判定ばらつき率計算と均一性指標の算出が正確である", () => {
    const assessmentResults = [
      {
        assessor_id: "A001",
        case_id: "C001",
        quote_amount: 5000000,
        assessment_decision: "承認",
        deviation_rate: 0.02,
        deviation_amount: 100000,
        reference_data_count: 25,
        correction_factor: 1.0,
        work_type: "土木工事",
        region: "東京都",
        assessment_date: "2024-01-20",
      },
      {
        assessor_id: "A001",
        case_id: "C002",
        quote_amount: 3000000,
        assessment_decision: "承認",
        deviation_rate: 0.04,
        deviation_amount: 120000,
        reference_data_count: 18,
        correction_factor: 1.01,
        work_type: "土木工事",
        region: "東京都",
        assessment_date: "2024-01-20",
      },
      {
        assessor_id: "A002",
        case_id: "C003",
        quote_amount: 4000000,
        assessment_decision: "承認",
        deviation_rate: 0.03,
        deviation_amount: 120000,
        reference_data_count: 22,
        correction_factor: 1.0,
        work_type: "土木工事",
        region: "大阪府",
        assessment_date: "2024-01-20",
      },
      {
        assessor_id: "A002",
        case_id: "C004",
        quote_amount: 6000000,
        assessment_decision: "承認",
        deviation_rate: 0.05,
        deviation_amount: 300000,
        reference_data_count: 20,
        correction_factor: 1.02,
        work_type: "土木工事",
        region: "大阪府",
        assessment_date: "2024-01-20",
      },
    ];

    const judgmentCriteria = {
      acceptable_deviation_rate_upper: 0.08,
      acceptable_deviation_rate_lower: -0.03,
      acceptable_deviation_amount_upper: 400000,
      acceptable_deviation_amount_lower: -150000,
      reference_data_count_minimum: 15,
      correction_factor_range_upper: 1.1,
      correction_factor_range_lower: 0.95,
    };

    const result = aggregateAssessorDeviation(
      assessmentResults,
      judgmentCriteria
    );

    expect(result.by_assessor[0].assessor_id).toBe("A001");
    expect(result.by_assessor[0].case_count).toBe(2);
    expect(result.by_assessor[0].average_deviation_rate).toBe(0.03);
    expect(result.by_assessor[0].average_deviation_amount).toBe(110000);
    expect(result.by_assessor[0].adherence_rate).toBe(1.0);

    expect(result.by_assessor[1].assessor_id).toBe("A002");
    expect(result.by_assessor[1].case_count).toBe(2);
    expect(result.by_assessor[1].average_deviation_rate).toBe(0.04);
    expect(result.by_assessor[1].average_deviation_amount).toBe(210000);
    expect(result.by_assessor[1].adherence_rate).toBe(1.0);

    expect(result.consistency_metrics.overall_consistency_score).toBeGreaterThanOrEqual(
      85
    );
    expect(result.consistency_metrics.uniformity_index).toBeGreaterThanOrEqual(
      0.5
    );
  });

  test("相場乖離傾向分析が工事種別と地域別に正確に分類される", () => {
    const assessmentResults = [
      {
        assessor_id: "A001",
        case_id: "C001",
        quote_amount: 2000000,
        assessment_decision: "承認",
        deviation_rate: 0.08,
        deviation_amount: 160000,
        reference_data_count: 20,
        correction_factor: 1.02,
        work_type: "建築工事",
        region: "東京都",
        assessment_date: "2024-02-01",
      },
      {
        assessor_id: "A002",
        case_id: "C002",
        quote_amount: 3000000,
        assessment_decision: "承認",
        deviation_rate: 0.09,
        deviation_amount: 270000,
        reference_data_count: 18,
        correction_factor: 1.03,
        work_type: "建築工事",
        region: "東京都",
        assessment_date: "2024-02-01",
      },
      {
        assessor_id: "A001",
        case_id: "C003",
        quote_amount: 1500000,
        assessment_decision: "修正指示",
        deviation_rate: -0.02,
        deviation_amount: -30000,
        reference_data_count: 16,
        correction_factor: 0.98,
        work_type: "土木工事",
        region: "大阪府",
        assessment_date: "2024-02-01",
      },
      {
        assessor_id: "A002",
        case_id: "C004",
        quote_amount: 2500000,
        assessment_decision: "承認",
        deviation_rate: 0.03,
        deviation_amount: 75000,
        reference_data_count: 22,
        correction_factor: 1.01,
        work_type: "土木工事",
        region: "大阪府",
        assessment_date: "2024-02-01",
      },
    ];

    const judgmentCriteria = {
      acceptable_deviation_rate_upper: 0.1,
      acceptable_deviation_rate_lower: -0.05,
      acceptable_deviation_amount_upper: 300000,
      acceptable_deviation_amount_lower: -100000,
      reference_data_count_minimum: 10,
      correction_factor_range_upper: 1.1,
      correction_factor_range_lower: 0.9,
    };

    const result = aggregateAssessorDeviation(
      assessmentResults,
      judgmentCriteria
    );

    const buildingTrend = result.deviation_trends.by_work_type.find(
      (t) => t.work_type === "建築工事"
    );
    expect(buildingTrend).toBeDefined();
    expect(buildingTrend!.average_deviation_rate).toBe(0.085);
    expect(buildingTrend!.average_deviation_amount).toBe(215000);
    expect(buildingTrend!.case_count).toBe(2);
    expect(buildingTrend!.pattern).toBe("high_positive");

    const civilTrend = result.deviation_trends.by_work_type.find(
      (t) => t.work_type === "土木工事"
    );
    expect(civilTrend).toBeDefined();
    expect(civilTrend!.average_deviation_rate).toBe(0.005);
    expect(civilTrend!.average_deviation_amount).toBe(22500);
    expect(civilTrend!.case_count).toBe(2);
    expect(civilTrend!.pattern).toBe("low_positive");

    const tokyoTrend = result.deviation_trends.by_region.find(
      (t) => t.region === "東京都"
    );
    expect(tokyoTrend).toBeDefined();
    expect(tokyoTrend!.average_deviation_rate).toBe(0.085);
    expect(tokyoTrend!.case_count).toBe(2);

    const osakaTrend = result.deviation_trends.by_region.find(
      (t) => t.region === "大阪府"
    );
    expect(osakaTrend).toBeDefined();
    expect(osakaTrend!.average_deviation_rate).toBe(0.005);
    expect(osakaTrend!.case_count).toBe(2);
  });

  test("判定パターン分布が正確に集計される", () => {
    const assessmentResults = [
      {
        assessor_id: "A001",
        case_id: "C001",
        quote_amount: 1000000,
        assessment_decision: "承認",
        deviation_rate: 0.02,
        deviation_amount: 20000,
        reference_data_count: 15,
        correction_factor: 1.0,
        work_type: "建築工事",
        region: "東京都",
        assessment_date: "2024-02-10",
      },
      {
        assessor_id: "A001",
        case_id: "C002",
        quote_amount: 1200000,
        assessment_decision: "修正指示",
        deviation_rate: 0.08,
        deviation_amount: 96000,
        reference_data_count: 12,
        correction_factor: 1.02,
        work_type: "建築工事",
        region: "東京都",
        assessment_date: "2024-02-10",
      },
      {
        assessor_id: "A001",
        case_id: "C003",
        quote_amount: 800000,
        assessment_decision: "却下",
        deviation_rate: -0.15,
        deviation_amount: -120000,
        reference_data_count: 8,
        correction_factor: 0.85,
        work_type: "建築工事",
        region: "東京都",
        assessment_date: "2024-02-10",
      },
    ];

    const judgmentCriteria = {
      acceptable_deviation_rate_upper: 0.1,
      acceptable_deviation_rate_lower: -0.1,
      acceptable_deviation_amount_upper: 150000,
      acceptable_deviation_amount_lower: -150000,
      reference_data_count_minimum: 8,
      correction_factor_range_upper: 1.1,
      correction_factor_range_lower: 0.8,
    };

    const result = aggregateAssessorDeviation(
      assessmentResults,
      judgmentCriteria
    );

    const assessorA001 = result.by_assessor.find(
      (a) => a.assessor_id === "A001"
    );
    expect(assessorA001).toBeDefined();
    expect(assessorA001!.judgement_patterns.approval).toBe(1);
    expect(assessorA001!.judgement_patterns.modification_instruction).toBe(1);
    expect(assessorA001!.judgement_patterns.rejection).toBe(1);
  });

  test("改善推奨事項が適切に生成される", () => {
    const assessmentResults = [
      {
        assessor_id: "A001",
        case_id: "C001",
        quote_amount: 2000000,
        assessment_decision: "承認",
        deviation_rate: 0.02,
        deviation_amount: 40000,
        reference_data_count: 25,
        correction_factor: 1.0,
        work_type: "建築工事",
        region: "東京都",
        assessment_date: "2024-02-15",
      },
      {
        assessor_id: "A002",
        case_id: "C002",
        quote_amount: 1800000,
        assessment_decision: "修正指示",
        deviation_rate: 0.25,
        deviation_amount: 450000,
        reference_data_count: 5,
        correction_factor: 1.2,
        work_type: "建築工事",
        region: "京都府",
        assessment_date: "2024-02-15",
      },
    ];

    const judgmentCriteria = {
      acceptable_deviation_rate_upper: 0.1,
      acceptable_deviation_rate_lower: -0.05,
      acceptable_deviation_amount_upper: 200000,
      acceptable_deviation_amount_lower: -100000,
      reference_data_count_minimum: 10,
      correction_factor_range_upper: 1.15,
      correction_factor_range_lower: 0.9,
    };

    const result = aggregateAssessorDeviation(
      assessmentResults,
      judgmentCriteria
    );

    expect(result.improvement_recommendations.length).toBeGreaterThan(0);
    const recommendation = result.improvement_recommendations.find(
      (r) => r.assessor_id === "A002"
    );
    expect(recommendation).toBeDefined();
    expect(recommendation!.priority).toBe("high");
    expect(recommendation!.issue).toBe("判定基準超過");
    expect(recommendation!.impact_score).toBeGreaterThan(70);
  });

  test("エラー発生後のシステム復帰状態が正常に記録される", () => {
    const assessmentResults = [
      {
        assessor_id: "A001",
        case_id: "C001",
        quote_amount: 1000000,
        assessment_decision: "承認",
        deviation_rate: 0.05,
        deviation_amount: 50000,
        reference_data_count: 15,
        correction_factor: 1.02,
      },
    ];

    const judgmentCriteria = {
      acceptable_deviation_rate_upper: 0.1,
      acceptable_deviation_rate_lower: -0.05,
      acceptable_deviation_amount_upper: 200000,
      acceptable_deviation_amount_lower: -100000,
      reference_data_count_minimum: 8,
      correction_factor_range_upper: 1.15,
      correction_factor_range_lower: 0.9,
    };

    const result = aggregateAssessorDeviation(
      assessmentResults,
      judgmentCriteria
    );

    expect(result.system_status.error_occurred).toBe(false);
    expect(result.system_status.error_message).toBeNull();
    expect(result.system_status.recovery_status).toBe("normal");
    expect(result.system_status.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });
});