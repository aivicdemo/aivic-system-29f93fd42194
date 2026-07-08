import { aggregateDeviationRateByMonth } from '../../src/logic/it-6-2-2-2';

describe('査定員別判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1064
  test('相場乖離率が正しく集計される（複数案件の乖離率が月次で統計化される）', () => {
    // テストデータ: 異なる査定員により評価された複数の案件
    const assessmentRecords = [
      {
        project_id: 'proj_001',
        assessor_id: 'assessor_001',
        assessment_amount: 950000,
        market_rate_amount: 1000000,
        assessment_date: '2024-01-10',
      },
      {
        project_id: 'proj_002',
        assessor_id: 'assessor_002',
        assessment_amount: 1050000,
        market_rate_amount: 1000000,
        assessment_date: '2024-01-15',
      },
      {
        project_id: 'proj_003',
        assessor_id: 'assessor_001',
        assessment_amount: 900000,
        market_rate_amount: 1000000,
        assessment_date: '2024-01-20',
      },
      {
        project_id: 'proj_004',
        assessor_id: 'assessor_002',
        assessment_amount: 1100000,
        market_rate_amount: 1000000,
        assessment_date: '2024-01-25',
      },
    ];

    const target_month = '2024-01';

    // 相場乖離率集計機能を実行
    const result = aggregateDeviationRateByMonth({
      assessment_records: assessmentRecords,
      target_month,
    });

    // 期待する個別乖離率の計算
    // proj_001: |950000 - 1000000| / 1000000 × 100 = 5.0%
    // proj_002: |1050000 - 1000000| / 1000000 × 100 = 5.0%
    // proj_003: |900000 - 1000000| / 1000000 × 100 = 10.0%
    // proj_004: |1100000 - 1000000| / 1000000 × 100 = 10.0%

    // 各案件の乖離率が正しく計算されていることを検証
    expect(result.individual_deviation_rates).toEqual([
      { project_id: 'proj_001', deviation_rate: 5.0 },
      { project_id: 'proj_002', deviation_rate: 5.0 },
      { project_id: 'proj_003', deviation_rate: 10.0 },
      { project_id: 'proj_004', deviation_rate: 10.0 },
    ]);

    // 統計化されたデータに平均乖離率が含まれていることを検証
    // 平均: (5.0 + 5.0 + 10.0 + 10.0) / 4 = 7.5
    expect(result.statistics.average_deviation_rate).toBe(7.5);

    // 最大乖離率が正しく計算されていることを検証
    expect(result.statistics.max_deviation_rate).toBe(10.0);

    // 最小乖離率が正しく計算されていることを検証
    expect(result.statistics.min_deviation_rate).toBe(5.0);

    // 標準偏差が正しく計算されていることを検証
    // 分散: ((5.0-7.5)^2 + (5.0-7.5)^2 + (10.0-7.5)^2 + (10.0-7.5)^2) / 4
    //     = (6.25 + 6.25 + 6.25 + 6.25) / 4 = 6.25
    // 標準偏差: sqrt(6.25) = 2.5
    expect(result.statistics.standard_deviation).toBe(2.5);

    // 査定員別の乖離パターンが正しく分類されていることを確認
    expect(result.assessor_patterns).toEqual([
      {
        assessor_id: 'assessor_001',
        count: 2,
        average_deviation_rate: 7.5,
        pattern_classification: 'normal',
      },
      {
        assessor_id: 'assessor_002',
        count: 2,
        average_deviation_rate: 7.5,
        pattern_classification: 'normal',
      },
    ]);

    // 月次レポートとして統計結果が正しくフォーマットされていることを検証
    expect(result.monthly_report).toEqual({
      month: '2024-01',
      total_cases: 4,
      average_deviation_rate: 7.5,
      max_deviation_rate: 10.0,
      min_deviation_rate: 5.0,
      standard_deviation: 2.5,
      assessor_count: 2,
    });

    // 複数案件の乖離率データが統計処理されていることを確認
    expect(result.individual_deviation_rates.length).toBe(4);
    expect(Array.isArray(result.individual_deviation_rates)).toBe(true);
    expect(typeof result.statistics.average_deviation_rate).toBe('number');
    expect(typeof result.statistics.standard_deviation).toBe('number');

    // 査定員別パターン分類が存在することを確認
    expect(result.assessor_patterns.length).toBeGreaterThanOrEqual(2);
    expect(result.assessor_patterns.every(p => p.pattern_classification)).toBe(true);
  });
});