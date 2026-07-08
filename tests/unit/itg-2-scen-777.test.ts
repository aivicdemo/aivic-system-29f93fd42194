import { aggregateAssessorVarianceAndMarketDeviation } from "../../src/logic/it-1-br-6-2-1";

describe("査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析", () => {
  // SCEN-777: [edge] 精度低下警告・改善提案機能 - 精度が警告閾値以上の場合に改善不要と判定される
  test("精度値が警告閾値以上の場合、改善提案を生成しない", () => {
    const assessmentAccuracy = 85;
    const warningThreshold = 85;
    const improvementRequiredThreshold = 80;
    const assessorCount = 30;
    
    const assessmentResults = Array.from({ length: 10 }, (_, i) => ({
      assessor_id: `assessor_${(i % assessorCount) + 1}`,
      market_deviation_rate: 2.5 + (i % 5),
      judgment_variance_rate: 5.0 + (i % 3),
      assessment_time_minutes: 18 + (i % 10),
    }));

    const result = aggregateAssessorVarianceAndMarketDeviation({
      assessment_accuracy: assessmentAccuracy,
      warning_threshold: warningThreshold,
      improvement_required_threshold: improvementRequiredThreshold,
      assessment_results: assessmentResults,
    });

    expect(result.accuracy_status).toBe("normal");
    expect(result.warning_flag_active).toBe(false);
    expect(result.improvement_proposals).toEqual([]);
    expect(result.improvement_required).toBe(false);
    expect(result.variance_aggregation.average_market_deviation_rate).toBeCloseTo(4.0, 1);
    expect(result.variance_aggregation.average_judgment_variance_rate).toBeCloseTo(5.67, 1);
    expect(result.variance_aggregation.assessor_count).toBe(30);
  });
});