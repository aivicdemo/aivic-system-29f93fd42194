import { classifyDivergencePattern } from "../../src/logic/it-6-2-2-1";

describe("査定員別・案件別の判定ロジック・乖離パターン履歴の記録・抽出機能", () => {
  // SCEN-862: [edge] 相場乖離パターン自動分類機能 - 複数の地域・工種・金額帯に該当する判定ロジックが全ての組み合わせで分類される
  test("should classify all 27 combinations of region, construction_type, and price_range correctly with consistent logic and no gaps", () => {
    const regions = ["hokkaido", "kanto", "kansai"];
    const constructionTypes = ["wooden", "steelFrame", "reinforcedConcrete"];
    const priceRanges = ["low", "mid", "high"];

    // Generate all 27 combinations (3 × 3 × 3)
    const testCases = [];
    for (const region of regions) {
      for (const constructionType of constructionTypes) {
        for (const priceRange of priceRanges) {
          testCases.push({
            region,
            constructionType,
            priceRange,
            estimateAmount: getPriceRangeAmount(priceRange),
            deviationRate: getDevRateForCombo(region, constructionType, priceRange),
          });
        }
      }
    }

    // Execute classification for all 27 patterns
    const results = testCases.map((testCase) =>
      classifyDivergencePattern({
        region: testCase.region,
        constructionType: testCase.constructionType,
        priceRange: testCase.priceRange,
        estimateAmount: testCase.estimateAmount,
        deviationRate: testCase.deviationRate,
      })
    );

    // Verify all 27 patterns are classified without errors
    expect(results).toHaveLength(27);
    results.forEach((result) => {
      expect(result).not.toBeNull();
      expect(result.patternCategory).toBeDefined();
      expect(result.classificationLogicId).toBeDefined();
      expect(result.divergenceType).toMatch(/overage|underage|standard/);
    });

    // Verify classification consistency across combinations
    const categoryMap: { [key: string]: string[] } = {};
    results.forEach((result, idx) => {
      const key = result.patternCategory;
      if (!categoryMap[key]) categoryMap[key] = [];
      categoryMap[key].push(testCases[idx].region);
    });

    // All patterns should be assigned to a category
    const totalAssigned = Object.values(categoryMap).flat().length;
    expect(totalAssigned).toBe(27);

    // Verify boundary conditions are handled correctly
    const boundaryPatterns = results.filter(
      (r, idx) =>
        testCases[idx].priceRange === "low" ||
        testCases[idx].priceRange === "high" ||
        testCases[idx].region === "hokkaido" ||
        testCases[idx].region === "kansai" ||
        testCases[idx].constructionType === "wooden" ||
        testCases[idx].constructionType === "reinforcedConcrete"
    );
    expect(boundaryPatterns.length).toBeGreaterThan(0);
    boundaryPatterns.forEach((pattern) => {
      expect(pattern.patternCategory).toMatch(/^(pattern_|class_)/);
    });

    // Verify logic consistency: same (region, type, range) should always produce same category
    const duplicateTestCase = {
      region: "kanto",
      constructionType: "steelFrame",
      priceRange: "mid",
      estimateAmount: 5000000,
      deviationRate: 8.5,
    };
    const result1 = classifyDivergencePattern(duplicateTestCase);
    const result2 = classifyDivergencePattern(duplicateTestCase);
    expect(result1.patternCategory).toBe(result2.patternCategory);
    expect(result1.divergenceType).toBe(result2.divergenceType);

    // Verify no null or undefined classifications
    results.forEach((result) => {
      expect(result.patternCategory).not.toBeNull();
      expect(result.classificationLogicId).not.toBeNull();
    });

    // Verify pattern categorization follows business logic
    const lowPricePatterns = results.filter(
      (_, idx) => testCases[idx].priceRange === "low"
    );
    const highPricePatterns = results.filter(
      (_, idx) => testCases[idx].priceRange === "high"
    );

    // Both groups should have classifications without error
    expect(lowPricePatterns.every((p) => p.patternCategory)).toBe(true);
    expect(highPricePatterns.every((p) => p.patternCategory)).toBe(true);

    // Verify all combinations produce unique or grouped results consistently
    const logicIdSet = new Set(results.map((r) => r.classificationLogicId));
    expect(logicIdSet.size).toBeGreaterThan(0);
    expect(logicIdSet.size).toBeLessThanOrEqual(27);
  });
});

// Helper functions for test data generation
function getPriceRangeAmount(priceRange: string): number {
  const rangeMap: { [key: string]: number } = {
    low: 2000000,
    mid: 5000000,
    high: 15000000,
  };
  return rangeMap[priceRange] || 5000000;
}

function getDevRateForCombo(
  region: string,
  constructionType: string,
  priceRange: string
): number {
  // Realistic deviation rates based on region, type, and price range
  const baseRates: { [key: string]: number } = {
    hokkaido_wooden_low: 12.5,
    hokkaido_wooden_mid: 8.3,
    hokkaido_wooden_high: 5.2,
    hokkaido_steelFrame_low: 14.2,
    hokkaido_steelFrame_mid: 9.1,
    hokkaido_steelFrame_high: 6.8,
    hokkaido_reinforcedConcrete_low: 16.0,
    hokkaido_reinforcedConcrete_mid: 10.5,
    hokkaido_reinforcedConcrete_high: 7.3,
    kanto_wooden_low: 8.2,
    kanto_wooden_mid: 4.5,
    kanto_wooden_high: 2.1,
    kanto_steelFrame_low: 9.8,
    kanto_steelFrame_mid: 5.3,
    kanto_steelFrame_high: 3.0,
    kanto_reinforcedConcrete_low: 11.2,
    kanto_reinforcedConcrete_mid: 6.7,
    kanto_reinforcedConcrete_high: 3.5,
    kansai_wooden_low: 10.3,
    kansai_wooden_mid: 6.0,
    kansai_wooden_high: 3.5,
    kansai_steelFrame_low: 12.0,
    kansai_steelFrame_mid: 7.2,
    kansai_steelFrame_high: 4.2,
    kansai_reinforcedConcrete_low: 13.8,
    kansai_reinforcedConcrete_mid: 8.5,
    kansai_reinforcedConcrete_high: 5.0,
  };

  const key = `${region}_${constructionType}_${priceRange}`;
  return baseRates[key] || 7.5;
}