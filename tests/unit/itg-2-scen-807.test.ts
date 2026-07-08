import { calculateDeviationPattern } from '../../src/logic/it-1-br-6-2-1';

describe('相場乖離パターン自動分類機能', () => {
  // SCEN-807
  test('見積項目が標準相場範囲内の場合、パターンが『標準』と分類される', () => {
    const standardMarketPrice = 100000;
    const toleranceRate = 0.1;
    const lowerBound = standardMarketPrice * (1 - toleranceRate);
    const upperBound = standardMarketPrice * (1 + toleranceRate);

    const estimateAmount = 105000;

    const result = calculateDeviationPattern({
      estimateAmount,
      standardMarketPrice,
      lowerBound,
      upperBound,
    });

    expect(result.pattern).toBe('標準');
    expect(result.deviationRate).toBe(0.05);
    expect(result.deviationAmount).toBe(5000);
    expect(result.withinTolerance).toBe(true);
  });
});