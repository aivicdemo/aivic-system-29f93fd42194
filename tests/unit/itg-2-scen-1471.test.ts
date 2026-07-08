import { detectSeasonalPriceDeviation } from '../../src/logic/it-6-2-2-2';

describe('seasonal price deviation detection by region/construction type/season', () => {
  test('SCEN-1471: detect seasonal price deviation with quantitative metrics across region-construction-season combinations', () => {
    // Input: Multiple regions, construction types, seasons with historical price data (3+ years)
    const regions = ['Hokkaido', 'Tokyo', 'Osaka', 'Fukuoka'];
    const constructionTypes = ['roof_work', 'exterior_painting', 'waterproofing_work'];
    const seasons = ['spring', 'summer', 'autumn', 'winter'];
    
    // Historical market data (past 3 years: 2021-2023)
    // Each entry: { region, constructionType, season, year, avgPrice, sampleCount }
    const historicalData = [
      // Hokkaido data
      { region: 'Hokkaido', constructionType: 'roof_work', season: 'spring', year: 2021, avgPrice: 980000, sampleCount: 45 },
      { region: 'Hokkaido', constructionType: 'roof_work', season: 'spring', year: 2022, avgPrice: 985000, sampleCount: 48 },
      { region: 'Hokkaido', constructionType: 'roof_work', season: 'spring', year: 2023, avgPrice: 990000, sampleCount: 52 },
      { region: 'Hokkaido', constructionType: 'roof_work', season: 'summer', year: 2021, avgPrice: 1050000, sampleCount: 42 },
      { region: 'Hokkaido', constructionType: 'roof_work', season: 'summer', year: 2022, avgPrice: 1055000, sampleCount: 45 },
      { region: 'Hokkaido', constructionType: 'roof_work', season: 'summer', year: 2023, avgPrice: 1060000, sampleCount: 48 },
      { region: 'Hokkaido', constructionType: 'roof_work', season: 'autumn', year: 2021, avgPrice: 1000000, sampleCount: 50 },
      { region: 'Hokkaido', constructionType: 'roof_work', season: 'autumn', year: 2022, avgPrice: 1005000, sampleCount: 52 },
      { region: 'Hokkaido', constructionType: 'roof_work', season: 'autumn', year: 2023, avgPrice: 1010000, sampleCount: 55 },
      { region: 'Hokkaido', constructionType: 'roof_work', season: 'winter', year: 2021, avgPrice: 920000, sampleCount: 35 },
      { region: 'Hokkaido', constructionType: 'roof_work', season: 'winter', year: 2022, avgPrice: 925000, sampleCount: 38 },
      { region: 'Hokkaido', constructionType: 'roof_work', season: 'winter', year: 2023, avgPrice: 930000, sampleCount: 40 },
      
      // Tokyo data
      { region: 'Tokyo', constructionType: 'roof_work', season: 'spring', year: 2021, avgPrice: 1100000, sampleCount: 60 },
      { region: 'Tokyo', constructionType: 'roof_work', season: 'spring', year: 2022, avgPrice: 1105000, sampleCount: 62 },
      { region: 'Tokyo', constructionType: 'roof_work', season: 'spring', year: 2023, avgPrice: 1110000, sampleCount: 65 },
      { region: 'Tokyo', constructionType: 'roof_work', season: 'summer', year: 2021, avgPrice: 1150000, sampleCount: 58 },
      { region: 'Tokyo', constructionType: 'roof_work', season: 'summer', year: 2022, avgPrice: 1155000, sampleCount: 60 },
      { region: 'Tokyo', constructionType: 'roof_work', season: 'summer', year: 2023, avgPrice: 1160000, sampleCount: 63 },
      { region: 'Tokyo', constructionType: 'roof_work', season: 'autumn', year: 2021, avgPrice: 1120000, sampleCount: 62 },
      { region: 'Tokyo', constructionType: 'roof_work', season: 'autumn', year: 2022, avgPrice: 1125000, sampleCount: 64 },
      { region: 'Tokyo', constructionType: 'roof_work', season: 'autumn', year: 2023, avgPrice: 1130000, sampleCount: 67 },
      { region: 'Tokyo', constructionType: 'roof_work', season: 'winter', year: 2021, avgPrice: 1050000, sampleCount: 45 },
      { region: 'Tokyo', constructionType: 'roof_work', season: 'winter', year: 2022, avgPrice: 1055000, sampleCount: 48 },
      { region: 'Tokyo', constructionType: 'roof_work', season: 'winter', year: 2023, avgPrice: 1060000, sampleCount: 50 },
      
      // Osaka data
      { region: 'Osaka', constructionType: 'exterior_painting', season: 'spring', year: 2021, avgPrice: 650000, sampleCount: 55 },
      { region: 'Osaka', constructionType: 'exterior_painting', season: 'spring', year: 2022, avgPrice: 655000, sampleCount: 57 },
      { region: 'Osaka', constructionType: 'exterior_painting', season: 'spring', year: 2023, avgPrice: 660000, sampleCount: 60 },
      { region: 'Osaka', constructionType: 'exterior_painting', season: 'summer', year: 2021, avgPrice: 700000, sampleCount: 50 },
      { region: 'Osaka', constructionType: 'exterior_painting', season: 'summer', year: 2022, avgPrice: 705000, sampleCount: 52 },
      { region: 'Osaka', constructionType: 'exterior_painting', season: 'summer', year: 2023, avgPrice: 710000, sampleCount: 55 },
      { region: 'Osaka', constructionType: 'exterior_painting', season: 'autumn', year: 2021, avgPrice: 680000, sampleCount: 58 },
      { region: 'Osaka', constructionType: 'exterior_painting', season: 'autumn', year: 2022, avgPrice: 685000, sampleCount: 60 },
      { region: 'Osaka', constructionType: 'exterior_painting', season: 'autumn', year: 2023, avgPrice: 690000, sampleCount: 63 },
      { region: 'Osaka', constructionType: 'exterior_painting', season: 'winter', year: 2021, avgPrice: 620000, sampleCount: 40 },
      { region: 'Osaka', constructionType: 'exterior_painting', season: 'winter', year: 2022, avgPrice: 625000, sampleCount: 42 },
      { region: 'Osaka', constructionType: 'exterior_painting', season: 'winter', year: 2023, avgPrice: 630000, sampleCount: 45 },
      
      // Fukuoka data
      { region: 'Fukuoka', constructionType: 'waterproofing_work', season: 'spring', year: 2021, avgPrice: 520000, sampleCount: 40 },
      { region: 'Fukuoka', constructionType: 'waterproofing_work', season: 'spring', year: 2022, avgPrice: 525000, sampleCount: 42 },
      { region: 'Fukuoka', constructionType: 'waterproofing_work', season: 'spring', year: 2023, avgPrice: 530000, sampleCount: 45 },
      { region: 'Fukuoka', constructionType: 'waterproofing_work', season: 'summer', year: 2021, avgPrice: 560000, sampleCount: 38 },
      { region: 'Fukuoka', constructionType: 'waterproofing_work', season: 'summer', year: 2022, avgPrice: 565000, sampleCount: 40 },
      { region: 'Fukuoka', constructionType: 'waterproofing_work', season: 'summer', year: 2023, avgPrice: 570000, sampleCount: 43 },
      { region: 'Fukuoka', constructionType: 'waterproofing_work', season: 'autumn', year: 2021, avgPrice: 540000, sampleCount: 42 },
      { region: 'Fukuoka', constructionType: 'waterproofing_work', season: 'autumn', year: 2022, avgPrice: 545000, sampleCount: 44 },
      { region: 'Fukuoka', constructionType: 'waterproofing_work', season: 'autumn', year: 2023, avgPrice: 550000, sampleCount: 47 },
      { region: 'Fukuoka', constructionType: 'waterproofing_work', season: 'winter', year: 2021, avgPrice: 490000, sampleCount: 35 },
      { region: 'Fukuoka', constructionType: 'waterproofing_work', season: 'winter', year: 2022, avgPrice: 495000, sampleCount: 37 },
      { region: 'Fukuoka', constructionType: 'waterproofing_work', season: 'winter', year: 2023, avgPrice: 500000, sampleCount: 40 },
    ];

    // Current estimate prices for comparison
    const currentEstimates = [
      { region: 'Hokkaido', constructionType: 'roof_work', season: 'spring', estimatedPrice: 995000 },
      { region: 'Hokkaido', constructionType: 'roof_work', season: 'summer', estimatedPrice: 1065000 },
      { region: 'Tokyo', constructionType: 'roof_work', season: 'spring', estimatedPrice: 1115000 },
      { region: 'Osaka', constructionType: 'exterior_painting', season: 'summer', estimatedPrice: 715000 },
      { region: 'Fukuoka', constructionType: 'waterproofing_work', season: 'winter', estimatedPrice: 505000 },
    ];

    // Execute detection function
    const result = detectSeasonalPriceDeviation({
      historicalData,
      currentEstimates,
      regions,
      constructionTypes,
      seasons,
    });

    // Verify structure
    expect(result).toHaveProperty('patterns');
    expect(result).toHaveProperty('statistics');
    expect(result).toHaveProperty('extremes');

    // Verify patterns array
    expect(Array.isArray(result.patterns)).toBe(true);
    expect(result.patterns.length).toBeGreaterThan(0);

    // Validate pattern structure for each combination
    result.patterns.forEach((pattern) => {
      expect(pattern).toHaveProperty('region');
      expect(pattern).toHaveProperty('constructionType');
      expect(pattern).toHaveProperty('season');
      expect(pattern).toHaveProperty('deviationRate');
      expect(pattern).toHaveProperty('deviationAmount');
      expect(pattern).toHaveProperty('pValue');
      expect(pattern).toHaveProperty('classification');
      expect(pattern).toHaveProperty('baselinePrice');
      expect(pattern).toHaveProperty('sampleCount');

      // Type validation
      expect(typeof pattern.region).toBe('string');
      expect(typeof pattern.constructionType).toBe('string');
      expect(typeof pattern.season).toBe('string');
      expect(typeof pattern.deviationRate).toBe('number');
      expect(typeof pattern.deviationAmount).toBe('number');
      expect(typeof pattern.pValue).toBe('number');
      expect(typeof pattern.classification).toBe('string');
      expect(typeof pattern.baselinePrice).toBe('number');
      expect(typeof pattern.sampleCount).toBe('number');

      // Value range validation
      expect(pattern.deviationRate).toBeGreaterThanOrEqual(-100);
      expect(pattern.deviationRate).toBeLessThanOrEqual(100);
      expect(pattern.pValue).toBeGreaterThanOrEqual(0);
      expect(pattern.pValue).toBeLessThanOrEqual(1);
      expect(['normal', 'moderate', 'significant', 'extreme']).toContain(pattern.classification);
    });

    // Verify Hokkaido roof_work spring pattern (baseline: 988333, estimated: 995000)
    const hokkaido_spring = result.patterns.find(
      (p) => p.region === 'Hokkaido' && p.constructionType === 'roof_work' && p.season === 'spring'
    );
    expect(hokkaido_spring).toBeDefined();
    expect(hokkaido_spring!.baselinePrice).toBeCloseTo(988333, 0);
    expect(hokkaido_spring!.deviationAmount).toBeCloseTo(6667, 0);
    expect(hokkaido_spring!.deviationRate).toBeCloseTo(0.6748, 2);

    // Verify Hokkaido roof_work summer pattern (baseline: 1055000, estimated: 1065000)
    const hokkaido_summer = result.patterns.find(
      (p) => p.region === 'Hokkaido' && p.constructionType === 'roof_work' && p.season === 'summer'
    );
    expect(hokkaido_summer).toBeDefined();
    expect(hokkaido_summer!.baselinePrice).toBeCloseTo(1055000, 0);
    expect(hokkaido_summer!.deviationAmount).toBeCloseTo(10000, 0);
    expect(hokkaido_summer!.deviationRate).toBeCloseTo(0.9479, 2);

    // Verify Tokyo roof_work spring pattern (baseline: 1105000, estimated: 1115000)
    const tokyo_spring = result.patterns.find(
      (p) => p.region === 'Tokyo' && p.constructionType === 'roof_work' && p.season === 'spring'
    );
    expect(tokyo_spring).toBeDefined();
    expect(tokyo_spring!.baselinePrice).toBeCloseTo(1105000, 0);
    expect(tokyo_spring!.deviationAmount).toBeCloseTo(10000, 0);
    expect(tokyo_spring!.deviationRate).toBeCloseTo(0.9050, 2);

    // Verify Osaka exterior_painting summer pattern (baseline: 705000, estimated: 715000)
    const osaka_summer = result.patterns.find(
      (p) => p.region === 'Osaka' && p.constructionType === 'exterior_painting' && p.season === 'summer'
    );
    expect(osaka_summer).toBeDefined();
    expect(osaka_summer!.baselinePrice).toBeCloseTo(705000, 0);
    expect(osaka_summer!.deviationAmount).toBeCloseTo(10000, 0);
    expect(osaka_summer!.deviationRate).toBeCloseTo(1.4184, 2);

    // Verify Fukuoka waterproofing_work winter pattern (baseline: 495000, estimated: 505000)
    const fukuoka_winter = result.patterns.find(
      (p) => p.region === 'Fukuoka' && p.constructionType === 'waterproofing_work' && p.season === 'winter'
    );
    expect(fukuoka_winter).toBeDefined();
    expect(fukuoka_winter!.baselinePrice).toBeCloseTo(495000, 0);
    expect(fukuoka_winter!.deviationAmount).toBeCloseTo(10000, 0);
    expect(fukuoka_winter!.deviationRate).toBeCloseTo(2.0202, 2);

    // Verify statistics
    expect(result.statistics).toHaveProperty('meanDeviation');
    expect(result.statistics).toHaveProperty('stdDeviation');
    expect(result.statistics).toHaveProperty('minDeviation');
    expect(result.statistics).toHaveProperty('maxDeviation');
    expect(result.statistics).toHaveProperty('totalCombinations');

    expect(typeof result.statistics.meanDeviation).toBe('number');
    expect(typeof result.statistics.stdDeviation).toBe('number');
    expect(typeof result.statistics.minDeviation).toBe('number');
    expect(typeof result.statistics.maxDeviation).toBe('number');
    expect(typeof result.statistics.totalCombinations).toBe('number');

    expect(result.statistics.minDeviation).toBeLessThanOrEqual(result.statistics.maxDeviation);
    expect(result.statistics.totalCombinations).toBeGreaterThan(0);

    // Verify extremes (max and min deviation)
    expect(result.extremes).toHaveProperty('maxDeviation');
    expect(result.extremes).toHaveProperty('minDeviation');

    expect(result.extremes.maxDeviation).toHaveProperty('region');
    expect(result.extremes.maxDeviation).toHaveProperty('constructionType');
    expect(result.extremes.maxDeviation).toHaveProperty('season');
    expect(result.extremes.maxDeviation).toHaveProperty('deviationRate');

    expect(result.extremes.minDeviation).toHaveProperty('region');
    expect(result.extremes.minDeviation).toHaveProperty('constructionType');
    expect(result.extremes.minDeviation).toHaveProperty('season');
    expect(result.extremes.minDeviation).toHaveProperty('deviationRate');

    // Verify extremes match patterns
    const max_pattern = result.patterns.reduce((prev, curr) =>
      Math.abs(curr.deviationRate) > Math.abs(prev.deviationRate) ? curr : prev
    );
    expect(result.extremes.maxDeviation.deviationRate).toBe(max_pattern.deviationRate);

    const min_pattern = result.patterns.reduce((prev, curr) =>
      Math.abs(curr.deviationRate) < Math.abs(prev.deviationRate) ? curr : prev
    );
    expect(result.extremes.minDeviation.deviationRate).toBe(min_pattern.deviationRate);

    // Verify seasonal variation is reasonable
    // For each region-construction type, summer should be higher than winter
    const hokkaido_roof_summer_deviation = hokkaido_summer!.deviationRate;
    const hokkaido_roof_winter_deviation = result.patterns.find(
      (p) => p.region === 'Hokkaido' && p.constructionType === 'roof_work' && p.season === 'winter'
    )!.deviationRate;
    expect(hokkaido_roof_summer_deviation).toBeGreaterThan(hokkaido_roof_winter_deviation);

    // Verify p-values indicate statistical significance for high deviations
    const significant_patterns = result.patterns.filter((p) => Math.abs(p.deviationRate) > 1.5);
    significant_patterns.forEach((pattern) => {
      expect(pattern.pValue).toBeLessThan(0.05);
    });

    // Verify total combinations count
    const expected_combinations = currentEstimates.length;
    expect(result.patterns.length).toBeLessThanOrEqual(expected_combinations);
  });
});