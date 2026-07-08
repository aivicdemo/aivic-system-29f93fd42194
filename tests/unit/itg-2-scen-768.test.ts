import { calculateMonthlyRequiredStaffAndScenarios } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-768: [error] 翌月必要人員数の自動計算・配置シナリオ生成機能 - 処理時間データが欠落している場合、計算エラーが返される
  test('処理時間データが欠落している場合はエラーが返される', () => {
    const input_assessor_count = 30;
    const input_monthly_forecast_count = 450;
    const input_avg_processing_time_minutes = undefined; // 処理時間データ欠落
    const input_busy_level = 'normal';

    expect(() =>
      calculateMonthlyRequiredStaffAndScenarios({
        assessor_count: input_assessor_count,
        monthly_forecast_count: input_monthly_forecast_count,
        avg_processing_time_minutes: input_avg_processing_time_minutes,
        busy_level: input_busy_level,
      })
    ).toThrow(/処理時間/);
  });
});