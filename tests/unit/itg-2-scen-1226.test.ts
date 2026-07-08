import { calculateSignificanceTest } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1226
  test('精度改善効果の統計的有意性判定 - 改善前後のOCR精度が有意な差を示す場合、改善成功と判定され本格展開が推奨される', () => {
    // === 準備フェーズ ===
    // OCR精度改善前のベースラインデータ（サンプル数: 100件以上）
    const baseline_before = {
      sample_count: 100,
      correct_count: 82,
      error_count: 18,
      accuracy_rate: 0.82,
      error_rate: 0.18,
      measurement_datetime: '2024-01-01T09:00:00Z'
    };

    // 改善前のOCR精度指標を記録
    const before_accuracy = baseline_before.accuracy_rate; // 0.82 (82%)
    const before_error_rate = baseline_before.error_rate; // 0.18 (18%)

    // === 改善処理実施フェーズ ===
    // OCR改善処理を実施（アルゴリズム更新、モデル再学習など）
    // [システムが改善処理を実行]

    // === 改善後測定フェーズ ===
    // 改善後のOCR精度を同一条件で測定（サンプル数: 100件以上）
    const baseline_after = {
      sample_count: 100,
      correct_count: 90,
      error_count: 10,
      accuracy_rate: 0.90,
      error_rate: 0.10,
      measurement_datetime: '2024-01-02T09:00:00Z'
    };

    const after_accuracy = baseline_after.accuracy_rate; // 0.90 (90%)
    const after_error_rate = baseline_after.error_rate; // 0.10 (10%)

    // === 統計的有意性検定フェーズ ===
    const significance_test_input = {
      baseline_before: baseline_before,
      baseline_after: baseline_after,
      significance_level: 0.05,
      test_method: 'chi_square' // またはt検定
    };

    const result = calculateSignificanceTest(significance_test_input);

    // === 有意性判定検証 ===
    // 有意水準（p < 0.05）で統計的に有意な差があるかを判定
    expect(result).toHaveProperty('is_significant');
    expect(result.is_significant).toBe(true);

    // p値の検証（p < 0.05で有意）
    expect(result).toHaveProperty('p_value');
    expect(result.p_value).toBeLessThan(0.05);

    // === 改善成功判定検証 ===
    // 改善成功と判定された場合の検証
    expect(result).toHaveProperty('improvement_status');
    expect(result.improvement_status).toBe('success');

    // === 本格展開推奨フラグ検証 ===
    // システムが本格展開推奨フラグを立てることを確認
    expect(result).toHaveProperty('full_deployment_recommended');
    expect(result.full_deployment_recommended).toBe(true);

    // === 精度改善度の数値検証 ===
    // 改善前後の精度差を計算
    const accuracy_improvement = after_accuracy - before_accuracy; // 0.90 - 0.82 = 0.08 (8%)
    expect(result).toHaveProperty('accuracy_improvement_rate');
    expect(result.accuracy_improvement_rate).toBe(0.08);

    // エラー率の改善度を検証
    const error_rate_improvement = before_error_rate - after_error_rate; // 0.18 - 0.10 = 0.08 (8%)
    expect(result).toHaveProperty('error_rate_improvement');
    expect(result.error_rate_improvement).toBe(0.08);

    // === レポート画面表示内容検証 ===
    // 本格展開推奨メッセージがレポート画面に正しく表示されることを検証
    expect(result).toHaveProperty('report_display_message');
    expect(result.report_display_message).toMatch(/本格展開推奨/);

    // === 詳細レポート情報の検証 ===
    expect(result).toHaveProperty('test_details');
    expect(result.test_details).toHaveProperty('test_method');
    expect(result.test_details.test_method).toBe('chi_square');

    expect(result.test_details).toHaveProperty('before_sample_count');
    expect(result.test_details.before_sample_count).toBe(100);

    expect(result.test_details).toHaveProperty('after_sample_count');
    expect(result.test_details.after_sample_count).toBe(100);

    expect(result.test_details).toHaveProperty('before_accuracy');
    expect(result.test_details.before_accuracy).toBe(0.82);

    expect(result.test_details).toHaveProperty('after_accuracy');
    expect(result.test_details.after_accuracy).toBe(0.90);

    // === 有意性判定タイムスタンプ検証 ===
    expect(result).toHaveProperty('judgment_datetime');
    expect(typeof result.judgment_datetime).toBe('string');

    // === 次アクション推奨の検証 ===
    // 本格展開が推奨される場合の次ステップを確認
    expect(result).toHaveProperty('recommended_action');
    expect(result.recommended_action).toBe('full_deployment');

    // === 信頼区間の検証 ===
    expect(result).toHaveProperty('confidence_interval');
    expect(result.confidence_interval).toHaveProperty('lower_bound');
    expect(result.confidence_interval).toHaveProperty('upper_bound');
    expect(result.confidence_interval.lower_bound).toBeLessThan(result.confidence_interval.upper_bound);

    // === エッジケース: 精度改善度が期待値内か検証 ===
    // 改善度が最小要件（5%以上の改善）を満たしているか
    expect(accuracy_improvement).toBeGreaterThanOrEqual(0.05);

    // === 統計的パワーの検証（オプション） ===
    expect(result).toHaveProperty('statistical_power');
    expect(result.statistical_power).toBeGreaterThan(0.8);
  });
});