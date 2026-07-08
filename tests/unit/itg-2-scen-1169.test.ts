import { calculateAccuracyJudgment } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1169: [edge] モデル更新前後精度計測 - 学習データ更新後のAI判定精度が絶対値70%の境界値ちょうどで測定された場合、正常判定される
  test('should judge as normal when post_update_accuracy is exactly 70.0 percent', () => {
    const baseline_accuracy = 75.5;
    const post_update_accuracy = 70.0;
    const threshold_accuracy = 70.0;

    const result = calculateAccuracyJudgment({
      baseline_accuracy,
      post_update_accuracy,
      threshold_accuracy,
    });

    expect(result.judgment_status).toBe('normal');
    expect(result.accuracy_value).toBe(70.0);
    expect(result.is_acceptable).toBe(true);
    expect(result.dashboard_display).toBe('合格');
    expect(result.system_log_message).toBe('精度判定: 正常');
  });
});