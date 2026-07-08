import { diagnoseAccuracyDecline } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  test('SCEN-938: 精度低下原因自動診断機能 - 精度データが存在しない状態で診断を実行した場合、エラーが返される', () => {
    // 精度データが登録されていない状態を表現する入力
    const empty_accuracy_data = [];

    // 診断実行時のパラメータ（データが存在しないため最小限）
    const diagnosis_params = {
      accuracy_records: empty_accuracy_data,
      target_period_start: '2024-01-01',
      target_period_end: '2024-01-31',
    };

    // 精度データが存在しない状態で診断実行時にエラーが返されることを検証
    expect(() => diagnoseAccuracyDecline(diagnosis_params)).toThrow(/精度データ/);
  });
});