import { calculateMonthlyDashboardMetrics } from '../../src/logic/it-6-2-1-1';

describe('月次査定実績ダッシュボード自動集計・可視化機能', () => {
  // SCEN-825
  test('初期30名運用での月次査定実績から処理時間短縮率・品質均一性指標・システム稼働率が自動計算され、ダッシュボードに数値とグラフで表示される', () => {
    const assessorCount = 30;
    const assessmentRecords = [
      {
        assessor_id: 'A001',
        assessment_time_minutes: 18,
        quality_score: 0.92,
        construction_type: '建築工事',
        price_range: '1000万～5000万',
      },
      {
        assessor_id: 'A002',
        assessment_time_minutes: 20,
        quality_score: 0.88,
        construction_type: '土木工事',
        price_range: '500万～1000万',
      },
      {
        assessor_id: 'A003',
        assessment_time_minutes: 16,
        quality_score: 0.95,
        construction_type: '建築工事',
        price_range: '5000万以上',
      },
      {
        assessor_id: 'A004',
        assessment_time_minutes: 22,
        quality_score: 0.85,
        construction_type: '機械工事',
        price_range: '1000万～5000万',
      },
      {
        assessor_id: 'A005',
        assessment_time_minutes: 19,
        quality_score: 0.90,
        construction_type: '電気工事',
        price_range: '500万～1000万',
      },
      {
        assessor_id: 'A006',
        assessment_time_minutes: 17,
        quality_score: 0.93,
        construction_type: '建築工事',
        price_range: '1000万～5000万',
      },
      {
        assessor_id: 'A007',
        assessment_time_minutes: 21,
        quality_score: 0.87,
        construction_type: '土木工事',
        price_range: '5000万以上',
      },
      {
        assessor_id: 'A008',
        assessment_time_minutes: 18,
        quality_score: 0.91,
        construction_type: '建築工事',
        price_range: '500万～1000万',
      },
      {
        assessor_id: 'A009',
        assessment_time_minutes: 19,
        quality_score: 0.89,
        construction_type: '機械工事',
        price_range: '1000万～5000万',
      },
      {
        assessor_id: 'A010',
        assessment_time_minutes: 20,
        quality_score: 0.86,
        construction_type: '電気工事',
        price_range: '500万～1000万',
      },
      {
        assessor_id: 'A011',
        assessment_time_minutes: 17,
        quality_score: 0.94,
        construction_type: '建築工事',
        price_range: '5000万以上',
      },
      {
        assessor_id: 'A012',
        assessment_time_minutes: 22,
        quality_score: 0.84,
        construction_type: '土木工事',
        price_range: '1000万～5000万',
      },
      {
        assessor_id: 'A013',
        assessment_time_minutes: 18,
        quality_score: 0.92,
        construction_type: '建築工事',
        price_range: '500万～1000万',
      },
      {
        assessor_id: 'A014',
        assessment_time_minutes: 19,
        quality_score: 0.88,
        construction_type: '機械工事',
        price_range: '1000万～5000万',
      },
      {
        assessor_id: 'A015',
        assessment_time_minutes: 21,
        quality_score: 0.86,
        construction_type: '電気工事',
        price_range: '5000万以上',
      },
      {
        assessor_id: 'A016',
        assessment_time_minutes: 16,
        quality_score: 0.96,
        construction_type: '建築工事',
        price_range: '1000万～5000万',
      },
      {
        assessor_id: 'A017',
        assessment_time_minutes: 20,
        quality_score: 0.87,
        construction_type: '土木工事',
        price_range: '500万～1000万',
      },
      {
        assessor_id: 'A018',
        assessment_time_minutes: 18,
        quality_score: 0.90,
        construction_type: '建築工事',
        price_range: '5000万以上',
      },
      {
        assessor_id: 'A019',
        assessment_time_minutes: 22,
        quality_score: 0.85,
        construction_type: '機械工事',
        price_range: '1000万～5000万',
      },
      {
        assessor_id: 'A020',
        assessment_time_minutes: 17,
        quality_score: 0.93,
        construction_type: '電気工事',
        price_range: '500万～1000万',
      },
      {
        assessor_id: 'A021',
        assessment_time_minutes: 19,
        quality_score: 0.89,
        construction_type: '建築工事',
        price_range: '1000万～5000万',
      },
      {
        assessor_id: 'A022',
        assessment_time_minutes: 21,
        quality_score: 0.86,
        construction_type: '土木工事',
        price_range: '5000万以上',
      },
      {
        assessor_id: 'A023',
        assessment_time_minutes: 18,
        quality_score: 0.92,
        construction_type: '建築工事',
        price_range: '500万～1000万',
      },
      {
        assessor_id: 'A024',
        assessment_time_minutes: 20,
        quality_score: 0.88,
        construction_type: '機械工事',
        price_range: '1000万～5000万',
      },
      {
        assessor_id: 'A025',
        assessment_time_minutes: 17,
        quality_score: 0.94,
        construction_type: '電気工事',
        price_range: '5000万以上',
      },
      {
        assessor_id: 'A026',
        assessment_time_minutes: 19,
        quality_score: 0.91,
        construction_type: '建築工事',
        price_range: '1000万～5000万',
      },
      {
        assessor_id: 'A027',
        assessment_time_minutes: 22,
        quality_score: 0.84,
        construction_type: '土木工事',
        price_range: '500万～1000万',
      },
      {
        assessor_id: 'A028',
        assessment_time_minutes: 16,
        quality_score: 0.95,
        construction_type: '建築工事',
        price_range: '5000万以上',
      },
      {
        assessor_id: 'A029',
        assessment_time_minutes: 18,
        quality_score: 0.90,
        construction_type: '機械工事',
        price_range: '1000万～5000万',
      },
      {
        assessor_id: 'A030',
        assessment_time_minutes: 20,
        quality_score: 0.87,
        construction_type: '電気工事',
        price_range: '500万～1000万',
      },
    ];

    const previousMonthAverageTimeMinutes = 25;
    const systemUptimePercentage = 99.8;
    const systemDowntimePercentage = 0.2;

    const result = calculateMonthlyDashboardMetrics({
      assessor_count: assessorCount,
      assessment_records: assessmentRecords,
      previous_month_average_time_minutes: previousMonthAverageTimeMinutes,
      current_month_average_time_minutes:
        assessmentRecords.reduce((sum, rec) => sum + rec.assessment_time_minutes, 0) /
        assessmentRecords.length,
      system_uptime_percentage: systemUptimePercentage,
      system_downtime_percentage: systemDowntimePercentage,
    });

    expect(result).toBeDefined();
    expect(result.processing_time_reduction_rate).toBeDefined();
    expect(typeof result.processing_time_reduction_rate).toBe('number');

    const expectedReductionRate = ((previousMonthAverageTimeMinutes - 19) / previousMonthAverageTimeMinutes) * 100;
    expect(result.processing_time_reduction_rate).toBeCloseTo(expectedReductionRate, 2);
    expect(result.processing_time_reduction_rate).toBeGreaterThan(0);
    expect(result.processing_time_reduction_rate).toBeLessThan(100);

    expect(result.quality_uniformity_index).toBeDefined();
    expect(typeof result.quality_uniformity_index).toBe('number');
    expect(result.quality_uniformity_index).toBeGreaterThanOrEqual(0);
    expect(result.quality_uniformity_index).toBeLessThanOrEqual(100);

    const qualityScores = assessmentRecords.map((rec) => rec.quality_score);
    const qualityMean = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
    const qualityVariance =
      qualityScores.reduce((sum, score) => sum + Math.pow(score - qualityMean, 2), 0) / qualityScores.length;
    const qualityStdDev = Math.sqrt(qualityVariance);
    const qualityCoefficientOfVariation = (qualityStdDev / qualityMean) * 100;
    const expectedUniformityIndex = Math.max(0, 100 - qualityCoefficientOfVariation);
    expect(result.quality_uniformity_index).toBeCloseTo(expectedUniformityIndex, 1);

    expect(result.system_uptime_rate).toBeDefined();
    expect(typeof result.system_uptime_rate).toBe('number');
    expect(result.system_uptime_rate).toBe(systemUptimePercentage);
    expect(result.system_uptime_rate).toBeGreaterThanOrEqual(99);

    expect(result.chart_data).toBeDefined();
    expect(result.chart_data.processing_time_chart).toBeDefined();
    expect(Array.isArray(result.chart_data.processing_time_chart)).toBe(true);
    expect(result.chart_data.processing_time_chart.length).toBeGreaterThan(0);

    expect(result.chart_data.quality_uniformity_chart).toBeDefined();
    expect(Array.isArray(result.chart_data.quality_uniformity_chart)).toBe(true);
    expect(result.chart_data.quality_uniformity_chart.length).toBe(assessorCount);

    expect(result.chart_data.uptime_chart).toBeDefined();
    expect(result.chart_data.uptime_chart).toHaveProperty('uptime_percentage');
    expect(result.chart_data.uptime_chart).toHaveProperty('downtime_percentage');
    expect(result.chart_data.uptime_chart.uptime_percentage).toBe(systemUptimePercentage);
    expect(result.chart_data.uptime_chart.downtime_percentage).toBe(systemDowntimePercentage);

    expect(result.processing_time_chart_type).toBe('line');
    expect(result.quality_uniformity_chart_type).toBe('bar');
    expect(result.uptime_chart_type).toBe('pie');

    expect(result.assessment_count).toBe(assessmentRecords.length);
    expect(result.average_quality_score).toBeCloseTo(qualityMean, 3);

    expect(result.month_year).toBeDefined();
    expect(typeof result.month_year).toBe('string');

    const processingTimeChartData = result.chart_data.processing_time_chart;
    expect(processingTimeChartData).toContainEqual(
      expect.objectContaining({
        value: expect.any(Number),
      })
    );

    const qualityUniformityChartData = result.chart_data.quality_uniformity_chart;
    expect(qualityUniformityChartData).toContainEqual(
      expect.objectContaining({
        assessor_id: expect.any(String),
        quality_score: expect.any(Number),
      })
    );
  });
});