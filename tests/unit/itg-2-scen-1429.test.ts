import { calculateAccuracyImprovement } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1429
  test('修正前後精度改善度計測・可視化機能 - 修正前後の相場判定精度が正常に計測され、改善度が数値とグラフで返される', () => {
    // 修正前のデータセット（相場判定精度）
    const pre_correction_accuracy = 78.5;
    const pre_correction_sample_count = 200;

    // 修正後のデータセット（相場判定精度）
    const post_correction_accuracy = 93.8;
    const post_correction_sample_count = 200;

    // 改善度計測対象の査定データ
    const assessment_data = {
      pre_correction: {
        accuracy_rate: pre_correction_accuracy,
        sample_count: pre_correction_sample_count,
        divergence_pattern: 'high_variance',
        test_date: '2024-01-01T00:00:00Z'
      },
      post_correction: {
        accuracy_rate: post_correction_accuracy,
        sample_count: post_correction_sample_count,
        divergence_pattern: 'normalized',
        test_date: '2024-01-15T00:00:00Z'
      }
    };

    // 改善度の計測処理を実行
    const result = calculateAccuracyImprovement(assessment_data);

    // 1. 改善度が数値（パーセンテージ）で返されることを確認
    expect(result.improvement_rate).toBe(15.3);
    expect(typeof result.improvement_rate).toBe('number');

    // 2. 改善度が数値形式で正確に計算されていることを確認
    // 期待値: (93.8 - 78.5) = 15.3 ポイント（差分値）
    expect(result.improvement_rate).toBeCloseTo(15.3, 1);

    // 3. 修正前後の精度値が保持されていることを確認
    expect(result.pre_correction_accuracy).toBe(78.5);
    expect(result.post_correction_accuracy).toBe(93.8);

    // 4. グラフ用データが含まれていることを確認
    expect(result.chart_data).toBeDefined();
    expect(Array.isArray(result.chart_data)).toBe(true);

    // 5. グラフデータが2つのデータポイント（修正前・修正後）を含むことを確認
    expect(result.chart_data.length).toBe(2);

    // 6. グラフデータの最初のエントリが修正前の精度を示すことを確認
    expect(result.chart_data[0]).toEqual({
      label: 'pre_correction',
      accuracy: 78.5,
      timestamp: '2024-01-01T00:00:00Z'
    });

    // 7. グラフデータの2番目のエントリが修正後の精度を示すことを確認
    expect(result.chart_data[1]).toEqual({
      label: 'post_correction',
      accuracy: 93.8,
      timestamp: '2024-01-15T00:00:00Z'
    });

    // 8. グラフタイプが指定されていることを確認
    expect(result.chart_type).toBe('line_chart');

    // 9. 改善度レベル（段階評価）が正確に返されることを確認
    // 期待値: 15.3% の改善は「高」レベルに分類
    expect(result.improvement_level).toBe('high');

    // 10. 改善度が許容範囲内（正の値）であることを確認
    expect(result.improvement_rate).toBeGreaterThan(0);

    // 11. 改善度の信頼度スコア（0-100）が計算されていることを確認
    expect(typeof result.confidence_score).toBe('number');
    expect(result.confidence_score).toBeGreaterThanOrEqual(0);
    expect(result.confidence_score).toBeLessThanOrEqual(100);

    // 12. 改善度が信頼性の高いスコア（80以上）を返すことを確認
    // 両データセットのサンプル数が同じため信頼度が高い
    expect(result.confidence_score).toBeGreaterThanOrEqual(80);

    // 13. サマリー情報（修正前後の統計情報）が含まれていることを確認
    expect(result.summary).toBeDefined();
    expect(result.summary.pre_correction_divergence_pattern).toBe('high_variance');
    expect(result.summary.post_correction_divergence_pattern).toBe('normalized');

    // 14. メタデータ（計測実行日時）が記録されていることを確認
    expect(result.measurement_timestamp).toBeDefined();
    expect(typeof result.measurement_timestamp).toBe('string');

    // 15. 改善度の単位がパーセンテージ（%）であることを確認
    expect(result.improvement_unit).toBe('percentage');
  });
});