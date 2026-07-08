import { aggregateMonthlyAssessmentMetrics } from "../../src/logic/it-6-2-1-1";

describe("月次査定業務実績の集計・ダッシュボード表示機能", () => {
  // SCEN-759
  test("集計対象期間内にデータが存在しない場合、ゼロ件で集計される", () => {
    // 集計対象期間: 2024年1月1日～2024年1月31日
    const aggregation_start_date = new Date("2024-01-01T00:00:00Z");
    const aggregation_end_date = new Date("2024-01-31T23:59:59Z");

    // 集計対象期間内にデータが存在しない状態
    const monthly_assessment_records: Array<{
      assessment_id: string;
      assessor_id: string;
      work_type: string;
      amount_band: string;
      assessment_date: Date;
      assessment_time_minutes: number;
      accuracy_score: number;
      deviation_rate: number;
    }> = [];

    // 月次査定業務実績の集計処理を実行
    const aggregation_result = aggregateMonthlyAssessmentMetrics({
      records: monthly_assessment_records,
      period_start: aggregation_start_date,
      period_end: aggregation_end_date,
    });

    // 集計結果が正常に完了している
    expect(aggregation_result.processing_status).toBe("completed");

    // ダッシュボードに集計対象期間のデータが0件として表示される
    expect(aggregation_result.total_assessment_count).toBe(0);

    // すべての集計項目が0またはN/Aで表示される
    expect(aggregation_result.average_assessment_amount).toBe(0);
    expect(aggregation_result.assessment_completion_rate).toBe(0);
    expect(aggregation_result.average_assessment_time_minutes).toBe(0);
    expect(aggregation_result.average_accuracy_score).toBe(0);
    expect(aggregation_result.average_deviation_rate).toBe(0);

    // 集計項目の詳細: 査定担当者別の件数
    expect(aggregation_result.metrics_by_assessor).toEqual([]);

    // 集計項目の詳細: 工種別の件数
    expect(aggregation_result.metrics_by_work_type).toEqual([]);

    // 集計項目の詳細: 金額帯別の件数
    expect(aggregation_result.metrics_by_amount_band).toEqual([]);

    // エラーメッセージは表示されない
    expect(aggregation_result.error_message).toBe("");

    // 集計対象期間が正確に記録される
    expect(aggregation_result.aggregation_period_start).toEqual(
      aggregation_start_date
    );
    expect(aggregation_result.aggregation_period_end).toEqual(
      aggregation_end_date
    );
  });
});