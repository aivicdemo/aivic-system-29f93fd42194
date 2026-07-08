import { calculateScalingCoefficient } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1310: [normal] スケーリング係数と補正係数の自動計算 - 初期30名での実績から700名規模への人員スケーリング係数が23.3倍で正確に算出される
  test('初期30名実績から700名規模へのスケーリング係数を自動計算し23.3倍で正確に算出される', () => {
    const initialHeadcount = 30;
    const targetHeadcount = 700;
    const initialAssessmentTime = 45;
    const initialAccuracyRate = 0.94;
    const initialQualityUniformityIndex = 0.87;
    const initialSystemUptimeRate = 0.996;
    const proficiencyAdjustmentFactor = 0.92;
    const dataQualityAdjustmentFactor = 0.88;

    const result = calculateScalingCoefficient({
      initialHeadcount,
      targetHeadcount,
      initialAssessmentTime,
      initialAccuracyRate,
      initialQualityUniformityIndex,
      initialSystemUptimeRate,
      proficiencyAdjustmentFactor,
      dataQualityAdjustmentFactor,
    });

    const expectedBaseScalingCoefficient = targetHeadcount / initialHeadcount;
    expect(result.baseScalingCoefficient).toBeCloseTo(23.333, 2);
    expect(result.baseScalingCoefficient).toBe(expectedBaseScalingCoefficient);

    const expectedAdjustedScalingCoefficient =
      expectedBaseScalingCoefficient *
      proficiencyAdjustmentFactor *
      dataQualityAdjustmentFactor;
    expect(result.adjustedScalingCoefficient).toBeCloseTo(
      expectedAdjustedScalingCoefficient,
      4
    );

    const expectedScaledAssessmentTime =
      initialAssessmentTime * result.adjustedScalingCoefficient;
    expect(result.scaledAssessmentTime).toBeCloseTo(
      expectedScaledAssessmentTime,
      2
    );

    const expectedScaledAccuracyRate =
      initialAccuracyRate * dataQualityAdjustmentFactor;
    expect(result.scaledAccuracyRate).toBeCloseTo(
      expectedScaledAccuracyRate,
      4
    );

    const expectedScaledQualityUniformityIndex =
      initialQualityUniformityIndex * proficiencyAdjustmentFactor;
    expect(result.scaledQualityUniformityIndex).toBeCloseTo(
      expectedScaledQualityUniformityIndex,
      4
    );

    const expectedScaledSystemUptimeRate =
      initialSystemUptimeRate * 0.998;
    expect(result.scaledSystemUptimeRate).toBeCloseTo(
      expectedScaledSystemUptimeRate,
      4
    );

    expect(result.scalingCoefficientApplied).toBe(true);
    expect(result.correctionCoefficientsApplied).toBe(true);

    expect(result.baseScalingCoefficient).toBeGreaterThan(0);
    expect(result.adjustedScalingCoefficient).toBeGreaterThan(0);
    expect(result.adjustedScalingCoefficient).toBeLessThan(
      result.baseScalingCoefficient
    );
    expect(result.scaledAssessmentTime).toBeGreaterThan(0);
    expect(result.scaledAccuracyRate).toBeGreaterThan(0);
    expect(result.scaledAccuracyRate).toBeLessThan(1);
    expect(result.scaledQualityUniformityIndex).toBeGreaterThan(0);
    expect(result.scaledQualityUniformityIndex).toBeLessThan(1);
    expect(result.scaledSystemUptimeRate).toBeGreaterThan(0);
    expect(result.scaledSystemUptimeRate).toBeLessThan(1);
  });
});