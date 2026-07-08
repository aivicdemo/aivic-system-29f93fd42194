import { detectPrecisionDeclineTrend } from '../../src/logic/it-6-2-2-1';

describe('精度低下兆候検知機能', () => {
  // SCEN-1144
  test('[normal] 精度測定値から低下の兆候を数値で正確に検知できる', () => {
    // 過去30日間の精度測定値: 前月値から設定閾値（5%以上低下）を超えて低下
    const precisionHistoryData = {
      ocrAccuracyPreviousMonth: 92.5,
      ocrAccuracyCurrentMonth: 87.0,
      aiJudgmentAccuracyPreviousMonth: 88.0,
      aiJudgmentAccuracyCurrentMonth: 82.5,
      consistencyScorePreviousMonth: 85.0,
      consistencyScoreCurrentMonth: 79.5,
      thresholdPercentage: 5.0,
      measurementDays: 30
    };

    const result = detectPrecisionDeclineTrend(precisionHistoryData);

    // OCR精度: (92.5 - 87.0) / 92.5 = 5.95% の低下 → 閾値5%超過 → 検知
    expect(result.ocrDeclineDetected).toBe(true);
    expect(result.ocrDeclineRate).toBeCloseTo(5.95, 1);
    expect(result.ocrIsAboveThreshold).toBe(true);

    // AI判定精度: (88.0 - 82.5) / 88.0 = 6.25% の低下 → 閾値5%超過 → 検知
    expect(result.aiJudgmentDeclineDetected).toBe(true);
    expect(result.aiJudgmentDeclineRate).toBeCloseTo(6.25, 1);
    expect(result.aiJudgmentIsAboveThreshold).toBe(true);

    // 一貫性スコア: (85.0 - 79.5) / 85.0 = 6.47% の低下 → 閾値5%超過 → 検知
    expect(result.consistencyDeclineDetected).toBe(true);
    expect(result.consistencyDeclineRate).toBeCloseTo(6.47, 1);
    expect(result.consistencyIsAboveThreshold).toBe(true);

    // 複合判定: いずれかの指標が閾値超過 → アラート発行対象
    expect(result.alertRequired).toBe(true);
    expect(result.detectedIndicators.length).toBe(3);
    expect(result.detectedIndicators).toEqual(
      expect.arrayContaining(['ocrAccuracy', 'aiJudgmentAccuracy', 'consistencyScore'])
    );

    // 通知メッセージが生成されることを確認
    expect(result.alertMessage).toMatch(/精度低下/);
    expect(result.alertMessage).toMatch(/検知/);
  });

  // エラーテスト: 前月値が0またはnullの場合、計算不可として例外を発生させる
  test('[error] 前月値がnullの場合、例外を発生させる', () => {
    const invalidData = {
      ocrAccuracyPreviousMonth: null as any,
      ocrAccuracyCurrentMonth: 87.0,
      aiJudgmentAccuracyPreviousMonth: 88.0,
      aiJudgmentAccuracyCurrentMonth: 82.5,
      consistencyScorePreviousMonth: 85.0,
      consistencyScoreCurrentMonth: 79.5,
      thresholdPercentage: 5.0,
      measurementDays: 30
    };

    expect(() => detectPrecisionDeclineTrend(invalidData)).toThrow(/前月値/);
  });

  // 許容範囲内の変動: 閾値未満の低下は検知されない
  test('[normal] 許容範囲内の変動は検知されない', () => {
    const withinThresholdData = {
      ocrAccuracyPreviousMonth: 92.5,
      ocrAccuracyCurrentMonth: 89.0,
      aiJudgmentAccuracyPreviousMonth: 88.0,
      aiJudgmentAccuracyCurrentMonth: 86.5,
      consistencyScorePreviousMonth: 85.0,
      consistencyScoreCurrentMonth: 83.0,
      thresholdPercentage: 5.0,
      measurementDays: 30
    };

    const result = detectPrecisionDeclineTrend(withinThresholdData);

    // OCR精度: (92.5 - 89.0) / 92.5 = 3.78% → 閾値5%未満 → 検知されない
    expect(result.ocrDeclineDetected).toBe(false);
    expect(result.ocrDeclineRate).toBeCloseTo(3.78, 1);
    expect(result.ocrIsAboveThreshold).toBe(false);

    // AI判定精度: (88.0 - 86.5) / 88.0 = 1.70% → 閾値5%未満 → 検知されない
    expect(result.aiJudgmentDeclineDetected).toBe(false);
    expect(result.aiJudgmentDeclineRate).toBeCloseTo(1.70, 1);
    expect(result.aiJudgmentIsAboveThreshold).toBe(false);

    // 一貫性スコア: (85.0 - 83.0) / 85.0 = 2.35% → 閾値5%未満 → 検知されない
    expect(result.consistencyDeclineDetected).toBe(false);
    expect(result.consistencyDeclineRate).toBeCloseTo(2.35, 1);
    expect(result.consistencyIsAboveThreshold).toBe(false);

    // 複合判定: どの指標も閾値未満 → アラート不要
    expect(result.alertRequired).toBe(false);
    expect(result.detectedIndicators.length).toBe(0);
  });

  // 複数指標が混在する場合: 一部のみ低下が閾値を超える
  test('[normal] 複数指標が混在する場合、低下を超える指標のみ検知される', () => {
    const mixedData = {
      ocrAccuracyPreviousMonth: 92.5,
      ocrAccuracyCurrentMonth: 87.0,
      aiJudgmentAccuracyPreviousMonth: 88.0,
      aiJudgmentAccuracyCurrentMonth: 87.0,
      consistencyScorePreviousMonth: 85.0,
      consistencyScoreCurrentMonth: 82.0,
      thresholdPercentage: 5.0,
      measurementDays: 30
    };

    const result = detectPrecisionDeclineTrend(mixedData);

    // OCR精度: (92.5 - 87.0) / 92.5 = 5.95% → 閾値5%超過 → 検知
    expect(result.ocrDeclineDetected).toBe(true);
    expect(result.ocrIsAboveThreshold).toBe(true);

    // AI判定精度: (88.0 - 87.0) / 88.0 = 1.14% → 閾値5%未満 → 検知されない
    expect(result.aiJudgmentDeclineDetected).toBe(false);
    expect(result.aiJudgmentIsAboveThreshold).toBe(false);

    // 一貫性スコア: (85.0 - 82.0) / 85.0 = 3.53% → 閾値5%未満 → 検知されない
    expect(result.consistencyDeclineDetected).toBe(false);
    expect(result.consistencyIsAboveThreshold).toBe(false);

    // 複合判定: OCRのみ検知 → アラート発行対象
    expect(result.alertRequired).toBe(true);
    expect(result.detectedIndicators.length).toBe(1);
    expect(result.detectedIndicators).toContain('ocrAccuracy');
    expect(result.detectedIndicators).not.toContain('aiJudgmentAccuracy');
  });

  // 精度が向上した場合: 低下ではなく向上 → 検知されない
  test('[normal] 精度が向上した場合は検知されない', () => {
    const improvementData = {
      ocrAccuracyPreviousMonth: 85.0,
      ocrAccuracyCurrentMonth: 90.5,
      aiJudgmentAccuracyPreviousMonth: 82.0,
      aiJudgmentAccuracyCurrentMonth: 88.5,
      consistencyScorePreviousMonth: 80.0,
      consistencyScoreCurrentMonth: 87.5,
      thresholdPercentage: 5.0,
      measurementDays: 30
    };

    const result = detectPrecisionDeclineTrend(improvementData);

    // 向上は低下ではないため、すべて検知されない
    expect(result.ocrDeclineDetected).toBe(false);
    expect(result.aiJudgmentDeclineDetected).toBe(false);
    expect(result.consistencyDeclineDetected).toBe(false);
    expect(result.alertRequired).toBe(false);
    expect(result.detectedIndicators.length).toBe(0);
  });

  // 閾値が0%の場合: 1%以上の低下も検知対象
  test('[normal] 閾値0%の場合、わずかな低下も検知される', () => {
    const strictThresholdData = {
      ocrAccuracyPreviousMonth: 92.5,
      ocrAccuracyCurrentMonth: 91.5,
      aiJudgmentAccuracyPreviousMonth: 88.0,
      aiJudgmentAccuracyCurrentMonth: 87.0,
      consistencyScorePreviousMonth: 85.0,
      consistencyScoreCurrentMonth: 84.0,
      thresholdPercentage: 0.0,
      measurementDays: 30
    };

    const result = detectPrecisionDeclineTrend(strictThresholdData);

    // OCR精度: (92.5 - 91.5) / 92.5 = 1.08% → 閾値0%以上 → 検知
    expect(result.ocrDeclineDetected).toBe(true);
    expect(result.ocrDeclineRate).toBeCloseTo(1.08, 1);

    // AI判定精度: (88.0 - 87.0) / 88.0 = 1.14% → 閾値0%以上 → 検知
    expect(result.aiJudgmentDeclineDetected).toBe(true);
    expect(result.aiJudgmentDeclineRate).toBeCloseTo(1.14, 1);

    // 一貫性スコア: (85.0 - 84.0) / 85.0 = 1.18% → 閾値0%以上 → 検知
    expect(result.consistencyDeclineDetected).toBe(true);
    expect(result.consistencyDeclineRate).toBeCloseTo(1.18, 1);

    expect(result.alertRequired).toBe(true);
    expect(result.detectedIndicators.length).toBe(3);
  });

  // 現在値がマイナス値の場合（不正データ）、例外を発生させる
  test('[error] 現在値が負数の場合、例外を発生させる', () => {
    const negativeCurrentData = {
      ocrAccuracyPreviousMonth: 92.5,
      ocrAccuracyCurrentMonth: -5.0,
      aiJudgmentAccuracyPreviousMonth: 88.0,
      aiJudgmentAccuracyCurrentMonth: 82.5,
      consistencyScorePreviousMonth: 85.0,
      consistencyScoreCurrentMonth: 79.5,
      thresholdPercentage: 5.0,
      measurementDays: 30
    };

    expect(() => detectPrecisionDeclineTrend(negativeCurrentData)).toThrow(/精度値/);
  });

  // 測定期間が異常値の場合、例外を発生させる
  test('[error] 測定期間が0の場合、例外を発生させる', () => {
    const invalidPeriodData = {
      ocrAccuracyPreviousMonth: 92.5,
      ocrAccuracyCurrentMonth: 87.0,
      aiJudgmentAccuracyPreviousMonth: 88.0,
      aiJudgmentAccuracyCurrentMonth: 82.5,
      consistencyScorePreviousMonth: 85.0,
      consistencyScoreCurrentMonth: 79.5,
      thresholdPercentage: 5.0,
      measurementDays: 0
    };

    expect(() => detectPrecisionDeclineTrend(invalidPeriodData)).toThrow(/測定期間/);
  });
});