import { validateEstimateJudgmentCriteria } from '../../src/logic/it-6-2-2-1';

describe('基準の完全性・一貫性・互換性自動検証', () => {
  // SCEN-896
  test('定義済み基準がすべての必須フィールドを含み登録可能と判定される', () => {
    const inputCriteria = {
      criteriaName: '鉄筋コンクリート工事_東京_通常期',
      category: 'construction_type',
      description: '東京地域における鉄筋コンクリート工事の相場判定基準',
      judgmentLogic: {
        priceRangeMin: 5000000,
        priceRangeMax: 15000000,
        allowableDeviationLowerPercent: -10,
        allowableDeviationUpperPercent: 15,
      },
      applicableRegions: ['Tokyo', 'Kanagawa'],
      applicableConstructionTypes: ['RC_structure'],
      applicableSeasons: ['normal_period'],
      referenceDataMinCount: 25,
      referenceDataCoverageRate: 85,
      createdBy: 'user_001',
      createdAt: '2024-01-15T09:00:00Z',
      version: 1,
      isActive: true,
    };

    const validationResult = validateEstimateJudgmentCriteria(inputCriteria);

    expect(validationResult.isValid).toBe(true);
    expect(validationResult.registrationAllowed).toBe(true);
    expect(validationResult.completenessScore).toBe(100);
    expect(validationResult.consistencyStatus).toBe('consistent');
    expect(validationResult.compatibilityStatus).toBe('compatible');
    expect(validationResult.missingFields).toEqual([]);
    expect(validationResult.inconsistencies).toEqual([]);
    expect(validationResult.incompatibilities).toEqual([]);
    expect(validationResult.message).toBe('基準は登録可能です');
    expect(validationResult.registrationStatus).toBe('ready_to_register');
  });
});