import { analyzeAssessorJudgmentVariance } from '../../src/logic/it-6-2-2-1';

describe('査定員間判定差異分析機能', () => {
  // SCEN-871: [normal] 複数査定員の判定結果を比較し、差異を定量化して許容範囲を判定する
  test('複数査定員の判定結果から差異を定量化し許容範囲を判定する', () => {
    // テストデータ: 3名の査定員による同一商品の査定結果
    const assessment_results = [
      {
        assessor_id: 'ASSESS001',
        assessor_name: '査定員A',
        item_id: 'ITEM20240115001',
        rank: 'A',
        assessed_amount: 150000,
        condition_score: 85,
        assessment_timestamp: new Date('2024-01-15T10:00:00Z'),
      },
      {
        assessor_id: 'ASSESS002',
        assessor_name: '査定員B',
        item_id: 'ITEM20240115001',
        rank: 'A',
        assessed_amount: 152000,
        condition_score: 86,
        assessment_timestamp: new Date('2024-01-15T10:15:00Z'),
      },
      {
        assessor_id: 'ASSESS003',
        assessor_name: '査定員C',
        item_id: 'ITEM20240115001',
        rank: 'B',
        assessed_amount: 140000,
        condition_score: 78,
        assessment_timestamp: new Date('2024-01-15T10:30:00Z'),
      },
    ];

    const tolerance_criteria = {
      max_amount_variance_rate: 0.08,
      max_condition_variance_rate: 0.12,
      max_coefficient_of_variation: 0.10,
    };

    const result = analyzeAssessorJudgmentVariance(
      assessment_results,
      tolerance_criteria
    );

    // 期待値計算:
    // assessed_amount の平均: (150000 + 152000 + 140000) / 3 = 147333.33
    // assessed_amount の標準偏差: sqrt(((150000-147333.33)^2 + (152000-147333.33)^2 + (140000-147333.33)^2) / 3)
    //   = sqrt((2666.67^2 + 4666.67^2 + (-7333.33)^2) / 3)
    //   = sqrt((7111088.89 + 21777777.78 + 53777777.78) / 3)
    //   = sqrt(27888881.48) = 5280.81
    // 変動係数 (CV) = 5280.81 / 147333.33 = 0.0358 (3.58%)
    // 最大-最小 = 152000 - 140000 = 12000
    // 最大-最小の率 = 12000 / 147333.33 = 0.0815 (8.15%)

    // condition_score の平均: (85 + 86 + 78) / 3 = 83
    // condition_score の標準偏差: sqrt(((85-83)^2 + (86-83)^2 + (78-83)^2) / 3)
    //   = sqrt((4 + 9 + 25) / 3) = sqrt(12.67) = 3.56
    // 変動係数 (CV) = 3.56 / 83 = 0.0429 (4.29%)
    // 最大-最小 = 86 - 78 = 8
    // 最大-最小の率 = 8 / 83 = 0.0964 (9.64%)

    expect(result).toEqual({
      item_id: 'ITEM20240115001',
      assessor_count: 3,
      amount_statistics: {
        mean: 147333.33,
        std_dev: 5280.81,
        coefficient_of_variation: 0.0358,
        max_value: 152000,
        min_value: 140000,
        range: 12000,
        range_rate: 0.0815,
      },
      condition_statistics: {
        mean: 83,
        std_dev: 3.56,
        coefficient_of_variation: 0.0429,
        max_value: 86,
        min_value: 78,
        range: 8,
        range_rate: 0.0964,
      },
      rank_agreement: {
        agreement_count: 2,
        disagreement_count: 1,
        agreement_rate: 0.6667,
        dominant_rank: 'A',
        outlier_ranks: ['B'],
      },
      tolerance_judgment: {
        amount_within_tolerance: true,
        condition_within_tolerance: true,
        cv_within_tolerance: true,
        overall_result: 'WITHIN_TOLERANCE',
      },
      outlier_assessors: [
        {
          assessor_id: 'ASSESS003',
          assessor_name: '査定員C',
          outlier_reason: ['rank_disagreement', 'amount_below_range'],
          assessed_amount: 140000,
          condition_score: 78,
        },
      ],
      detailed_comparison: [
        {
          assessor_id: 'ASSESS001',
          amount_variance_from_mean: 2666.67,
          amount_variance_rate: 0.0181,
          condition_variance_from_mean: 2,
          condition_variance_rate: 0.0241,
        },
        {
          assessor_id: 'ASSESS002',
          amount_variance_from_mean: 4666.67,
          amount_variance_rate: 0.0317,
          condition_variance_from_mean: 3,
          condition_variance_rate: 0.0361,
        },
        {
          assessor_id: 'ASSESS003',
          amount_variance_from_mean: -7333.33,
          amount_variance_rate: -0.0498,
          condition_variance_from_mean: -5,
          condition_variance_rate: -0.0602,
        },
      ],
      export_available: {
        csv: true,
        pdf: true,
      },
      analysis_timestamp: new Date('2024-01-15T11:00:00Z'),
    });

    // 許容範囲基準値との比較検証
    expect(result.tolerance_judgment.amount_within_tolerance).toBe(true);
    expect(result.tolerance_judgment.condition_within_tolerance).toBe(true);
    expect(result.tolerance_judgment.overall_result).toBe('WITHIN_TOLERANCE');

    // 外れ値検出の検証
    expect(result.outlier_assessors).toHaveLength(1);
    expect(result.outlier_assessors[0].assessor_id).toBe('ASSESS003');
    expect(result.outlier_assessors[0].outlier_reason).toContain(
      'rank_disagreement'
    );

    // ランク合意度の検証
    expect(result.rank_agreement.agreement_rate).toBe(0.6667);
    expect(result.rank_agreement.dominant_rank).toBe('A');

    // エクスポート機能の検証
    expect(result.export_available.csv).toBe(true);
    expect(result.export_available.pdf).toBe(true);
  });

  test('許容範囲外の大きな差異が検出される場合', () => {
    const assessment_results = [
      {
        assessor_id: 'ASSESS004',
        assessor_name: '査定員D',
        item_id: 'ITEM20240115002',
        rank: 'S',
        assessed_amount: 200000,
        condition_score: 95,
        assessment_timestamp: new Date('2024-01-15T12:00:00Z'),
      },
      {
        assessor_id: 'ASSESS005',
        assessor_name: '査定員E',
        item_id: 'ITEM20240115002',
        rank: 'C',
        assessed_amount: 100000,
        condition_score: 50,
        assessment_timestamp: new Date('2024-01-15T12:15:00Z'),
      },
      {
        assessor_id: 'ASSESS006',
        assessor_name: '査定員F',
        item_id: 'ITEM20240115002',
        rank: 'B',
        assessed_amount: 120000,
        condition_score: 60,
        assessment_timestamp: new Date('2024-01-15T12:30:00Z'),
      },
    ];

    const tolerance_criteria = {
      max_amount_variance_rate: 0.05,
      max_condition_variance_rate: 0.08,
      max_coefficient_of_variation: 0.06,
    };

    const result = analyzeAssessorJudgmentVariance(
      assessment_results,
      tolerance_criteria
    );

    // assessed_amount の平均: (200000 + 100000 + 120000) / 3 = 140000
    // assessed_amount の標準偏差: sqrt(((200000-140000)^2 + (100000-140000)^2 + (120000-140000)^2) / 3)
    //   = sqrt((3600000000 + 1600000000 + 400000000) / 3)
    //   = sqrt(1866666666.67) = 43205.06
    // 変動係数 (CV) = 43205.06 / 140000 = 0.3086 (30.86%)
    // 最大-最小 = 200000 - 100000 = 100000
    // 最大-最小の率 = 100000 / 140000 = 0.7143 (71.43%)

    expect(result.tolerance_judgment.overall_result).toBe(
      'OUT_OF_TOLERANCE'
    );
    expect(result.tolerance_judgment.amount_within_tolerance).toBe(false);
    expect(result.tolerance_judgment.cv_within_tolerance).toBe(false);
    expect(result.outlier_assessors).toHaveLength(2);
    expect(result.rank_agreement.agreement_rate).toBe(0.3333);
  });

  test('2名の査定員では差異分析を実施して警告メッセージを返す', () => {
    const assessment_results = [
      {
        assessor_id: 'ASSESS007',
        assessor_name: '査定員G',
        item_id: 'ITEM20240115003',
        rank: 'A',
        assessed_amount: 180000,
        condition_score: 88,
        assessment_timestamp: new Date('2024-01-15T13:00:00Z'),
      },
      {
        assessor_id: 'ASSESS008',
        assessor_name: '査定員H',
        item_id: 'ITEM20240115003',
        rank: 'A',
        assessed_amount: 185000,
        condition_score: 90,
        assessment_timestamp: new Date('2024-01-15T13:15:00Z'),
      },
    ];

    const tolerance_criteria = {
      max_amount_variance_rate: 0.10,
      max_condition_variance_rate: 0.15,
      max_coefficient_of_variation: 0.10,
    };

    const result = analyzeAssessorJudgmentVariance(
      assessment_results,
      tolerance_criteria
    );

    expect(result.assessor_count).toBe(2);
    expect(result).toHaveProperty('warning_message');
  });

  test('同一査定員の重複データが入力された場合はエラーを返す', () => {
    const assessment_results = [
      {
        assessor_id: 'ASSESS009',
        assessor_name: '査定員I',
        item_id: 'ITEM20240115004',
        rank: 'A',
        assessed_amount: 170000,
        condition_score: 82,
        assessment_timestamp: new Date('2024-01-15T14:00:00Z'),
      },
      {
        assessor_id: 'ASSESS009',
        assessor_name: '査定員I',
        item_id: 'ITEM20240115004',
        rank: 'A',
        assessed_amount: 172000,
        condition_score: 84,
        assessment_timestamp: new Date('2024-01-15T14:15:00Z'),
      },
      {
        assessor_id: 'ASSESS010',
        assessor_name: '査定員J',
        item_id: 'ITEM20240115004',
        rank: 'B',
        assessed_amount: 160000,
        condition_score: 75,
        assessment_timestamp: new Date('2024-01-15T14:30:00Z'),
      },
    ];

    const tolerance_criteria = {
      max_amount_variance_rate: 0.10,
      max_condition_variance_rate: 0.15,
      max_coefficient_of_variation: 0.10,
    };

    expect(() =>
      analyzeAssessorJudgmentVariance(assessment_results, tolerance_criteria)
    ).toThrow(/重複査定員/);
  });

  test('異なる item_id のデータが混在する場合はエラーを返す', () => {
    const assessment_results = [
      {
        assessor_id: 'ASSESS011',
        assessor_name: '査定員K',
        item_id: 'ITEM20240115005',
        rank: 'A',
        assessed_amount: 165000,
        condition_score: 80,
        assessment_timestamp: new Date('2024-01-15T15:00:00Z'),
      },
      {
        assessor_id: 'ASSESS012',
        assessor_name: '査定員L',
        item_id: 'ITEM20240115006',
        rank: 'A',
        assessed_amount: 168000,
        condition_score: 82,
        assessment_timestamp: new Date('2024-01-15T15:15:00Z'),
      },
      {
        assessor_id: 'ASSESS013',
        assessor_name: '査定員M',
        item_id: 'ITEM20240115005',
        rank: 'B',
        assessed_amount: 155000,
        condition_score: 72,
        assessment_timestamp: new Date('2024-01-15T15:30:00Z'),
      },
    ];

    const tolerance_criteria = {
      max_amount_variance_rate: 0.10,
      max_condition_variance_rate: 0.15,
      max_coefficient_of_variation: 0.10,
    };

    expect(() =>
      analyzeAssessorJudgmentVariance(assessment_results, tolerance_criteria)
    ).toThrow(/item_id一貫性/);
  });

  test('assessed_amount または condition_score が負数の場合はエラーを返す', () => {
    const assessment_results = [
      {
        assessor_id: 'ASSESS014',
        assessor_name: '査定員N',
        item_id: 'ITEM20240115007',
        rank: 'A',
        assessed_amount: -150000,
        condition_score: 85,
        assessment_timestamp: new Date('2024-01-15T16:00:00Z'),
      },
      {
        assessor_id: 'ASSESS015',
        assessor_name: '査定員O',
        item_id: 'ITEM20240115007',
        rank: 'A',
        assessed_amount: 152000,
        condition_score: 86,
        assessment_timestamp: new Date('2024-01-15T16:15:00Z'),
      },
      {
        assessor_id: 'ASSESS016',
        assessor_name: '査定員P',
        item_id: 'ITEM20240115007',
        rank: 'A',
        assessed_amount: 155000,
        condition_score: 88,
        assessment_timestamp: new Date('2024-01-15T16:30:00Z'),
      },
    ];

    const tolerance_criteria = {
      max_amount_variance_rate: 0.10,
      max_condition_variance_rate: 0.15,
      max_coefficient_of_variation: 0.10,
    };

    expect(() =>
      analyzeAssessorJudgmentVariance(assessment_results, tolerance_criteria)
    ).toThrow(/assessed_amount/);
  });

  test('condition_score が 0-100 の範囲外の場合はエラーを返す', () => {
    const assessment_results = [
      {
        assessor_id: 'ASSESS017',
        assessor_name: '査定員Q',
        item_id: 'ITEM20240115008',
        rank: 'A',
        assessed_amount: 150000,
        condition_score: 105,
        assessment_timestamp: new Date('2024-01-15T17:00:00Z'),
      },
      {
        assessor_id: 'ASSESS018',
        assessor_name: '査定員R',
        item_id: 'ITEM20240115008',
        rank: 'A',
        assessed_amount: 152000,
        condition_score: 86,
        assessment_timestamp: new Date('2024-01-15T17:15:00Z'),
      },
      {
        assessor_id: 'ASSESS019',
        assessor_name: '査定員S',
        item_id: 'ITEM20240115008',
        rank: 'A',
        assessed_amount: 155000,
        condition_score: 88,
        assessment_timestamp: new Date('2024-01-15T17:30:00Z'),
      },
    ];

    const tolerance_criteria = {
      max_amount_variance_rate: 0.10,
      max_condition_variance_rate: 0.15,
      max_coefficient_of_variation: 0.10,
    };

    expect(() =>
      analyzeAssessorJudgmentVariance(assessment_results, tolerance_criteria)
    ).toThrow(/condition_score/);
  });

  test('許容範囲基準値が 0-1 の範囲外の場合はエラーを返す', () => {
    const assessment_results = [
      {
        assessor_id: 'ASSESS020',
        assessor_name: '査定員T',
        item_id: 'ITEM20240115009',
        rank: 'A',
        assessed_amount: 150000,
        condition_score: 85,
        assessment_timestamp: new Date('2024-01-15T18:00:00Z'),
      },
      {
        assessor_id: 'ASSESS021',
        assessor_name: '査定員U',
        item_id: 'ITEM20240115009',
        rank: 'A',
        assessed_amount: 152000,
        condition_score: 86,
        assessment_timestamp: new Date('2024-01-15T18:15:00Z'),
      },
      {
        assessor_id: 'ASSESS022',
        assessor_name: '査定員V',
        item_id: 'ITEM20240115009',
        rank: 'A',
        assessed_amount: 155000,
        condition_score: 88,
        assessment_timestamp: new Date('2024-01-15T18:30:00Z'),
      },
    ];

    const tolerance_criteria = {
      max_amount_variance_rate: 1.5,
      max_condition_variance_rate: 0.15,
      max_coefficient_of_variation: 0.10,
    };

    expect(() =>
      analyzeAssessorJudgmentVariance(assessment_results, tolerance_criteria)
    ).toThrow(/許容範囲/);
  });
});