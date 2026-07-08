import { calculateImprovementPriorityScore } from '../../src/logic/it-6-2-2-1';

describe('改善優先度スコア算出機能', () => {
  test('SCEN-1153: 影響度スコア0・実装難度スコア100の場合、優先度スコアが0に算出される', () => {
    // Arrange
    const impactScore = 0;
    const implementationDifficultyScore = 100;
    const expectedPriorityScore = 0;

    // Act
    const priorityScore = calculateImprovementPriorityScore({
      impactScore,
      implementationDifficultyScore,
    });

    // Assert
    expect(typeof priorityScore).toBe('number');
    expect(priorityScore).toBe(expectedPriorityScore);
  });
});