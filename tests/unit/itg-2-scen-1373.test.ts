import { analyzePrecisionDropCauses } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1373
  test('精度低下原因特定・カスタマイズ範囲決定機能 - OCR読取精度・相場判定精度の低下度から学習データ不足・フォーマット差異・地域別偏りの原因を特定しカスタマイズ範囲を決定する', () => {
    const input_ocrPrecisionDropRate = 8;
    const input_judgmentPrecisionDropRate = 12;
    const input_referenceSampleCountByRegion = {
      hokkaido: 45,
      tohoku: 38,
      kanto: 210,
      chubu: 92,
      kansai: 156,
      chugoku: 28,
      shikoku: 15,
      kyushu: 67,
    };
    const input_totalSampleCount = 651;
    const input_formatVarianceDetectedCount = 23;
    const input_totalProcessedEstimateCount = 450;

    const result = analyzePrecisionDropCauses({
      ocrPrecisionDropRate: input_ocrPrecisionDropRate,
      judgmentPrecisionDropRate: input_judgmentPrecisionDropRate,
      referenceSampleCountByRegion: input_referenceSampleCountByRegion,
      totalSampleCount: input_totalSampleCount,
      formatVarianceDetectedCount: input_formatVarianceDetectedCount,
      totalProcessedEstimateCount: input_totalProcessedEstimateCount,
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty('causes');
    expect(Array.isArray(result.causes)).toBe(true);
    expect(result.causes.length).toBeGreaterThan(0);

    const learningDataDeficiencyCause = result.causes.find(
      (c: any) => c.causeType === 'learning_data_deficiency'
    );
    expect(learningDataDeficiencyCause).toBeDefined();
    expect(learningDataDeficiencyCause.detected).toBe(true);
    expect(learningDataDeficiencyCause.contributionDegree).toBeGreaterThan(0);
    expect(learningDataDeficiencyCause.contributionDegree).toBeLessThanOrEqual(100);

    const formatVarianceCause = result.causes.find(
      (c: any) => c.causeType === 'format_variance'
    );
    expect(formatVarianceCause).toBeDefined();
    expect(formatVarianceCause.detected).toBe(true);
    expect(formatVarianceCause.varianceRatio).toBe(
      Number((input_formatVarianceDetectedCount / input_totalProcessedEstimateCount * 100).toFixed(2))
    );

    const regionBiasCause = result.causes.find(
      (c: any) => c.causeType === 'region_bias'
    );
    expect(regionBiasCause).toBeDefined();
    expect(regionBiasCause.detected).toBe(true);
    expect(regionBiasCause.underrepresentedRegions).toBeDefined();
    expect(Array.isArray(regionBiasCause.underrepresentedRegions)).toBe(true);
    expect(regionBiasCause.underrepresentedRegions.length).toBeGreaterThan(0);

    const underrepresentedShikoku = regionBiasCause.underrepresentedRegions.find(
      (r: any) => r.regionCode === 'shikoku'
    );
    expect(underrepresentedShikoku).toBeDefined();
    expect(underrepresentedShikoku.sampleCount).toBe(15);
    expect(underrepresentedShikoku.coverageRatio).toBe(
      Number((15 / 651 * 100).toFixed(2))
    );

    expect(result).toHaveProperty('customizationRecommendations');
    expect(Array.isArray(result.customizationRecommendations)).toBe(true);
    expect(result.customizationRecommendations.length).toBeGreaterThan(0);

    const dataAdditionRecommendation = result.customizationRecommendations.find(
      (r: any) => r.recommendationType === 'add_learning_data'
    );
    expect(dataAdditionRecommendation).toBeDefined();
    expect(dataAdditionRecommendation.priority).toBe('high');
    expect(dataAdditionRecommendation.targetDataCount).toBeGreaterThan(0);
    expect(dataAdditionRecommendation.estimatedImplementationDays).toBeGreaterThan(0);

    const formatAdjustmentRecommendation = result.customizationRecommendations.find(
      (r: any) => r.recommendationType === 'adjust_ocr_model'
    );
    expect(formatAdjustmentRecommendation).toBeDefined();
    expect(formatAdjustmentRecommendation.priority).toBe('high');
    expect(formatAdjustmentRecommendation.affectedEstimateCount).toBe(23);

    const regionCoverageRecommendation = result.customizationRecommendations.find(
      (r: any) => r.recommendationType === 'expand_regional_data'
    );
    expect(regionCoverageRecommendation).toBeDefined();
    expect(regionCoverageRecommendation.priority).toBe('medium');
    expect(regionCoverageRecommendation.targetRegions).toBeDefined();
    expect(Array.isArray(regionCoverageRecommendation.targetRegions)).toBe(true);
    expect(regionCoverageRecommendation.targetRegions.includes('shikoku')).toBe(true);
    expect(regionCoverageRecommendation.targetRegions.includes('chugoku')).toBe(true);

    expect(result).toHaveProperty('summaryReport');
    expect(result.summaryReport).toHaveProperty('totalCausesDetected');
    expect(result.summaryReport.totalCausesDetected).toBe(3);
    expect(result.summaryReport).toHaveProperty('recommendedActionsCount');
    expect(result.summaryReport.recommendedActionsCount).toBe(3);
    expect(result.summaryReport).toHaveProperty('estimatedTotalImplementationDays');
    expect(result.summaryReport.estimatedTotalImplementationDays).toBeGreaterThan(0);
    expect(result.summaryReport).toHaveProperty('expectedPrecisionImprovement');
    expect(result.summaryReport.expectedPrecisionImprovement).toBeGreaterThan(0);
    expect(result.summaryReport.expectedPrecisionImprovement).toBeLessThanOrEqual(100);

    expect(() =>
      analyzePrecisionDropCauses({
        ocrPrecisionDropRate: -5,
        judgmentPrecisionDropRate: 10,
        referenceSampleCountByRegion: input_referenceSampleCountByRegion,
        totalSampleCount: input_totalSampleCount,
        formatVarianceDetectedCount: input_formatVarianceDetectedCount,
        totalProcessedEstimateCount: input_totalProcessedEstimateCount,
      })
    ).toThrow(/OCR読取精度/);

    expect(() =>
      analyzePrecisionDropCauses({
        ocrPrecisionDropRate: 8,
        judgmentPrecisionDropRate: -5,
        referenceSampleCountByRegion: input_referenceSampleCountByRegion,
        totalSampleCount: input_totalSampleCount,
        formatVarianceDetectedCount: input_formatVarianceDetectedCount,
        totalProcessedEstimateCount: input_totalProcessedEstimateCount,
      })
    ).toThrow(/判定精度/);

    expect(() =>
      analyzePrecisionDropCauses({
        ocrPrecisionDropRate: 8,
        judgmentPrecisionDropRate: 10,
        referenceSampleCountByRegion: {},
        totalSampleCount: 0,
        formatVarianceDetectedCount: 5,
        totalProcessedEstimateCount: 100,
      })
    ).toThrow(/サンプル/);

    expect(() =>
      analyzePrecisionDropCauses({
        ocrPrecisionDropRate: 8,
        judgmentPrecisionDropRate: 10,
        referenceSampleCountByRegion: input_referenceSampleCountByRegion,
        totalSampleCount: input_totalSampleCount,
        formatVarianceDetectedCount: 500,
        totalProcessedEstimateCount: input_totalProcessedEstimateCount,
      })
    ).toThrow(/フォーマット/);
  });
});