import { calculateAssessmentQualityMetrics } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-802: [error] 月次査定精度指標自動集計機能 - 修正率計算時に分母がゼロの場合、ゼロ除算エラーが回避される
  test("修正対象件数が0件の場合、ゼロ除算エラーを回避して修正率のデフォルト値を返す", () => {
    const assessmentDataSet = {
      assessor_id: "assessor_001",
      work_type: "建築工事",
      price_band: "1000万円～2000万円",
      total_assessments: 25,
      assessments_requiring_correction: 0,
      assessment_time_minutes: 1250,
      divergence_rate_percentage: 3.5,
      consistency_score: 92,
    };

    const result = calculateAssessmentQualityMetrics(assessmentDataSet);

    expect(result).toEqual({
      assessor_id: "assessor_001",
      work_type: "建築工事",
      price_band: "1000万円～2000万円",
      total_assessments: 25,
      correction_rate_percentage: 0,
      average_assessment_time_minutes: 50,
      consistency_score: 92,
      divergence_rate_percentage: 3.5,
      error_status: "OK",
      error_message: null,
    });
  });

  test("修正対象件数が存在する場合、修正率を正常に計算して返す", () => {
    const assessmentDataSet = {
      assessor_id: "assessor_002",
      work_type: "土木工事",
      price_band: "500万円～1000万円",
      total_assessments: 40,
      assessments_requiring_correction: 8,
      assessment_time_minutes: 1800,
      divergence_rate_percentage: 5.2,
      consistency_score: 85,
    };

    const result = calculateAssessmentQualityMetrics(assessmentDataSet);

    expect(result).toEqual({
      assessor_id: "assessor_002",
      work_type: "土木工事",
      price_band: "500万円～1000万円",
      total_assessments: 40,
      correction_rate_percentage: 20,
      average_assessment_time_minutes: 45,
      consistency_score: 85,
      divergence_rate_percentage: 5.2,
      error_status: "OK",
      error_message: null,
    });
  });

  test("全査定が修正対象の場合、修正率は100%として計算される", () => {
    const assessmentDataSet = {
      assessor_id: "assessor_003",
      work_type: "設備工事",
      price_band: "100万円～500万円",
      total_assessments: 15,
      assessments_requiring_correction: 15,
      assessment_time_minutes: 450,
      divergence_rate_percentage: 12.8,
      consistency_score: 60,
    };

    const result = calculateAssessmentQualityMetrics(assessmentDataSet);

    expect(result).toEqual({
      assessor_id: "assessor_003",
      work_type: "設備工事",
      price_band: "100万円～500万円",
      total_assessments: 15,
      correction_rate_percentage: 100,
      average_assessment_time_minutes: 30,
      consistency_score: 60,
      divergence_rate_percentage: 12.8,
      error_status: "OK",
      error_message: null,
    });
  });

  test("総査定件数がゼロの場合、計算エラーを回避してデフォルト値を返す", () => {
    const assessmentDataSet = {
      assessor_id: "assessor_004",
      work_type: "その他工事",
      price_band: "2000万円以上",
      total_assessments: 0,
      assessments_requiring_correction: 0,
      assessment_time_minutes: 0,
      divergence_rate_percentage: 0,
      consistency_score: 0,
    };

    const result = calculateAssessmentQualityMetrics(assessmentDataSet);

    expect(result).toEqual({
      assessor_id: "assessor_004",
      work_type: "その他工事",
      price_band: "2000万円以上",
      total_assessments: 0,
      correction_rate_percentage: 0,
      average_assessment_time_minutes: 0,
      consistency_score: 0,
      divergence_rate_percentage: 0,
      error_status: "OK",
      error_message: null,
    });
  });
});