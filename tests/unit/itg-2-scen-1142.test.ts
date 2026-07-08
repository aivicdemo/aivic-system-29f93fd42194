import { calculateAccuracyImprovementRate, determineSignificance } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  test('SCEN-1142: 改善率が0%の場合、有意性判定が「横ばい」と判定される', () => {
    // Arrange
    const accuracy_before = 100;
    const accuracy_after = 100;

    // Act
    const improvement_rate = calculateAccuracyImprovementRate(
      accuracy_before,
      accuracy_after
    );
    const significance_result = determineSignificance(improvement_rate);

    // Assert
    expect(improvement_rate).toBe(0);
    expect(significance_result.status).toBe('横ばい');
    expect(significance_result.reason).toBe('改善前後のスコアに変化がない');
  });
});