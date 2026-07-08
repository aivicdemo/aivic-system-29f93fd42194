import { calculateAssessorAccuracyMetrics } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1059
  test('各査定員の判定精度（乖離率・乖離額・一致度）が自動計算される', () => {
    const assessments = [
      {
        assessor_id: 'A001',
        assessment_amount: 1000000,
        reference_amount: 1000000,
        assessment_result: 'approved',
      },
      {
        assessor_id: 'A001',
        assessment_amount: 950000,
        reference_amount: 1000000,
        assessment_result: 'approved',
      },
      {
        assessor_id: 'A001',
        assessment_amount: 1000000,
        reference_amount: 1000000,
        assessment_result: 'approved',
      },
      {
        assessor_id: 'A002',
        assessment_amount: 900000,
        reference_amount: 1000000,
        assessment_result: 'approved',
      },
      {
        assessor_id: 'A002',
        assessment_amount: 1000000,
        reference_amount: 1000000,
        assessment_result: 'approved',
      },
      {
        assessor_id: 'A002',
        assessment_amount: 1100000,
        reference_amount: 1000000,
        assessment_result: 'rejected',
      },
    ];

    const result = calculateAssessorAccuracyMetrics(assessments);

    // 査定員A001の精度指標検証
    // 評価額: [1000000, 950000, 1000000]
    // 基準額: [1000000, 1000000, 1000000]
    // 乖離率計算: ((|1000000-1000000|/1000000) + (|950000-1000000|/1000000) + (|1000000-1000000|/1000000)) / 3
    //          = (0 + 0.05 + 0) / 3 = 0.0167 (1.67%)
    // 乖離額計算: (|1000000-1000000| + |950000-1000000| + |1000000-1000000|) / 3
    //          = (0 + 50000 + 0) / 3 = 16666.67
    // 一致度: approved結果が3件中3件 = 100%
    expect(result.assessors).toHaveLength(2);

    const assessor_a001 = result.assessors.find(
      (a) => a.assessor_id === 'A001'
    );
    expect(assessor_a001).toBeDefined();
    expect(assessor_a001.deviation_rate).toBeCloseTo(1.67, 1);
    expect(assessor_a001.deviation_amount).toBeCloseTo(16666.67, 0);
    expect(assessor_a001.agreement_rate).toBe(100);
    expect(assessor_a001.total_assessments).toBe(3);

    // 査定員A002の精度指標検証
    // 評価額: [900000, 1000000, 1100000]
    // 基準額: [1000000, 1000000, 1000000]
    // 乖離率計算: ((|900000-1000000|/1000000) + (|1000000-1000000|/1000000) + (|1100000-1000000|/1000000)) / 3
    //          = (0.10 + 0 + 0.10) / 3 = 0.0667 (6.67%)
    // 乖離額計算: (|900000-1000000| + |1000000-1000000| + |1100000-1000000|) / 3
    //          = (100000 + 0 + 100000) / 3 = 66666.67
    // 一致度: approved結果が3件中2件 = 66.67%
    const assessor_a002 = result.assessors.find(
      (a) => a.assessor_id === 'A002'
    );
    expect(assessor_a002).toBeDefined();
    expect(assessor_a002.deviation_rate).toBeCloseTo(6.67, 1);
    expect(assessor_a002.deviation_amount).toBeCloseTo(66666.67, 0);
    expect(assessor_a002.agreement_rate).toBeCloseTo(66.67, 1);
    expect(assessor_a002.total_assessments).toBe(3);

    // 全体の統計値検証
    expect(result.summary).toBeDefined();
    expect(result.summary.total_assessors).toBe(2);
    expect(result.summary.total_assessments).toBe(6);

    // 平均乖離率: (1.67 + 6.67) / 2 = 4.17%
    expect(result.summary.average_deviation_rate).toBeCloseTo(4.17, 1);

    // 平均乖離額: (16666.67 + 66666.67) / 2 = 41666.67
    expect(result.summary.average_deviation_amount).toBeCloseTo(41666.67, 0);

    // 平均一致度: (100 + 66.67) / 2 = 83.33%
    expect(result.summary.average_agreement_rate).toBeCloseTo(83.33, 1);

    // 最高精度査定員の検証（乖離率が最小）
    expect(result.summary.best_assessor).toBe('A001');
    expect(result.summary.best_assessor_deviation_rate).toBeCloseTo(1.67, 1);

    // 改善対象査定員の検証（乖離率が最大）
    expect(result.summary.improvement_target_assessor).toBe('A002');
    expect(result.summary.improvement_target_deviation_rate).toBeCloseTo(6.67, 1);

    // 再計算タイムスタンプが記録されていることを検証
    expect(result.last_calculated_at).toBeDefined();
    expect(typeof result.last_calculated_at).toBe('string');
  });
});