import { calculatePriceAdjustmentCoefficient } from '../../src/logic/it-1-br-6-2-1';

describe('物価変動補正係数計算', () => {
  test('SCEN-913: [edge] 基準時点と査定時点が同一の場合に補正係数1.0を返す', () => {
    const referenceDate = '2024-01-15';
    const assessmentDate = '2024-01-15';

    const result = calculatePriceAdjustmentCoefficient({
      referenceDate,
      assessmentDate,
    });

    expect(result).toBe(1.0);
  });
});