import { aggregateAndVisualizeAccuracyIndicators } from '../../src/logic/it-6-2-1-1';

describe('相場乖離可視化機能 - 境界値テスト', () => {
  test('SCEN-788: 相場乖離度0.0%の境界値で数値とグラフが正常に表示される', () => {
    // ========== Setup: テストデータ準備 ==========
    const assessor_id = 'ASSESS-001';
    const construction_type = '建築工事';
    const amount_range = '1000万円～5000万円';
    const target_date_from = '2024-01-01';
    const target_date_to = '2024-01-31';

    const assessment_results = [
      {
        assessment_case_id: 'CASE-001',
        assessor_id: assessor_id,
        construction_type: construction_type,
        amount_range: amount_range,
        assessment_date: '2024-01-15',
        quotation_amount: 2000000,
        market_reference_amount: 2000000,
        deviation_rate: 0.0,
        deviation_amount: 0,
        assessment_notes: '相場と完全一致',
      },
      {
        assessment_case_id: 'CASE-002',
        assessor_id: assessor_id,
        construction_type: construction_type,
        amount_range: amount_range,
        assessment_date: '2024-01-20',
        quotation_amount: 3000000,
        market_reference_amount: 3000000,
        deviation_rate: 0.0,
        deviation_amount: 0,
        assessment_notes: '相場と完全一致',
      },
      {
        assessment_case_id: 'CASE-003',
        assessor_id: assessor_id,
        construction_type: construction_type,
        amount_range: amount_range,
        assessment_date: '2024-01-25',
        quotation_amount: 1500000,
        market_reference_amount: 1500000,
        deviation_rate: 0.0,
        deviation_amount: 0,
        assessment_notes: '相場と完全一致',
      },
    ];

    // ========== Execute: 関数実行 ==========
    const result = aggregateAndVisualizeAccuracyIndicators({
      assessor_id: assessor_id,
      construction_type: construction_type,
      amount_range: amount_range,
      target_date_from: target_date_from,
      target_date_to: target_date_to,
      assessment_results: assessment_results,
    });

    // ========== Assert: 数値表示の検証 ==========
    // 相場乖離度の数値表示が「0.0%」または「0%」と正確に表示される
    expect(result.aggregated_metrics.deviation_rate_display).toMatch(/^0\.?0?%$/);
    expect(result.aggregated_metrics.mean_deviation_rate).toBe(0.0);

    // 相場乖離度が0%の場合、乖離額も0であることを検証
    expect(result.aggregated_metrics.mean_deviation_amount).toBe(0);

    // ========== Assert: グラフ表示データの検証 ==========
    // グラフ表示では乖離がない状態（基準線に完全一致）が正常に描画される
    expect(result.graph_data).toBeDefined();
    expect(result.graph_data.data_points.length).toBe(3);

    result.graph_data.data_points.forEach((point: any) => {
      expect(point.deviation_rate).toBe(0.0);
      expect(point.status).toBe('BASELINE_MATCH');
    });

    // グラフタイプは線グラフまたは単点表示
    expect(result.graph_data.chart_type).toMatch(/line|point/);

    // グラフの最小値・最大値が0に統一される
    expect(result.graph_data.y_axis_min).toBe(0.0);
    expect(result.graph_data.y_axis_max).toBe(0.0);

    // ========== Assert: 数値とグラフの整合性検証 ==========
    // グラフ上のすべてのデータポイント値が集計メトリクスと一致
    const all_graph_values = result.graph_data.data_points.map(
      (p: any) => p.deviation_rate
    );
    expect(all_graph_values.every((v: number) => v === 0.0)).toBe(true);

    // 集計された平均乖離率とグラフ表示が一致
    expect(result.aggregated_metrics.mean_deviation_rate).toBe(
      result.graph_data.y_axis_baseline
    );

    // ========== Assert: レスポンシブ表示対応確認 ==========
    // 異なるデバイスサイズ用のレイアウト設定が用意されている
    expect(result.responsive_layouts).toBeDefined();
    expect(result.responsive_layouts).toHaveProperty('mobile');
    expect(result.responsive_layouts).toHaveProperty('tablet');
    expect(result.responsive_layouts).toHaveProperty('desktop');

    // 各レイアウトで数値表示が維持される
    expect(result.responsive_layouts.mobile.deviation_rate_display).toMatch(
      /^0\.?0?%$/
    );
    expect(result.responsive_layouts.tablet.deviation_rate_display).toMatch(
      /^0\.?0?%$/
    );
    expect(result.responsive_layouts.desktop.deviation_rate_display).toMatch(
      /^0\.?0?%$/
    );

    // グラフがレスポンシブに再配置される
    expect(result.responsive_layouts.mobile.graph_width).toBeLessThan(600);
    expect(result.responsive_layouts.tablet.graph_width).toBeLessThanOrEqual(
      900
    );
    expect(result.responsive_layouts.desktop.graph_width).toBeGreaterThan(900);

    // ========== Assert: ブラウザ互換性確認 ==========
    // 複数ブラウザ環境への対応情報が含まれる
    expect(result.browser_compatibility).toBeDefined();
    expect(result.browser_compatibility).toContain('Chrome');
    expect(result.browser_compatibility).toContain('Firefox');
    expect(result.browser_compatibility).toContain('Safari');

    // ========== Assert: レイアウト崩れがないことの検証 ==========
    // SVG/Canvas グラフ生成時にエラーが発生していない
    expect(result.graph_data.render_errors).toBeUndefined();
    expect(result.graph_data.render_status).toBe('SUCCESS');

    // 数値テキストの表示フォーマットが正規化されている
    expect(result.aggregated_metrics.deviation_rate_display).toBeTruthy();
    expect(typeof result.aggregated_metrics.deviation_rate_display).toBe(
      'string'
    );

    // ========== Assert: 結果オブジェクトの完全性 ==========
    // すべての必須フィールドが存在
    expect(result).toHaveProperty('aggregated_metrics');
    expect(result).toHaveProperty('graph_data');
    expect(result).toHaveProperty('responsive_layouts');
    expect(result).toHaveProperty('browser_compatibility');

    // 集計メトリクスの完全性
    expect(result.aggregated_metrics).toHaveProperty('mean_deviation_rate');
    expect(result.aggregated_metrics).toHaveProperty('mean_deviation_amount');
    expect(result.aggregated_metrics).toHaveProperty('deviation_rate_display');
    expect(result.aggregated_metrics).toHaveProperty('sample_count');
    expect(result.aggregated_metrics.sample_count).toBe(3);

    // グラフデータの完全性
    expect(result.graph_data).toHaveProperty('data_points');
    expect(result.graph_data).toHaveProperty('chart_type');
    expect(result.graph_data).toHaveProperty('y_axis_min');
    expect(result.graph_data).toHaveProperty('y_axis_max');
    expect(result.graph_data).toHaveProperty('y_axis_baseline');
    expect(result.graph_data).toHaveProperty('render_status');

    // ========== Assert: 境界値の正確性 ==========
    // 0.0%が数値として正確に表現されている（浮動小数点誤差がない）
    expect(Math.abs(result.aggregated_metrics.mean_deviation_rate - 0.0)).toBeLessThan(
      0.0001
    );

    // グラフの最小値と最大値が完全に0で統一
    expect(result.graph_data.y_axis_min).toStrictEqual(0.0);
    expect(result.graph_data.y_axis_max).toStrictEqual(0.0);

    // すべてのデータポイントが0.0%を完全に一致
    result.graph_data.data_points.forEach((point: any) => {
      expect(point.deviation_rate).toStrictEqual(0.0);
    });
  });
});