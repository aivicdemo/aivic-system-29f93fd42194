import { calculateAssessorAccuracyMetrics } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1281: [error] 査定員別判定精度指標自動計測機能 - 相場乖離データが存在しない場合、相場乖離率の計測がエラーとなる
  test('相場乖離データが存在しない場合、相場乖離率の計測処理がエラーとなり、適切なエラーメッセージが返される', () => {
    const assessorId = 'ASSESSOR_001';
    const constructionType = '土木工事';
    const amountBand = '1000万～5000万円';
    const assessmentResults = [
      {
        assessmentResultId: 'RESULT_001',
        assessorId: assessorId,
        estimateId: 'EST_001',
        constructionType: constructionType,
        amountBand: amountBand,
        marketDeviationRate: 5.2,
        marketDeviationAmount: 520000,
        assessmentTime: 25,
        judgmentResult: '承認',
        assessmentDate: '2024-01-15',
      },
      {
        assessmentResultId: 'RESULT_002',
        assessorId: assessorId,
        estimateId: 'EST_002',
        constructionType: constructionType,
        amountBand: amountBand,
        marketDeviationRate: null,
        marketDeviationAmount: null,
        assessmentTime: 22,
        judgmentResult: '承認',
        assessmentDate: '2024-01-16',
      },
    ];

    const params = {
      assessorId: assessorId,
      constructionType: constructionType,
      amountBand: amountBand,
      assessmentResults: assessmentResults,
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
    };

    expect(() => calculateAssessorAccuracyMetrics(params)).toThrow(/相場乖離データ/);
  });
});