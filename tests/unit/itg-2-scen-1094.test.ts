import { describe, test, expect, beforeEach } from '@jest/globals';
import { aggregateJudgmentAccuracyByAssessor } from '../../src/logic/it-6-2-1-1';

describe('IT-6-2-1-1: 査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1094: [edge] 学習データ更新・モデル再学習実行機能 - 学習データ件数が1件の境界値で、再学習が正常に完了する
  test('学習データ1件の境界値で再学習が正常に完了し、判定精度指標が集計される', () => {
    const assessmentResults = [
      {
        assessorId: 'A001',
        constructionType: '建築工事',
        amountBand: '1000万～5000万',
        quotationAmount: 2500,
        deviationRate: 3.5,
        deviationAmount: 87500,
        assessmentTime: 18,
        referenceDataCount: 1,
        judgmentLogicApplied: 'logic_v1',
        assessmentDate: new Date('2024-01-15T10:30:00Z'),
        isCorrect: true
      }
    ];

    const result = aggregateJudgmentAccuracyByAssessor(assessmentResults);

    expect(result).toBeDefined();
    expect(result.totalAssessments).toBe(1);
    expect(result.byAssessor).toBeDefined();
    expect(Array.isArray(result.byAssessor)).toBe(true);
    expect(result.byAssessor.length).toBe(1);

    const assessorMetric = result.byAssessor[0];
    expect(assessorMetric.assessorId).toBe('A001');
    expect(assessorMetric.assessmentCount).toBe(1);
    expect(assessorMetric.accuracyRate).toBe(100);
    expect(assessorMetric.averageDeviationRate).toBe(3.5);
    expect(assessorMetric.averageAssessmentTime).toBe(18);

    expect(result.byConstructionType).toBeDefined();
    expect(Array.isArray(result.byConstructionType)).toBe(true);
    expect(result.byConstructionType.length).toBe(1);

    const constructionMetric = result.byConstructionType[0];
    expect(constructionMetric.constructionType).toBe('建築工事');
    expect(constructionMetric.assessmentCount).toBe(1);
    expect(constructionMetric.accuracyRate).toBe(100);
    expect(constructionMetric.averageDeviationRate).toBe(3.5);

    expect(result.byAmountBand).toBeDefined();
    expect(Array.isArray(result.byAmountBand)).toBe(true);
    expect(result.byAmountBand.length).toBe(1);

    const amountBandMetric = result.byAmountBand[0];
    expect(amountBandMetric.amountBand).toBe('1000万～5000万');
    expect(amountBandMetric.assessmentCount).toBe(1);
    expect(amountBandMetric.accuracyRate).toBe(100);
    expect(amountBandMetric.averageDeviationRate).toBe(3.5);

    expect(result.modelUpdateTimestamp).toBeDefined();
    expect(typeof result.modelUpdateTimestamp).toBe('string');

    expect(result.retrainingStatus).toBe('completed');
    expect(result.retrainingCompletedAt).toBeDefined();
    expect(typeof result.retrainingCompletedAt).toBe('string');
  });

  // 複数の境界値・エラーケースを含める
  test('空のデータセット入力時、エラーが発生する', () => {
    const emptyResults: typeof assessmentResults = [];

    expect(() => {
      aggregateJudgmentAccuracyByAssessor(emptyResults);
    }).toThrow(/学習データ/);
  });

  test('複数の査定担当者と工種・金額帯の組み合わせで精度指標が正確に集計される', () => {
    const assessmentResults = [
      {
        assessorId: 'A001',
        constructionType: '建築工事',
        amountBand: '1000万～5000万',
        quotationAmount: 2500,
        deviationRate: 2.0,
        deviationAmount: 50000,
        assessmentTime: 15,
        referenceDataCount: 5,
        judgmentLogicApplied: 'logic_v1',
        assessmentDate: new Date('2024-01-15T10:00:00Z'),
        isCorrect: true
      },
      {
        assessorId: 'A001',
        constructionType: '建築工事',
        amountBand: '1000万～5000万',
        quotationAmount: 3000,
        deviationRate: 5.5,
        deviationAmount: 165000,
        assessmentTime: 22,
        referenceDataCount: 4,
        judgmentLogicApplied: 'logic_v1',
        assessmentDate: new Date('2024-01-15T11:00:00Z'),
        isCorrect: false
      },
      {
        assessorId: 'A002',
        constructionType: '土木工事',
        amountBand: '5000万以上',
        quotationAmount: 8000,
        deviationRate: 1.2,
        deviationAmount: 96000,
        assessmentTime: 25,
        referenceDataCount: 8,
        judgmentLogicApplied: 'logic_v1',
        assessmentDate: new Date('2024-01-15T12:00:00Z'),
        isCorrect: true
      }
    ];

    const result = aggregateJudgmentAccuracyByAssessor(assessmentResults);

    expect(result.totalAssessments).toBe(3);

    const assessor_A001 = result.byAssessor.find(a => a.assessorId === 'A001');
    expect(assessor_A001).toBeDefined();
    expect(assessor_A001!.assessmentCount).toBe(2);
    expect(assessor_A001!.accuracyRate).toBe(50);
    expect(assessor_A001!.averageDeviationRate).toBeCloseTo(3.75, 2);
    expect(assessor_A001!.averageAssessmentTime).toBe(18.5);

    const assessor_A002 = result.byAssessor.find(a => a.assessorId === 'A002');
    expect(assessor_A002).toBeDefined();
    expect(assessor_A002!.assessmentCount).toBe(1);
    expect(assessor_A002!.accuracyRate).toBe(100);
    expect(assessor_A002!.averageDeviationRate).toBe(1.2);

    const arch_metric = result.byConstructionType.find(c => c.constructionType === '建築工事');
    expect(arch_metric).toBeDefined();
    expect(arch_metric!.assessmentCount).toBe(2);
    expect(arch_metric!.accuracyRate).toBe(50);

    const civil_metric = result.byConstructionType.find(c => c.constructionType === '土木工事');
    expect(civil_metric).toBeDefined();
    expect(civil_metric!.assessmentCount).toBe(1);
    expect(civil_metric!.accuracyRate).toBe(100);

    const mid_band = result.byAmountBand.find(b => b.amountBand === '1000万～5000万');
    expect(mid_band).toBeDefined();
    expect(mid_band!.assessmentCount).toBe(2);

    const high_band = result.byAmountBand.find(b => b.amountBand === '5000万以上');
    expect(high_band).toBeDefined();
    expect(high_band!.assessmentCount).toBe(1);
  });

  test('異常に高い乖離率を持つデータが判定精度に正確に反映される', () => {
    const assessmentResults = [
      {
        assessorId: 'A003',
        constructionType: '電気工事',
        amountBand: '100万～1000万',
        quotationAmount: 500,
        deviationRate: 45.0,
        deviationAmount: 225000,
        assessmentTime: 30,
        referenceDataCount: 2,
        judgmentLogicApplied: 'logic_v1',
        assessmentDate: new Date('2024-01-16T09:00:00Z'),
        isCorrect: false
      }
    ];

    const result = aggregateJudgmentAccuracyByAssessor(assessmentResults);

    const assessor_A003 = result.byAssessor.find(a => a.assessorId === 'A003');
    expect(assessor_A003!.accuracyRate).toBe(0);
    expect(assessor_A003!.averageDeviationRate).toBe(45.0);
  });

  test('同一査定担当者の複数工種・金額帯データが独立して集計される', () => {
    const assessmentResults = [
      {
        assessorId: 'A004',
        constructionType: '建築工事',
        amountBand: '1000万～5000万',
        quotationAmount: 2500,
        deviationRate: 2.0,
        deviationAmount: 50000,
        assessmentTime: 15,
        referenceDataCount: 5,
        judgmentLogicApplied: 'logic_v1',
        assessmentDate: new Date('2024-01-16T10:00:00Z'),
        isCorrect: true
      },
      {
        assessorId: 'A004',
        constructionType: '建築工事',
        amountBand: '500万～1000万',
        quotationAmount: 750,
        deviationRate: 3.5,
        deviationAmount: 26250,
        assessmentTime: 12,
        referenceDataCount: 3,
        judgmentLogicApplied: 'logic_v1',
        assessmentDate: new Date('2024-01-16T11:00:00Z'),
        isCorrect: true
      },
      {
        assessorId: 'A004',
        constructionType: '土木工事',
        amountBand: '1000万～5000万',
        quotationAmount: 3000,
        deviationRate: 4.0,
        deviationAmount: 120000,
        assessmentTime: 20,
        referenceDataCount: 6,
        judgmentLogicApplied: 'logic_v1',
        assessmentDate: new Date('2024-01-16T12:00:00Z'),
        isCorrect: true
      }
    ];

    const result = aggregateJudgmentAccuracyByAssessor(assessmentResults);

    const assessor_A004 = result.byAssessor.find(a => a.assessorId === 'A004');
    expect(assessor_A004!.assessmentCount).toBe(3);
    expect(assessor_A004!.accuracyRate).toBe(100);

    const band_500_1000 = result.byAmountBand.find(b => b.amountBand === '500万～1000万');
    expect(band_500_1000).toBeDefined();
    expect(band_500_1000!.assessmentCount).toBe(1);
  });

  test('モデル更新タイムスタンプが正常に記録される', () => {
    const assessmentResults = [
      {
        assessorId: 'A005',
        constructionType: '建築工事',
        amountBand: '1000万～5000万',
        quotationAmount: 2500,
        deviationRate: 3.0,
        deviationAmount: 75000,
        assessmentTime: 18,
        referenceDataCount: 4,
        judgmentLogicApplied: 'logic_v1',
        assessmentDate: new Date('2024-01-17T10:00:00Z'),
        isCorrect: true
      }
    ];

    const result = aggregateJudgmentAccuracyByAssessor(assessmentResults);

    expect(result.modelUpdateTimestamp).toBeDefined();
    const timestamp = new Date(result.modelUpdateTimestamp);
    expect(timestamp.getFullYear()).toBeGreaterThanOrEqual(2024);
    expect(result.retrainingStatus).toBe('completed');
  });

  test('再学習完了日時が正常に記録される', () => {
    const assessmentResults = [
      {
        assessorId: 'A006',
        constructionType: '建築工事',
        amountBand: '1000万～5000万',
        quotationAmount: 2500,
        deviationRate: 2.5,
        deviationAmount: 62500,
        assessmentTime: 17,
        referenceDataCount: 5,
        judgmentLogicApplied: 'logic_v1',
        assessmentDate: new Date('2024-01-17T14:00:00Z'),
        isCorrect: true
      }
    ];

    const result = aggregateJudgmentAccuracyByAssessor(assessmentResults);

    expect(result.retrainingCompletedAt).toBeDefined();
    const completedAt = new Date(result.retrainingCompletedAt);
    expect(completedAt.getFullYear()).toBeGreaterThanOrEqual(2024);
    expect(result.retrainingStatus).toBe('completed');
  });

  test('参照データ件数の境界値が精度集計に反映される', () => {
    const assessmentResults = [
      {
        assessorId: 'A007',
        constructionType: '建築工事',
        amountBand: '1000万～5000万',
        quotationAmount: 2500,
        deviationRate: 1.5,
        deviationAmount: 37500,
        assessmentTime: 16,
        referenceDataCount: 1,
        judgmentLogicApplied: 'logic_v1',
        assessmentDate: new Date('2024-01-18T09:00:00Z'),
        isCorrect: true
      },
      {
        assessorId: 'A007',
        constructionType: '建築工事',
        amountBand: '1000万～5000万',
        quotationAmount: 3200,
        deviationRate: 2.0,
        deviationAmount: 64000,
        assessmentTime: 19,
        referenceDataCount: 10,
        judgmentLogicApplied: 'logic_v1',
        assessmentDate: new Date('2024-01-18T10:00:00Z'),
        isCorrect: true
      }
    ];

    const result = aggregateJudgmentAccuracyByAssessor(assessmentResults);

    const assessor_A007 = result.byAssessor.find(a => a.assessorId === 'A007');
    expect(assessor_A007!.assessmentCount).toBe(2);
    expect(assessor_A007!.accuracyRate).toBe(100);
    expect(assessor_A007!.averageDeviationRate).toBeCloseTo(1.75, 2);
  });
});