import { validateReportAccuracy } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-1176
  test('レポート数値の正確性合否判定機能 - 誤差がちょうど許容閾値の場合に正確として判定できる', () => {
    // 基準値: 100、許容誤差: 5%、測定値: 105（誤差がちょうど5%）
    const baseline_value = 100;
    const tolerance_percentage = 5;
    const measured_value = 105;

    // 誤差計算: (105 - 100) / 100 * 100 = 5%
    const actual_error_percentage = ((measured_value - baseline_value) / baseline_value) * 100;

    // レポート数値の正確性合否判定機能を実行
    const result = validateReportAccuracy({
      baseline_value,
      tolerance_percentage,
      measured_value,
    });

    // 期待結果: 誤差がちょうど許容閾値（5%）の場合、判定結果が「正確」として判定されること
    expect(result.is_accurate).toBe(true);
    expect(result.error_percentage).toBe(5);
    expect(result.judgement).toBe('正確');
    expect(actual_error_percentage).toBe(tolerance_percentage);
  });
});