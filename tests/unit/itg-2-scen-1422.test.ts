import { describe, it, expect, beforeEach } from '@jest/globals';
import { validateAndJudgeOcrAccuracy } from '../../src/logic/it-6-3-1';

describe('OCR精度検証・判定機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1422
  it('OCR読取精度は合格だがAI判定精度が境界値の場合に条件付き合格判定が返される', () => {
    const input = {
      ocrAccuracyRate: 95.0,
      aiJudgmentAccuracyRate: 70.0,
      ocrAccuracyThreshold: 90.0,
      aiAccuracyBoundaryValue: 70.0,
      aiAccuracyPassThreshold: 75.0,
    };

    const result = validateAndJudgeOcrAccuracy(input);

    expect(result).toEqual({
      finalJudgment: '条件付き合格',
      ocrAccuracyStatus: '合格',
      ocrAccuracyRate: 95.0,
      aiJudgmentAccuracyStatus: '境界値',
      aiJudgmentAccuracyRate: 70.0,
      detailedInfo: {
        ocrPassedThreshold: true,
        aiAtBoundary: true,
        requiresMonitoring: true,
      },
      remarks: 'AI判定精度が境界値のため、継続監視が必要です',
    });

    expect(result.finalJudgment).toBe('条件付き合格');
    expect(result.ocrAccuracyStatus).toBe('合格');
    expect(result.ocrAccuracyRate).toBe(95.0);
    expect(result.aiJudgmentAccuracyStatus).toBe('境界値');
    expect(result.aiJudgmentAccuracyRate).toBe(70.0);
    expect(result.detailedInfo.ocrPassedThreshold).toBe(true);
    expect(result.detailedInfo.aiAtBoundary).toBe(true);
    expect(result.detailedInfo.requiresMonitoring).toBe(true);
  });

  it('OCR精度が不合格の場合は不合格判定が返される', () => {
    const input = {
      ocrAccuracyRate: 85.0,
      aiJudgmentAccuracyRate: 80.0,
      ocrAccuracyThreshold: 90.0,
      aiAccuracyBoundaryValue: 70.0,
      aiAccuracyPassThreshold: 75.0,
    };

    const result = validateAndJudgeOcrAccuracy(input);

    expect(result.finalJudgment).toBe('不合格');
    expect(result.ocrAccuracyStatus).toBe('不合格');
  });

  it('OCR精度が合格でAI判定精度も合格の場合は合格判定が返される', () => {
    const input = {
      ocrAccuracyRate: 96.0,
      aiJudgmentAccuracyRate: 78.0,
      ocrAccuracyThreshold: 90.0,
      aiAccuracyBoundaryValue: 70.0,
      aiAccuracyPassThreshold: 75.0,
    };

    const result = validateAndJudgeOcrAccuracy(input);

    expect(result.finalJudgment).toBe('合格');
    expect(result.ocrAccuracyStatus).toBe('合格');
    expect(result.aiJudgmentAccuracyStatus).toBe('合格');
    expect(result.detailedInfo.aiAtBoundary).toBe(false);
  });

  it('OCR精度が合格でAI判定精度が不合格の場合は不合格判定が返される', () => {
    const input = {
      ocrAccuracyRate: 95.0,
      aiJudgmentAccuracyRate: 68.0,
      ocrAccuracyThreshold: 90.0,
      aiAccuracyBoundaryValue: 70.0,
      aiAccuracyPassThreshold: 75.0,
    };

    const result = validateAndJudgeOcrAccuracy(input);

    expect(result.finalJudgment).toBe('不合格');
    expect(result.aiJudgmentAccuracyStatus).toBe('不合格');
  });

  it('必須入力パラメータが不足している場合はエラーをスロー', () => {
    const incompleteInput = {
      ocrAccuracyRate: 95.0,
      aiJudgmentAccuracyRate: 70.0,
    };

    expect(() => validateAndJudgeOcrAccuracy(incompleteInput as any)).toThrow(/必須パラメータ/);
  });

  it('閾値設定が逆転している場合はエラーをスロー', () => {
    const invalidInput = {
      ocrAccuracyRate: 95.0,
      aiJudgmentAccuracyRate: 70.0,
      ocrAccuracyThreshold: 95.0,
      aiAccuracyBoundaryValue: 75.0,
      aiAccuracyPassThreshold: 70.0,
    };

    expect(() => validateAndJudgeOcrAccuracy(invalidInput)).toThrow(/閾値設定/);
  });

  it('精度値が範囲外の場合はエラーをスロー', () => {
    const outOfRangeInput = {
      ocrAccuracyRate: 105.0,
      aiJudgmentAccuracyRate: 70.0,
      ocrAccuracyThreshold: 90.0,
      aiAccuracyBoundaryValue: 70.0,
      aiAccuracyPassThreshold: 75.0,
    };

    expect(() => validateAndJudgeOcrAccuracy(outOfRangeInput)).toThrow(/精度値/);
  });
});