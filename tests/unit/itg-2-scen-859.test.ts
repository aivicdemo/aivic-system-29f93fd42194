import { calculateMonthlyDeviationMetrics } from '../../src/logic/it-6-2-2-1';

describe('月次判定ばらつき率・相場乖離傾向集計機能', () => {
  // SCEN-859
  test('相場乖離傾向が100%を超える異常値を検出し、警告フラグを立てて集計を続行する', () => {
    const assessmentRecords = [
      {
        assessment_id: 'A001',
        assessor_id: 'U101',
        quotation_id: 'Q001',
        deviation_rate: 45,
        deviation_amount: 250000,
        market_trend: 85,
        judgment_date: '2024-01-15',
        assessment_status: 'completed',
      },
      {
        assessment_id: 'A002',
        assessor_id: 'U102',
        quotation_id: 'Q002',
        deviation_rate: 150,
        deviation_amount: 580000,
        market_trend: 150,
        judgment_date: '2024-01-16',
        assessment_status: 'completed',
      },
      {
        assessment_id: 'A003',
        assessor_id: 'U101',
        quotation_id: 'Q003',
        deviation_rate: 32,
        deviation_amount: 180000,
        market_trend: 72,
        judgment_date: '2024-01-17',
        assessment_status: 'completed',
      },
      {
        assessment_id: 'A004',
        assessor_id: 'U103',
        quotation_id: 'Q004',
        deviation_rate: 120,
        deviation_amount: 420000,
        market_trend: 125,
        judgment_date: '2024-01-18',
        assessment_status: 'completed',
      },
      {
        assessment_id: 'A005',
        assessor_id: 'U102',
        quotation_id: 'Q005',
        deviation_rate: 28,
        deviation_amount: 160000,
        market_trend: 68,
        judgment_date: '2024-01-19',
        assessment_status: 'completed',
      },
    ];

    const result = calculateMonthlyDeviationMetrics({
      assessments: assessmentRecords,
      month: '2024-01',
      threshold_anomaly_market_trend: 100,
    });

    expect(result).toBeDefined();
    expect(result.monthly_deviation_dispersion_rate).toBe(65.6);
    expect(result.market_trend_values).toEqual([85, 150, 72, 125, 68]);
    expect(result.anomaly_detected).toBe(true);
    expect(result.warning_flag).toBe(true);
    expect(result.anomaly_records).toEqual([
      {
        assessment_id: 'A002',
        deviation_rate: 150,
        market_trend: 150,
        warning_reason: 'market_trend超過',
      },
      {
        assessment_id: 'A004',
        deviation_rate: 120,
        market_trend: 125,
        warning_reason: 'market_trend超過',
      },
    ]);
    expect(result.aggregation_continued).toBe(true);
    expect(result.normal_records_count).toBe(3);
    expect(result.anomaly_records_count).toBe(2);
    expect(result.total_records_processed).toBe(5);
    expect(result.warning_log).toContain('異常値検出');
    expect(result.warning_log).toContain('market_trend');
    expect(result.normal_aggregation_result).toEqual({
      average_deviation_rate: 35,
      average_market_trend: 75,
      count: 3,
    });
    expect(result.aggregation_status).toBe('completed_with_warnings');
  });
});