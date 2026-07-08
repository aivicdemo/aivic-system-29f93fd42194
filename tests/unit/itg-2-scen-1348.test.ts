import { calculateCustomizationPriorityRank } from '../../src/logic/it-1-br-6-2-1';

describe('Customization Priority Rank Calculation', () => {
  test('SCEN-1348: [normal] カスタマイズ優先度決定 - 影響度スコアと実装難度スコアから優先度ランクが正確に算出される', () => {
    // Pattern 1: High impact, low difficulty → HIGH
    const result1 = calculateCustomizationPriorityRank({
      impactScore: 9,
      implementationDifficultyScore: 2,
    });
    expect(result1.priorityRank).toBe('HIGH');
    expect(result1.priorityScore).toBe(4.5);

    // Pattern 2: Low impact, high difficulty → LOW
    const result2 = calculateCustomizationPriorityRank({
      impactScore: 2,
      implementationDifficultyScore: 9,
    });
    expect(result2.priorityRank).toBe('LOW');
    expect(result2.priorityScore).toBeCloseTo(0.22, 1);

    // Pattern 3: Medium impact, medium difficulty → MEDIUM
    const result3 = calculateCustomizationPriorityRank({
      impactScore: 5,
      implementationDifficultyScore: 5,
    });
    expect(result3.priorityRank).toBe('MEDIUM');
    expect(result3.priorityScore).toBe(1.0);

    // Pattern 4: High impact, high difficulty → MEDIUM
    const result4 = calculateCustomizationPriorityRank({
      impactScore: 8,
      implementationDifficultyScore: 8,
    });
    expect(result4.priorityRank).toBe('MEDIUM');
    expect(result4.priorityScore).toBe(1.0);

    // Pattern 5: Very low impact, low difficulty → LOW
    const result5 = calculateCustomizationPriorityRank({
      impactScore: 1,
      implementationDifficultyScore: 1,
    });
    expect(result5.priorityRank).toBe('LOW');
    expect(result5.priorityScore).toBe(1.0);

    // Pattern 6: Very high impact, very low difficulty → HIGH
    const result6 = calculateCustomizationPriorityRank({
      impactScore: 10,
      implementationDifficultyScore: 1,
    });
    expect(result6.priorityRank).toBe('HIGH');
    expect(result6.priorityScore).toBe(10.0);

    // Pattern 7: High impact, medium difficulty → HIGH
    const result7 = calculateCustomizationPriorityRank({
      impactScore: 9,
      implementationDifficultyScore: 5,
    });
    expect(result7.priorityRank).toBe('HIGH');
    expect(result7.priorityScore).toBe(1.8);

    // Pattern 8: Low impact, low difficulty → MEDIUM
    const result8 = calculateCustomizationPriorityRank({
      impactScore: 3,
      implementationDifficultyScore: 2,
    });
    expect(result8.priorityRank).toBe('MEDIUM');
    expect(result8.priorityScore).toBe(1.5);

    // Edge case: Maximum scores (10, 10)
    const result9 = calculateCustomizationPriorityRank({
      impactScore: 10,
      implementationDifficultyScore: 10,
    });
    expect(result9.priorityRank).toBe('MEDIUM');
    expect(result9.priorityScore).toBe(1.0);

    // Edge case: Minimum scores (1, 1)
    const result10 = calculateCustomizationPriorityRank({
      impactScore: 1,
      implementationDifficultyScore: 1,
    });
    expect(result10.priorityRank).toBe('LOW');
    expect(result10.priorityScore).toBe(1.0);

    // Edge case: Equal scores at medium level
    const result11 = calculateCustomizationPriorityRank({
      impactScore: 6,
      implementationDifficultyScore: 6,
    });
    expect(result11.priorityRank).toBe('MEDIUM');
    expect(result11.priorityScore).toBeCloseTo(1.0, 1);

    // Error case: Impact score below valid range
    expect(() =>
      calculateCustomizationPriorityRank({
        impactScore: 0,
        implementationDifficultyScore: 5,
      })
    ).toThrow(/影響度スコア/);

    // Error case: Impact score above valid range
    expect(() =>
      calculateCustomizationPriorityRank({
        impactScore: 11,
        implementationDifficultyScore: 5,
      })
    ).toThrow(/影響度スコア/);

    // Error case: Difficulty score below valid range
    expect(() =>
      calculateCustomizationPriorityRank({
        impactScore: 5,
        implementationDifficultyScore: 0,
      })
    ).toThrow(/実装難度スコア/);

    // Error case: Difficulty score above valid range
    expect(() =>
      calculateCustomizationPriorityRank({
        impactScore: 5,
        implementationDifficultyScore: 11,
      })
    ).toThrow(/実装難度スコア/);
  });
});