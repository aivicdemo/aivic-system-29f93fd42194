import { describe, test, expect, beforeEach } from '@jest/globals';
import { classifyAndVisualizeDeviationPatterns } from '../../src/logic/it-6-2-1-1';

describe('乖離パターン自動分類・可視化機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1456
  test('地域別・工事種別・時期別の乖離パターンが正確に自動分類され、乖離集中領域がヒートマップやグラフで正確に可視化される', () => {
    // 過去12ヶ月分の査定データ（地域、工事種別、時期情報を含む）
    const assessmentData = [
      {
        assessment_id: 'A001',
        region: '関東',
        construction_type: '建築工事',
        period: '2024-01',
        deviation_rate: 12.5,
        deviation_amount: 450000,
        reference_count: 8
      },
      {
        assessment_id: 'A002',
        region: '関東',
        construction_type: '建築工事',
        period: '2024-01',
        deviation_rate: 13.2,
        deviation_amount: 480000,
        reference_count: 7
      },
      {
        assessment_id: 'A003',
        region: '関東',
        construction_type: '土木工事',
        period: '2024-01',
        deviation_rate: 5.8,
        deviation_amount: 120000,
        reference_count: 12
      },
      {
        assessment_id: 'A004',
        region: '関西',
        construction_type: '建築工事',
        period: '2024-01',
        deviation_rate: 8.3,
        deviation_amount: 280000,
        reference_count: 9
      },
      {
        assessment_id: 'A005',
        region: '関東',
        construction_type: '建築工事',
        period: '2024-06',
        deviation_rate: 18.9,
        deviation_amount: 610000,
        reference_count: 5
      },
      {
        assessment_id: 'A006',
        region: '関東',
        construction_type: '建築工事',
        period: '2024-06',
        deviation_rate: 17.4,
        deviation_amount: 580000,
        reference_count: 6
      },
      {
        assessment_id: 'A007',
        region: '関西',
        construction_type: '土木工事',
        period: '2024-06',
        deviation_rate: 6.2,
        deviation_amount: 140000,
        reference_count: 11
      },
      {
        assessment_id: 'A008',
        region: '関東',
        construction_type: '建築工事',
        period: '2024-12',
        deviation_rate: 22.1,
        deviation_amount: 720000,
        reference_count: 4
      },
      {
        assessment_id: 'A009',
        region: '関西',
        construction_type: '建築工事',
        period: '2024-12',
        deviation_rate: 9.5,
        deviation_amount: 310000,
        reference_count: 8
      },
      {
        assessment_id: 'A010',
        region: '九州',
        construction_type: '建築工事',
        period: '2024-12',
        deviation_rate: 15.7,
        deviation_amount: 520000,
        reference_count: 6
      }
    ];

    // 地域別フィルター適用
    const regionFilterResult = classifyAndVisualizeDeviationPatterns(
      assessmentData,
      { filterType: 'region', filterValue: '関東' }
    );

    expect(regionFilterResult).toEqual(
      expect.objectContaining({
        filter_applied: 'region',
        region: '関東',
        record_count: 6,
        deviation_patterns: expect.arrayContaining([
          expect.objectContaining({
            pattern_type: 'HIGH_CONCENTRATION',
            pattern_name: '高乖離集中',
            record_count: 3
          })
        ]),
        heatmap_data: expect.objectContaining({
          concentration_score: 68.5,
          primary_period: '2024-06',
          primary_construction_type: '建築工事'
        })
      })
    );

    expect(regionFilterResult.record_count).toBe(6);
    expect(regionFilterResult.concentration_score).toBeGreaterThan(60);

    // 工事種別フィルター適用
    const constructionTypeFilterResult = classifyAndVisualizeDeviationPatterns(
      assessmentData,
      { filterType: 'construction_type', filterValue: '建築工事' }
    );

    expect(constructionTypeFilterResult).toEqual(
      expect.objectContaining({
        filter_applied: 'construction_type',
        construction_type: '建築工事',
        record_count: 7,
        deviation_patterns: expect.any(Array)
      })
    );

    expect(constructionTypeFilterResult.record_count).toBe(7);

    // 時期別フィルター（月別）適用
    const monthFilterResult = classifyAndVisualizeDeviationPatterns(
      assessmentData,
      { filterType: 'period', filterValue: '2024-01', period_granularity: 'month' }
    );

    expect(monthFilterResult).toEqual(
      expect.objectContaining({
        filter_applied: 'period',
        period: '2024-01',
        period_granularity: 'month',
        record_count: 4,
        average_deviation_rate: 10.0
      })
    );

    expect(monthFilterResult.average_deviation_rate).toBe(10.0);

    // 時期別フィルター（四半期別）適用
    const quarterFilterResult = classifyAndVisualizeDeviationPatterns(
      assessmentData,
      { filterType: 'period', filterValue: 'Q2-2024', period_granularity: 'quarter' }
    );

    expect(quarterFilterResult).toEqual(
      expect.objectContaining({
        filter_applied: 'period',
        period_granularity: 'quarter',
        record_count: 3
      })
    );

    // 可視化ダッシュボード生成
    const dashboardResult = classifyAndVisualizeDeviationPatterns(
      assessmentData,
      { filterType: 'none' }
    );

    expect(dashboardResult).toEqual(
      expect.objectContaining({
        dashboard: expect.objectContaining({
          heatmap: expect.any(Object),
          graph_data: expect.any(Array),
          concentration_regions: expect.any(Array),
          concentration_construction_types: expect.any(Array),
          concentration_periods: expect.any(Array)
        })
      })
    );

    expect(dashboardResult.dashboard.heatmap).toEqual(
      expect.objectContaining({
        max_concentration_region: '関東',
        max_concentration_score: 68.5,
        max_concentration_construction_type: '建築工事',
        max_concentration_period: '2024-06'
      })
    );

    // 乖離集中領域の詳細情報（ドリルダウン）
    const drilldownResult = classifyAndVisualizeDeviationPatterns(
      assessmentData,
      {
        filterType: 'combined',
        region: '関東',
        construction_type: '建築工事',
        period: '2024-06'
      }
    );

    expect(drilldownResult).toEqual(
      expect.objectContaining({
        drill_down_data: expect.objectContaining({
          region: '関東',
          construction_type: '建築工事',
          period: '2024-06',
          occurrence_count: 2,
          average_deviation_rate: 18.15,
          primary_factors: expect.any(Array)
        })
      })
    );

    expect(drilldownResult.drill_down_data.occurrence_count).toBe(2);
    expect(drilldownResult.drill_down_data.average_deviation_rate).toBe(18.15);

    // 複数条件を組み合わせた検索
    const multiFilterResult = classifyAndVisualizeDeviationPatterns(
      assessmentData,
      {
        filterType: 'combined',
        region: '関東',
        construction_type: '建築工事',
        period_start: '2024-01',
        period_end: '2024-12'
      }
    );

    expect(multiFilterResult).toEqual(
      expect.objectContaining({
        filter_combined: true,
        total_records_matched: 5,
        classification_accuracy: 100
      })
    );

    expect(multiFilterResult.total_records_matched).toBe(5);
    expect(multiFilterResult.classification_accuracy).toBe(100);

    // エクスポート機能（CSV形式）
    const exportCsvResult = classifyAndVisualizeDeviationPatterns(
      assessmentData,
      { filterType: 'none', export_format: 'csv' }
    );

    expect(exportCsvResult).toEqual(
      expect.objectContaining({
        export_format: 'csv',
        export_status: 'success',
        record_count: 10,
        data_integrity_verified: true
      })
    );

    expect(exportCsvResult.export_status).toBe('success');
    expect(exportCsvResult.data_integrity_verified).toBe(true);

    // エクスポート機能（PDF形式）
    const exportPdfResult = classifyAndVisualizeDeviationPatterns(
      assessmentData,
      { filterType: 'none', export_format: 'pdf' }
    );

    expect(exportPdfResult).toEqual(
      expect.objectContaining({
        export_format: 'pdf',
        export_status: 'success',
        record_count: 10,
        visualization_included: true
      })
    );

    expect(exportPdfResult.export_status).toBe('success');
    expect(exportPdfResult.visualization_included).toBe(true);

    // 乖離パターンの正確な分類検証
    expect(dashboardResult.dashboard.concentration_regions).toContain('関東');
    expect(dashboardResult.dashboard.concentration_construction_types).toContain('建築工事');

    // 最大乖離スコアと集中領域の整合性検証
    expect(dashboardResult.dashboard.heatmap.max_concentration_score).toBeGreaterThan(60);
    expect(dashboardResult.dashboard.heatmap.max_concentration_region).toBe('関東');
  });
});