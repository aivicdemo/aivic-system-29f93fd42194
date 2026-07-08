import { aggregateAndVisualizePrecisionByAssessor } from '../../src/logic/it-6-2-1-1';

describe('査定員別判定精度比較・可視化機能', () => {
  // SCEN-1062
  test('複数査定員の判定精度が同一（乖離率0%）の場合も正常に比較表示される', () => {
    const assessor_1_id = 'ASS001';
    const assessor_1_name = '査定員A';
    const assessor_2_id = 'ASS002';
    const assessor_2_name = '査定員B';
    const assessor_3_id = 'ASS003';
    const assessor_3_name = '査定員C';

    const precision_input = {
      assessor_list: [
        {
          assessor_id: assessor_1_id,
          assessor_name: assessor_1_name,
          judgment_count: 50,
          divergence_rate_avg: 0.0,
          judgment_accuracy_rate: 100.0,
          consistency_score: 100,
        },
        {
          assessor_id: assessor_2_id,
          assessor_name: assessor_2_name,
          judgment_count: 50,
          divergence_rate_avg: 0.0,
          judgment_accuracy_rate: 100.0,
          consistency_score: 100,
        },
        {
          assessor_id: assessor_3_id,
          assessor_name: assessor_3_name,
          judgment_count: 50,
          divergence_rate_avg: 0.0,
          judgment_accuracy_rate: 100.0,
          consistency_score: 100,
        },
      ],
      comparison_period_start: '2024-01-01',
      comparison_period_end: '2024-01-31',
      include_graph_data: true,
    };

    const result = aggregateAndVisualizePrecisionByAssessor(precision_input);

    expect(result).toEqual({
      status: 'success',
      message: '査定員別判定精度の比較データ生成完了',
      comparison_table: [
        {
          rank: 1,
          assessor_id: assessor_1_id,
          assessor_name: assessor_1_name,
          judgment_count: 50,
          divergence_rate_avg: 0.0,
          judgment_accuracy_rate: 100.0,
          consistency_score: 100,
        },
        {
          rank: 1,
          assessor_id: assessor_2_id,
          assessor_name: assessor_2_name,
          judgment_count: 50,
          divergence_rate_avg: 0.0,
          judgment_accuracy_rate: 100.0,
          consistency_score: 100,
        },
        {
          rank: 1,
          assessor_id: assessor_3_id,
          assessor_name: assessor_3_name,
          judgment_count: 50,
          divergence_rate_avg: 0.0,
          judgment_accuracy_rate: 100.0,
          consistency_score: 100,
        },
      ],
      visualization_data: {
        divergence_rate_chart: {
          type: 'bar_chart',
          title: '査定員別平均乖離率比較',
          data_points: [
            {
              assessor_name: assessor_1_name,
              divergence_rate: 0.0,
              color_code: '#00AA00',
            },
            {
              assessor_name: assessor_2_name,
              divergence_rate: 0.0,
              color_code: '#00AA00',
            },
            {
              assessor_name: assessor_3_name,
              divergence_rate: 0.0,
              color_code: '#00AA00',
            },
          ],
        },
        accuracy_rate_chart: {
          type: 'pie_chart',
          title: '判定精度分布',
          data_points: [
            {
              assessor_name: assessor_1_name,
              accuracy_rate: 100.0,
              percentage: 33.33,
            },
            {
              assessor_name: assessor_2_name,
              accuracy_rate: 100.0,
              percentage: 33.33,
            },
            {
              assessor_name: assessor_3_name,
              accuracy_rate: 100.0,
              percentage: 33.34,
            },
          ],
        },
        consistency_score_chart: {
          type: 'radar_chart',
          title: '一致度スコア比較',
          data_points: [
            {
              assessor_name: assessor_1_name,
              consistency_score: 100,
            },
            {
              assessor_name: assessor_2_name,
              consistency_score: 100,
            },
            {
              assessor_name: assessor_3_name,
              consistency_score: 100,
            },
          ],
        },
      },
      summary_statistics: {
        avg_divergence_rate: 0.0,
        max_divergence_rate: 0.0,
        min_divergence_rate: 0.0,
        divergence_rate_variance: 0.0,
        assessor_count: 3,
        all_identical: true,
        max_accuracy_rate: 100.0,
        min_accuracy_rate: 100.0,
        avg_accuracy_rate: 100.0,
        avg_consistency_score: 100,
      },
      comparison_period: {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      },
      generated_timestamp: '2024-01-31T23:59:59Z',
      error_log: [],
      data_validation_status: 'passed',
    });

    expect(result.status).toBe('success');
    expect(result.error_log.length).toBe(0);
    expect(result.data_validation_status).toBe('passed');
    expect(result.summary_statistics.all_identical).toBe(true);
    expect(result.summary_statistics.avg_divergence_rate).toBe(0.0);
    expect(result.summary_statistics.divergence_rate_variance).toBe(0.0);
    expect(result.comparison_table.length).toBe(3);
    expect(result.comparison_table.every((item) => item.divergence_rate_avg === 0.0)).toBe(
      true,
    );
    expect(result.comparison_table.every((item) => item.rank === 1)).toBe(true);
    expect(result.visualization_data.divergence_rate_chart.data_points).toHaveLength(3);
    expect(
      result.visualization_data.divergence_rate_chart.data_points.every(
        (point) => point.divergence_rate === 0.0,
      ),
    ).toBe(true);
    expect(
      result.visualization_data.divergence_rate_chart.data_points.every(
        (point) => point.color_code === '#00AA00',
      ),
    ).toBe(true);
    expect(result.visualization_data.accuracy_rate_chart.data_points).toHaveLength(3);
    expect(
      result.visualization_data.accuracy_rate_chart.data_points.every(
        (point) => point.accuracy_rate === 100.0,
      ),
    ).toBe(true);
    expect(
      result.visualization_data.accuracy_rate_chart.data_points.reduce(
        (sum, point) => sum + point.percentage,
        0,
      ),
    ).toBeCloseTo(100.0, 1);
    expect(result.visualization_data.consistency_score_chart.data_points).toHaveLength(3);
    expect(
      result.visualization_data.consistency_score_chart.data_points.every(
        (point) => point.consistency_score === 100,
      ),
    ).toBe(true);
  });
});