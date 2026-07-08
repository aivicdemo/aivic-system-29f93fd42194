import { calculatePriceAdjustmentCoefficient } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-910: [normal] 物価変動補正係数計算 - 基準時点から査定時点までの物価変動を反映した補正係数を計算する
  test('should calculate price adjustment coefficient based on price index change from reference date to assessment date', () => {
    const referenceDatetime = new Date('2023-01-01T00:00:00Z');
    const assessmentDatetime = new Date('2024-01-01T00:00:00Z');
    const priceIndexCategory = 'construction_material';
    const referencePriceIndex = 100.0;
    const assessmentPriceIndex = 105.5;

    const result = calculatePriceAdjustmentCoefficient({
      referenceDatetime,
      assessmentDatetime,
      priceIndexCategory,
      referencePriceIndex,
      assessmentPriceIndex,
    });

    expect(result).toEqual({
      adjustmentCoefficient: 1.055,
      priceIndexChangeRate: 5.5,
      referencePriceIndexValue: 100.0,
      assessmentPriceIndexValue: 105.5,
      referenceDate: '2023-01-01',
      assessmentDate: '2024-01-01',
      priceCategory: 'construction_material',
      calculationBasis: 'assessment_price_index / reference_price_index',
    });

    expect(result.adjustmentCoefficient).toBe(1.055);
    expect(result.priceIndexChangeRate).toBe(5.5);
    expect(result.calculationBasis).toBe('assessment_price_index / reference_price_index');
  });

  test('should handle zero reference price index and throw error', () => {
    const referenceDatetime = new Date('2023-01-01T00:00:00Z');
    const assessmentDatetime = new Date('2024-01-01T00:00:00Z');
    const priceIndexCategory = 'construction_material';
    const referencePriceIndex = 0.0;
    const assessmentPriceIndex = 105.5;

    expect(() =>
      calculatePriceAdjustmentCoefficient({
        referenceDatetime,
        assessmentDatetime,
        priceIndexCategory,
        referencePriceIndex,
        assessmentPriceIndex,
      })
    ).toThrow(/物価指数/);
  });

  test('should handle negative price index values and throw error', () => {
    const referenceDatetime = new Date('2023-01-01T00:00:00Z');
    const assessmentDatetime = new Date('2024-01-01T00:00:00Z');
    const priceIndexCategory = 'construction_material';
    const referencePriceIndex = 100.0;
    const assessmentPriceIndex = -50.0;

    expect(() =>
      calculatePriceAdjustmentCoefficient({
        referenceDatetime,
        assessmentDatetime,
        priceIndexCategory,
        referencePriceIndex,
        assessmentPriceIndex,
      })
    ).toThrow(/物価指数/);
  });

  test('should handle assessment date before reference date and throw error', () => {
    const referenceDatetime = new Date('2024-01-01T00:00:00Z');
    const assessmentDatetime = new Date('2023-01-01T00:00:00Z');
    const priceIndexCategory = 'construction_material';
    const referencePriceIndex = 100.0;
    const assessmentPriceIndex = 105.5;

    expect(() =>
      calculatePriceAdjustmentCoefficient({
        referenceDatetime,
        assessmentDatetime,
        priceIndexCategory,
        referencePriceIndex,
        assessmentPriceIndex,
      })
    ).toThrow(/日付/);
  });

  test('should calculate coefficient with price decrease scenario', () => {
    const referenceDatetime = new Date('2023-06-01T00:00:00Z');
    const assessmentDatetime = new Date('2024-06-01T00:00:00Z');
    const priceIndexCategory = 'labor_cost';
    const referencePriceIndex = 120.0;
    const assessmentPriceIndex = 114.0;

    const result = calculatePriceAdjustmentCoefficient({
      referenceDatetime,
      assessmentDatetime,
      priceIndexCategory,
      referencePriceIndex,
      assessmentPriceIndex,
    });

    expect(result.adjustmentCoefficient).toBe(0.95);
    expect(result.priceIndexChangeRate).toBe(-5.0);
    expect(result.calculationBasis).toBe('assessment_price_index / reference_price_index');
  });

  test('should calculate coefficient with identical price indices', () => {
    const referenceDatetime = new Date('2023-01-01T00:00:00Z');
    const assessmentDatetime = new Date('2024-01-01T00:00:00Z');
    const priceIndexCategory = 'equipment_rental';
    const referencePriceIndex = 100.0;
    const assessmentPriceIndex = 100.0;

    const result = calculatePriceAdjustmentCoefficient({
      referenceDatetime,
      assessmentDatetime,
      priceIndexCategory,
      referencePriceIndex,
      assessmentPriceIndex,
    });

    expect(result.adjustmentCoefficient).toBe(1.0);
    expect(result.priceIndexChangeRate).toBe(0.0);
  });

  test('should calculate coefficient with decimal precision', () => {
    const referenceDatetime = new Date('2023-01-01T00:00:00Z');
    const assessmentDatetime = new Date('2024-01-01T00:00:00Z');
    const priceIndexCategory = 'construction_material';
    const referencePriceIndex = 99.75;
    const assessmentPriceIndex = 102.33;

    const result = calculatePriceAdjustmentCoefficient({
      referenceDatetime,
      assessmentDatetime,
      priceIndexCategory,
      referencePriceIndex,
      assessmentPriceIndex,
    });

    expect(result.adjustmentCoefficient).toBeCloseTo(1.0258, 4);
    expect(result.priceIndexChangeRate).toBeCloseTo(2.58, 2);
  });

  test('should handle same reference and assessment date and throw error', () => {
    const referenceDatetime = new Date('2023-01-01T00:00:00Z');
    const assessmentDatetime = new Date('2023-01-01T00:00:00Z');
    const priceIndexCategory = 'construction_material';
    const referencePriceIndex = 100.0;
    const assessmentPriceIndex = 105.5;

    expect(() =>
      calculatePriceAdjustmentCoefficient({
        referenceDatetime,
        assessmentDatetime,
        priceIndexCategory,
        referencePriceIndex,
        assessmentPriceIndex,
      })
    ).toThrow(/日付/);
  });

  test('should validate price index category', () => {
    const referenceDatetime = new Date('2023-01-01T00:00:00Z');
    const assessmentDatetime = new Date('2024-01-01T00:00:00Z');
    const priceIndexCategory = 'invalid_category';
    const referencePriceIndex = 100.0;
    const assessmentPriceIndex = 105.5;

    expect(() =>
      calculatePriceAdjustmentCoefficient({
        referenceDatetime,
        assessmentDatetime,
        priceIndexCategory,
        referencePriceIndex,
        assessmentPriceIndex,
      })
    ).toThrow(/カテゴリ/);
  });
});