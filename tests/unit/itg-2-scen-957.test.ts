import { calculateMonthlyWorkloadForecastAndRequiredStaff } from '../../src/logic/it-6-2-1-1';

describe('翌月繁忙度予測・必要人員数自動計算', () => {
  test('SCEN-957: 過去データが12ヶ月未満の場合にエラーを返す', () => {
    // テストデータ: 過去6ヶ月分の査定品質データ
    const assessment_data_less_than_12_months = [
      {
        month: '2024-07',
        assessment_count: 150,
        avg_processing_time_minutes: 18,
        quality_score: 92,
      },
      {
        month: '2024-08',
        assessment_count: 165,
        avg_processing_time_minutes: 19,
        quality_score: 91,
      },
      {
        month: '2024-09',
        assessment_count: 172,
        avg_processing_time_minutes: 17,
        quality_score: 93,
      },
      {
        month: '2024-10',
        assessment_count: 188,
        avg_processing_time_minutes: 20,
        quality_score: 90,
      },
      {
        month: '2024-11',
        assessment_count: 195,
        avg_processing_time_minutes: 21,
        quality_score: 89,
      },
      {
        month: '2024-12',
        assessment_count: 210,
        avg_processing_time_minutes: 22,
        quality_score: 88,
      },
    ];

    // 翌月繁忙度予測・必要人員数自動計算を実行
    // 過去データ期間を12ヶ月未満として指定
    expect(() =>
      calculateMonthlyWorkloadForecastAndRequiredStaff({
        historical_data: assessment_data_less_than_12_months,
        data_period_months: 6,
        target_month: '2025-01',
        current_staff_count: 30,
        avg_staff_capacity_assessments_per_month: 180,
      })
    ).toThrow(/12ヶ月/);
  });
});