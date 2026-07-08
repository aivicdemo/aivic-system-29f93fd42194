import { validateOcrAndAiAccuracy } from '../../src/logic/it-6-3-1';

describe('OCR精度検証・判定機能', () => {
  // SCEN-1419
  test('OCR読取精度とAI判定精度が両方合格基準を満たす場合に合格判定が返される', () => {
    const input_ocrAccuracy = 87;
    const input_aiAccuracy = 92;
    const input_ocrThreshold = 85;
    const input_aiThreshold = 90;

    const result = validateOcrAndAiAccuracy({
      ocrAccuracy: input_ocrAccuracy,
      aiAccuracy: input_aiAccuracy,
      ocrThreshold: input_ocrThreshold,
      aiThreshold: input_aiThreshold,
    });

    expect(result.status).toBe('合格');
    expect(result.ocrAccuracyScore).toBe(87);
    expect(result.aiAccuracyScore).toBe(92);
    expect(result.isOcrPassed).toBe(true);
    expect(result.isAiPassed).toBe(true);
    expect(result.passedBoth).toBe(true);
    expect(result.judgmentReason).toContain('OCR精度');
    expect(result.judgmentReason).toContain('AI判定精度');
  });

  test('OCR精度が合格基準未満の場合に不合格判定が返される', () => {
    const input_ocrAccuracy = 80;
    const input_aiAccuracy = 92;
    const input_ocrThreshold = 85;
    const input_aiThreshold = 90;

    const result = validateOcrAndAiAccuracy({
      ocrAccuracy: input_ocrAccuracy,
      aiAccuracy: input_aiAccuracy,
      ocrThreshold: input_ocrThreshold,
      aiThreshold: input_aiThreshold,
    });

    expect(result.status).toBe('不合格');
    expect(result.isOcrPassed).toBe(false);
    expect(result.isAiPassed).toBe(true);
    expect(result.passedBoth).toBe(false);
  });

  test('AI判定精度が合格基準未満の場合に不合格判定が返される', () => {
    const input_ocrAccuracy = 87;
    const input_aiAccuracy = 88;
    const input_ocrThreshold = 85;
    const input_aiThreshold = 90;

    const result = validateOcrAndAiAccuracy({
      ocrAccuracy: input_ocrAccuracy,
      aiAccuracy: input_aiAccuracy,
      ocrThreshold: input_ocrThreshold,
      aiThreshold: input_aiThreshold,
    });

    expect(result.status).toBe('不合格');
    expect(result.isOcrPassed).toBe(true);
    expect(result.isAiPassed).toBe(false);
    expect(result.passedBoth).toBe(false);
  });

  test('OCR精度とAI判定精度の両方が合格基準未満の場合に不合格判定が返される', () => {
    const input_ocrAccuracy = 80;
    const input_aiAccuracy = 88;
    const input_ocrThreshold = 85;
    const input_aiThreshold = 90;

    const result = validateOcrAndAiAccuracy({
      ocrAccuracy: input_ocrAccuracy,
      aiAccuracy: input_aiAccuracy,
      ocrThreshold: input_ocrThreshold,
      aiThreshold: input_aiThreshold,
    });

    expect(result.status).toBe('不合格');
    expect(result.isOcrPassed).toBe(false);
    expect(result.isAiPassed).toBe(false);
    expect(result.passedBoth).toBe(false);
  });

  test('OCR精度がちょうど合格基準値の場合に合格判定が返される', () => {
    const input_ocrAccuracy = 85;
    const input_aiAccuracy = 90;
    const input_ocrThreshold = 85;
    const input_aiThreshold = 90;

    const result = validateOcrAndAiAccuracy({
      ocrAccuracy: input_ocrAccuracy,
      aiAccuracy: input_aiAccuracy,
      ocrThreshold: input_ocrThreshold,
      aiThreshold: input_aiThreshold,
    });

    expect(result.status).toBe('合格');
    expect(result.isOcrPassed).toBe(true);
    expect(result.isAiPassed).toBe(true);
    expect(result.passedBoth).toBe(true);
  });

  test('不正な精度値（100超過）が渡される場合にエラーが投げられる', () => {
    const input_ocrAccuracy = 105;
    const input_aiAccuracy = 92;

    expect(() =>
      validateOcrAndAiAccuracy({
        ocrAccuracy: input_ocrAccuracy,
        aiAccuracy: input_aiAccuracy,
        ocrThreshold: 85,
        aiThreshold: 90,
      })
    ).toThrow(/精度値/);
  });

  test('不正な精度値（負数）が渡される場合にエラーが投げられる', () => {
    const input_ocrAccuracy = -5;
    const input_aiAccuracy = 92;

    expect(() =>
      validateOcrAndAiAccuracy({
        ocrAccuracy: input_ocrAccuracy,
        aiAccuracy: input_aiAccuracy,
        ocrThreshold: 85,
        aiThreshold: 90,
      })
    ).toThrow(/精度値/);
  });

  test('閾値が精度値より大きい場合に結果に閾値情報が含まれる', () => {
    const input_ocrAccuracy = 87;
    const input_aiAccuracy = 92;
    const input_ocrThreshold = 85;
    const input_aiThreshold = 90;

    const result = validateOcrAndAiAccuracy({
      ocrAccuracy: input_ocrAccuracy,
      aiAccuracy: input_aiAccuracy,
      ocrThreshold: input_ocrThreshold,
      aiThreshold: input_aiThreshold,
    });

    expect(result.ocrThreshold).toBe(85);
    expect(result.aiThreshold).toBe(90);
    expect(result.ocrMarginAboveThreshold).toBe(2);
    expect(result.aiMarginAboveThreshold).toBe(2);
  });
});