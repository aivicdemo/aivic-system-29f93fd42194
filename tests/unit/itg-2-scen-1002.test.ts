import { evaluateDeviationBasis } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1002
  test('相場乖離根拠データの総合判定 - 根拠データの信頼性・ロジック妥当性・地域時期補正が全て適切な場合、最終判定OKが返される', () => {
    const input = {
      reliabilityScore: 0.85,
      logicValidityScore: 0.80,
      regionTimeCorrectionFactor: 1.05,
      referenceDataCount: 45,
      deviationRate: 8.5,
      deviationAmount: 125000,
      appliedCorrectionCoefficient: 1.02,
    };

    const result = evaluateDeviationBasis(input);

    expect(result.finalJudgment).toBe('OK');
    expect(result.statusCode).toBe(200);
    expect(result.reliabilityScore).toBe(0.85);
    expect(result.logicValidityScore).toBe(0.80);
    expect(result.regionTimeCorrectionFactor).toBe(1.05);
    expect(result.referenceDataCount).toBe(45);
    expect(result.deviationRate).toBe(8.5);
    expect(result.deviationAmount).toBe(125000);
    expect(result.appliedCorrectionCoefficient).toBe(1.02);
    expect(result.judgmentDetails).toBeDefined();
    expect(typeof result.judgmentDetails).toBe('object');
  });
});