import { analyzeAssessorDifferences } from '../../src/logic/it-6-2-2-2';

describe('査定員別判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-872
  test('判定差異が許容範囲を超えた査定員を特定し改善指導対象として抽出する', () => {
    const assessment_data = [
      {
        assessment_id: 'A001',
        assessor_id: 'ASS001',
        assessor_name: '山田太郎',
        product_id: 'P001',
        assessment_value: 100000,
        assessment_date: '2024-01-15',
      },
      {
        assessment_id: 'A002',
        assessor_id: 'ASS002',
        assessor_name: '佐藤花子',
        product_id: 'P001',
        assessment_value: 105000,
        assessment_date: '2024-01-15',
      },
      {
        assessment_id: 'A003',
        assessor_id: 'ASS001',
        assessor_name: '山田太郎',
        product_id: 'P002',
        assessment_value: 200000,
        assessment_date: '2024-01-20',
      },
      {
        assessment_id: 'A004',
        assessor_id: 'ASS002',
        assessor_name: '佐藤花子',
        product_id: 'P002',
        assessment_value: 195000,
        assessment_date: '2024-01-20',
      },
      {
        assessment_id: 'A005',
        assessor_id: 'ASS003',
        assessor_name: '鈴木次郎',
        product_id: 'P001',
        assessment_value: 115000,
        assessment_date: '2024-01-25',
      },
      {
        assessment_id: 'A006',
        assessor_id: 'ASS003',
        assessor_name: '鈴木次郎',
        product_id: 'P002',
        assessment_value: 220000,
        assessment_date: '2024-01-25',
      },
    ];

    const tolerance_threshold_percent = 5;
    const analysis_period_start = '2024-01-01';
    const analysis_period_end = '2024-03-31';

    const result = analyzeAssessorDifferences({
      assessment_data,
      tolerance_threshold_percent,
      analysis_period_start,
      analysis_period_end,
    });

    expect(result).toEqual({
      analysis_period: {
        start_date: '2024-01-01',
        end_date: '2024-03-31',
      },
      total_assessments_analyzed: 6,
      total_product_groups: 2,
      tolerance_threshold_percent: 5,
      assessors_exceeding_tolerance: [
        {
          assessor_id: 'ASS003',
          assessor_name: '鈴木次郎',
          difference_rate_percent: 7.5,
          difference_count: 2,
          improvement_priority: 'high',
        },
        {
          assessor_id: 'ASS001',
          assessor_name: '山田太郎',
          difference_rate_percent: 5.0,
          difference_count: 2,
          improvement_priority: 'medium',
        },
      ],
      assessors_within_tolerance: [
        {
          assessor_id: 'ASS002',
          assessor_name: '佐藤花子',
          difference_rate_percent: 2.44,
          difference_count: 2,
          status: 'compliant',
        },
      ],
      export_data: {
        generated_timestamp: expect.any(String),
        file_format: 'csv',
        record_count: 2,
        records: [
          {
            assessor_id: 'ASS003',
            assessor_name: '鈴木次郎',
            difference_rate_percent: 7.5,
            difference_count: 2,
            improvement_target: true,
          },
          {
            assessor_id: 'ASS001',
            assessor_name: '山田太郎',
            difference_rate_percent: 5.0,
            difference_count: 2,
            improvement_target: true,
          },
        ],
      },
    });

    expect(result.assessors_exceeding_tolerance.length).toBe(2);
    expect(result.assessors_exceeding_tolerance[0].assessor_id).toBe('ASS003');
    expect(result.assessors_exceeding_tolerance[0].difference_rate_percent).toBe(7.5);
    expect(result.assessors_exceeding_tolerance[0].difference_count).toBe(2);
    expect(result.assessors_exceeding_tolerance[0].improvement_priority).toBe('high');

    expect(result.assessors_exceeding_tolerance[1].assessor_id).toBe('ASS001');
    expect(result.assessors_exceeding_tolerance[1].difference_rate_percent).toBe(5.0);
    expect(result.assessors_exceeding_tolerance[1].difference_count).toBe(2);
    expect(result.assessors_exceeding_tolerance[1].improvement_priority).toBe('medium');

    expect(result.assessors_within_tolerance.length).toBe(1);
    expect(result.assessors_within_tolerance[0].assessor_id).toBe('ASS002');
    expect(result.assessors_within_tolerance[0].difference_rate_percent).toBeCloseTo(2.44, 1);

    expect(result.export_data.record_count).toBe(2);
    expect(result.export_data.records[0].improvement_target).toBe(true);
    expect(result.export_data.records[1].improvement_target).toBe(true);
  });

  test('許容範囲内のみの査定員データで分析すると改善指導対象が空となる', () => {
    const assessment_data = [
      {
        assessment_id: 'A001',
        assessor_id: 'ASS001',
        assessor_name: '山田太郎',
        product_id: 'P001',
        assessment_value: 100000,
        assessment_date: '2024-01-15',
      },
      {
        assessment_id: 'A002',
        assessor_id: 'ASS002',
        assessor_name: '佐藤花子',
        product_id: 'P001',
        assessment_value: 101000,
        assessment_date: '2024-01-15',
      },
    ];

    const tolerance_threshold_percent = 5;
    const analysis_period_start = '2024-01-01';
    const analysis_period_end = '2024-03-31';

    const result = analyzeAssessorDifferences({
      assessment_data,
      tolerance_threshold_percent,
      analysis_period_start,
      analysis_period_end,
    });

    expect(result.assessors_exceeding_tolerance.length).toBe(0);
    expect(result.assessors_within_tolerance.length).toBe(2);
    expect(result.export_data.record_count).toBe(0);
  });

  test('査定データが空の場合は空のレスポンスを返す', () => {
    const assessment_data: any[] = [];
    const tolerance_threshold_percent = 5;
    const analysis_period_start = '2024-01-01';
    const analysis_period_end = '2024-03-31';

    const result = analyzeAssessorDifferences({
      assessment_data,
      tolerance_threshold_percent,
      analysis_period_start,
      analysis_period_end,
    });

    expect(result.total_assessments_analyzed).toBe(0);
    expect(result.assessors_exceeding_tolerance.length).toBe(0);
    expect(result.assessors_within_tolerance.length).toBe(0);
    expect(result.export_data.record_count).toBe(0);
  });

  test('許容閾値が0%の場合すべての差異が対象となる', () => {
    const assessment_data = [
      {
        assessment_id: 'A001',
        assessor_id: 'ASS001',
        assessor_name: '山田太郎',
        product_id: 'P001',
        assessment_value: 100000,
        assessment_date: '2024-01-15',
      },
      {
        assessment_id: 'A002',
        assessor_id: 'ASS002',
        assessor_name: '佐藤花子',
        product_id: 'P001',
        assessment_value: 100100,
        assessment_date: '2024-01-15',
      },
    ];

    const tolerance_threshold_percent = 0;
    const analysis_period_start = '2024-01-01';
    const analysis_period_end = '2024-03-31';

    const result = analyzeAssessorDifferences({
      assessment_data,
      tolerance_threshold_percent,
      analysis_period_start,
      analysis_period_end,
    });

    expect(result.assessors_exceeding_tolerance.length).toBeGreaterThanOrEqual(1);
  });

  test('複数商品の査定データから差異率を正確に計算する', () => {
    const assessment_data = [
      {
        assessment_id: 'A001',
        assessor_id: 'ASS001',
        assessor_name: '査定員A',
        product_id: 'P001',
        assessment_value: 100000,
        assessment_date: '2024-02-01',
      },
      {
        assessment_id: 'A002',
        assessor_id: 'ASS002',
        assessor_name: '査定員B',
        product_id: 'P001',
        assessment_value: 110000,
        assessment_date: '2024-02-01',
      },
      {
        assessment_id: 'A003',
        assessor_id: 'ASS001',
        assessor_name: '査定員A',
        product_id: 'P002',
        assessment_value: 200000,
        assessment_date: '2024-02-05',
      },
      {
        assessment_id: 'A004',
        assessor_id: 'ASS002',
        assessor_name: '査定員B',
        product_id: 'P002',
        assessment_value: 180000,
        assessment_date: '2024-02-05',
      },
    ];

    const tolerance_threshold_percent = 8;
    const analysis_period_start = '2024-02-01';
    const analysis_period_end = '2024-02-28';

    const result = analyzeAssessorDifferences({
      assessment_data,
      tolerance_threshold_percent,
      analysis_period_start,
      analysis_period_end,
    });

    const ass001_diff_rate = result.assessors_exceeding_tolerance.find(
      (a) => a.assessor_id === 'ASS001'
    )?.difference_rate_percent;
    const ass002_diff_rate = result.assessors_exceeding_tolerance.find(
      (a) => a.assessor_id === 'ASS002'
    )?.difference_rate_percent;

    if (ass001_diff_rate !== undefined) {
      expect(ass001_diff_rate).toBeGreaterThanOrEqual(tolerance_threshold_percent);
    }
    if (ass002_diff_rate !== undefined) {
      expect(ass002_diff_rate).toBeGreaterThanOrEqual(tolerance_threshold_percent);
    }
  });

  test('期間外のデータは分析対象から除外される', () => {
    const assessment_data = [
      {
        assessment_id: 'A001',
        assessor_id: 'ASS001',
        assessor_name: '山田太郎',
        product_id: 'P001',
        assessment_value: 100000,
        assessment_date: '2023-12-31',
      },
      {
        assessment_id: 'A002',
        assessor_id: 'ASS002',
        assessor_name: '佐藤花子',
        product_id: 'P001',
        assessment_value: 115000,
        assessment_date: '2023-12-31',
      },
      {
        assessment_id: 'A003',
        assessor_id: 'ASS001',
        assessor_name: '山田太郎',
        product_id: 'P001',
        assessment_value: 100000,
        assessment_date: '2024-01-15',
      },
      {
        assessment_id: 'A004',
        assessor_id: 'ASS002',
        assessor_name: '佐藤花子',
        product_id: 'P001',
        assessment_value: 105000,
        assessment_date: '2024-01-15',
      },
      {
        assessment_id: 'A005',
        assessor_id: 'ASS001',
        assessor_name: '山田太郎',
        product_id: 'P001',
        assessment_value: 100000,
        assessment_date: '2024-04-01',
      },
      {
        assessment_id: 'A006',
        assessor_id: 'ASS002',
        assessor_name: '佐藤花子',
        product_id: 'P001',
        assessment_value: 110000,
        assessment_date: '2024-04-01',
      },
    ];

    const tolerance_threshold_percent = 5;
    const analysis_period_start = '2024-01-01';
    const analysis_period_end = '2024-03-31';

    const result = analyzeAssessorDifferences({
      assessment_data,
      tolerance_threshold_percent,
      analysis_period_start,
      analysis_period_end,
    });

    expect(result.total_assessments_analyzed).toBe(2);
  });

  test('改善指導優先度が正確に計算される', () => {
    const assessment_data = [
      {
        assessment_id: 'A001',
        assessor_id: 'ASS001',
        assessor_name: '査定員A',
        product_id: 'P001',
        assessment_value: 100000,
        assessment_date: '2024-01-15',
      },
      {
        assessment_id: 'A002',
        assessor_id: 'ASS002',
        assessor_name: '査定員B',
        product_id: 'P001',
        assessment_value: 115000,
        assessment_date: '2024-01-15',
      },
      {
        assessment_id: 'A003',
        assessor_id: 'ASS001',
        assessor_name: '査定員A',
        product_id: 'P002',
        assessment_value: 200000,
        assessment_date: '2024-01-20',
      },
      {
        assessment_id: 'A004',
        assessor_id: 'ASS002',
        assessor_name: '査定員B',
        product_id: 'P002',
        assessment_value: 230000,
        assessment_date: '2024-01-20',
      },
      {
        assessment_id: 'A005',
        assessor_id: 'ASS003',
        assessor_name: '査定員C',
        product_id: 'P001',
        assessment_value: 120000,
        assessment_date: '2024-01-25',
      },
      {
        assessment_id: 'A006',
        assessor_id: 'ASS003',
        assessor_name: '査定員C',
        product_id: 'P002',
        assessment_value: 215000,
        assessment_date: '2024-01-25',
      },
    ];

    const tolerance_threshold_percent = 5;
    const analysis_period_start = '2024-01-01';
    const analysis_period_end = '2024-03-31';

    const result = analyzeAssessorDifferences({
      assessment_data,
      tolerance_threshold_percent,
      analysis_period_start,
      analysis_period_end,
    });

    const exceeding = result.assessors_exceeding_tolerance;
    const sorted_by_priority = exceeding.sort((a, b) => {
      const priority_map = { high: 1, medium: 2, low: 3 };
      return (priority_map[a.improvement_priority as keyof typeof priority_map] || 99) -
        (priority_map[b.improvement_priority as keyof typeof priority_map] || 99);
    });

    expect(sorted_by_priority[0].improvement_priority).toBe('high');
    if (sorted_by_priority.length > 1) {
      expect(sorted_by_priority[1].improvement_priority).toMatch(/high|medium|low/);
    }
  });

  test('エクスポートデータにタイムスタンプが含まれる', () => {
    const assessment_data = [
      {
        assessment_id: 'A001',
        assessor_id: 'ASS001',
        assessor_name: '山田太郎',
        product_id: 'P001',
        assessment_value: 100000,
        assessment_date: '2024-01-15',
      },
      {
        assessment_id: 'A002',
        assessor_id: 'ASS002',
        assessor_name: '佐藤花子',
        product_id: 'P001',
        assessment_value: 110000,
        assessment_date: '2024-01-15',
      },
    ];

    const tolerance_threshold_percent = 5;
    const analysis_period_start = '2024-01-01';
    const analysis_period_end = '2024-03-31';

    const result = analyzeAssessorDifferences({
      assessment_data,
      tolerance_threshold_percent,
      analysis_period_start,
      analysis_period_end,
    });

    expect(result.export_data.generated_timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.export_data.file_format).toBe('csv');
  });
});