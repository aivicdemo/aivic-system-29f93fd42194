import { diagnoseAccuracyDecline } from '../../src/logic/it-1-br-6-2-1';

describe('査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析機能', () => {
  // SCEN-1175
  test('前月比でOCR精度が正確に-5%低下した場合、低下判定の境界値として機能する', () => {
    const previousMonthOcrAccuracy = 95;
    const currentMonthOcrAccuracy = 90;
    const declineThreshold = -5;

    const result = diagnoseAccuracyDecline({
      previousMonthOcrAccuracy,
      currentMonthOcrAccuracy,
      declineThreshold
    });

    expect(result.accuracyDeclinePercentage).toBe(-5);
    expect(result.isDeclineFlagged).toBe(true);
    expect(result.declineThresholdMet).toBe(true);
    expect(result.diagnosticLog).toContain('OCR精度が-5%低下しました');
    expect(result.diagnosticMessage).toMatch(/OCR精度.*低下/);
  });
});