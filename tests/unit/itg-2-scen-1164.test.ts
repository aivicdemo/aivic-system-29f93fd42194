import { calculateOCRPrecisionImprovement } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  test('SCEN-1164: モデル更新効果定量化機能 - 改善度3%が基準値5%未満で改善不足と判定される', () => {
    // Arrange
    const ocr_precision_before = 85;
    const ocr_precision_after = 88;
    const improvement_threshold = 5;

    // Act
    const result = calculateOCRPrecisionImprovement({
      ocr_precision_before,
      ocr_precision_after,
      improvement_threshold,
    });

    // Assert
    expect(result.improvement_rate).toBe(3);
    expect(result.meets_threshold).toBe(false);
    expect(result.judgment).toBe('改善不足');
  });
});