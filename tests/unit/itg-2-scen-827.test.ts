import { describe, test, expect } from '@jest/globals';
import { calculateMonthlyAggregateMetrics } from '../../src/logic/it-1-br-2-2-2-1';

describe('Monthly Assessment Results Dashboard Auto-Aggregation and Visualization', () => {
  // SCEN-827: [edge] 月次査定実績ダッシュボード自動集計・可視化機能 - 処理時間短縮率が 0% の境界値で計算された場合、グラフが正常に表示される
  test('should correctly aggregate and visualize dashboard with 0% processing time reduction rate boundary value', () => {
    // Setup: Prepare test data with 0% processing time reduction rate
    const assessment_results = [
      {
        assessment_id: 'ASS-001',
        assessor_id: 'ASSESSOR-A',
        assessment_date: '2024-01-15',
        item_count: 10,
        processing_time_minutes: 45,
        processing_time_target_minutes: 45,
        accuracy_rate: 95.5,
        deviation_rate: 5.2,
      },
      {
        assessment_id: 'ASS-002',
        assessor_id: 'ASSESSOR-B',
        assessment_date: '2024-01-16',
        item_count: 12,
        processing_time_minutes: 50,
        processing_time_target_minutes: 50,
        accuracy_rate: 92.0,
        deviation_rate: 8.1,
      },
      {
        assessment_id: 'ASS-003',
        assessor_id: 'ASSESSOR-A',
        assessment_date: '2024-01-17',
        item_count: 8,
        processing_time_minutes: 40,
        processing_time_target_minutes: 40,
        accuracy_rate: 97.2,
        deviation_rate: 2.8,
      },
    ];

    const baseline_processing_time_minutes = 45;
    const aggregation_period_start = '2024-01-01';
    const aggregation_period_end = '2024-01-31';

    // Execute: Call the aggregate metrics calculation function
    const result = calculateMonthlyAggregateMetrics({
      assessment_results,
      baseline_processing_time_minutes,
      aggregation_period_start,
      aggregation_period_end,
    });

    // Verify: Result structure contains required dashboard fields
    expect(result).toHaveProperty('total_assessments');
    expect(result).toHaveProperty('average_processing_time_minutes');
    expect(result).toHaveProperty('processing_time_reduction_rate_percent');
    expect(result).toHaveProperty('average_accuracy_rate');
    expect(result).toHaveProperty('average_deviation_rate');
    expect(result).toHaveProperty('assessor_metrics');
    expect(result).toHaveProperty('daily_trend_data');
    expect(result).toHaveProperty('graph_visualization_config');

    // Verify: Boundary value check - 0% reduction rate
    expect(result.total_assessments).toBe(3);
    expect(result.average_processing_time_minutes).toBe(45);
    expect(result.processing_time_reduction_rate_percent).toBe(0);

    // Verify: Accuracy and deviation metrics
    expect(result.average_accuracy_rate).toBeCloseTo(94.9, 1);
    expect(result.average_deviation_rate).toBeCloseTo(5.37, 1);

    // Verify: Assessor-level metrics aggregation
    expect(result.assessor_metrics).toHaveLength(2);
    const assessor_a_metrics = result.assessor_metrics.find(
      (m: any) => m.assessor_id === 'ASSESSOR-A'
    );
    const assessor_b_metrics = result.assessor_metrics.find(
      (m: any) => m.assessor_id === 'ASSESSOR-B'
    );
    expect(assessor_a_metrics).toEqual({
      assessor_id: 'ASSESSOR-A',
      assessment_count: 2,
      average_processing_time_minutes: 42.5,
      average_accuracy_rate: 96.35,
      processing_time_reduction_rate_percent: 5.56,
    });
    expect(assessor_b_metrics).toEqual({
      assessor_id: 'ASSESSOR-B',
      assessment_count: 1,
      average_processing_time_minutes: 50,
      average_accuracy_rate: 92.0,
      processing_time_reduction_rate_percent: -11.11,
    });

    // Verify: Daily trend data points for graph rendering
    expect(result.daily_trend_data).toHaveLength(3);
    expect(result.daily_trend_data[0]).toEqual({
      date: '2024-01-15',
      processing_time_minutes: 45,
      accuracy_rate: 95.5,
      item_count: 10,
    });
    expect(result.daily_trend_data[1]).toEqual({
      date: '2024-01-16',
      processing_time_minutes: 50,
      accuracy_rate: 92.0,
      item_count: 12,
    });
    expect(result.daily_trend_data[2]).toEqual({
      date: '2024-01-17',
      processing_time_minutes: 40,
      accuracy_rate: 97.2,
      item_count: 8,
    });

    // Verify: Graph visualization configuration for 0% boundary value
    const graph_config = result.graph_visualization_config;
    expect(graph_config).toHaveProperty('chart_type');
    expect(graph_config.chart_type).toBe('line_chart');
    expect(graph_config).toHaveProperty('axes');
    expect(graph_config.axes).toHaveProperty('x_axis_label');
    expect(graph_config.axes.x_axis_label).toBe('日付 (Date)');
    expect(graph_config.axes).toHaveProperty('y_axis_label');
    expect(graph_config.axes.y_axis_label).toBe('処理時間 (分) / Accuracy (%)');
    expect(graph_config).toHaveProperty('title');
    expect(graph_config.title).toBe('月次査定実績ダッシュボード / Monthly Assessment Results');
    expect(graph_config).toHaveProperty('legend');
    expect(graph_config.legend).toContain('Processing Time (minutes)');
    expect(graph_config.legend).toContain('Accuracy Rate (%)');

    // Verify: Style configuration for graph rendering
    expect(graph_config).toHaveProperty('style');
    expect(graph_config.style).toHaveProperty('primary_color');
    expect(graph_config.style.primary_color).toBe('#0078D4');
    expect(graph_config.style).toHaveProperty('secondary_color');
    expect(graph_config.style.secondary_color).toBe('#107C10');
    expect(graph_config.style).toHaveProperty('font_size_title');
    expect(graph_config.style.font_size_title).toBe(16);
    expect(graph_config.style).toHaveProperty('font_size_label');
    expect(graph_config.style.font_size_label).toBe(12);
    expect(graph_config.style).toHaveProperty('line_width');
    expect(graph_config.style.line_width).toBe(2);

    // Verify: Data point accuracy for 0% reduction rate scenario
    const reduction_rate_data_points = result.graph_visualization_config.data_points;
    expect(reduction_rate_data_points).toBeDefined();
    expect(reduction_rate_data_points).toHaveLength(3);
    expect(reduction_rate_data_points[0]).toEqual({
      label: '2024-01-15',
      value: 45,
      y_axis_value: 95.5,
    });
    expect(reduction_rate_data_points[1]).toEqual({
      label: '2024-01-16',
      value: 50,
      y_axis_value: 92.0,
    });
    expect(reduction_rate_data_points[2]).toEqual({
      label: '2024-01-17',
      value: 40,
      y_axis_value: 97.2,
    });

    // Verify: Reduction rate value in config is exactly 0 (boundary)
    expect(graph_config).toHaveProperty('metric_summary');
    expect(graph_config.metric_summary).toHaveProperty(
      'processing_time_reduction_rate_percent'
    );
    expect(graph_config.metric_summary.processing_time_reduction_rate_percent).toBe(0);

    // Verify: No error indicators in rendering config
    expect(graph_config).toHaveProperty('error_handling');
    expect(graph_config.error_handling).toHaveProperty('has_errors');
    expect(graph_config.error_handling.has_errors).toBe(false);
    expect(graph_config.error_handling).toHaveProperty('warning_messages');
    expect(graph_config.error_handling.warning_messages).toEqual([]);

    // Verify: Rendering state flags
    expect(graph_config).toHaveProperty('rendering_state');
    expect(graph_config.rendering_state).toBe('ready');
    expect(result).toHaveProperty('dom_validation_passed');
    expect(result.dom_validation_passed).toBe(true);
  });
});