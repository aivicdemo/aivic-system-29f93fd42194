import { detectOCRAccuracyDecline, proposeAccuracyCorrectionFactor } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  // SCEN-864: OCR精度低下検知・補正機能 - 前月比-5%以上のOCR精度低下を検知し、補正係数の自動調整を提案する
  test('should detect OCR accuracy decline of -5% or more and propose correction factor', () => {
    // 前月のOCR精度データ: 95%
    const previousMonthAccuracy = 95;
    
    // 当月のOCR精度データ: 90%（前月比で-5%低下）
    const currentMonthAccuracy = 90;
    
    // OCR精度低下の検知
    const declineDetectionResult = detectOCRAccuracyDecline({
      previousMonthAccuracy,
      currentMonthAccuracy,
      declineThresholdPercent: 5,
    });

    // 前月比での精度低下が正しく検出されたことを検証
    expect(declineDetectionResult.isDetected).toBe(true);
    expect(declineDetectionResult.declinePercentage).toBe(-5);
    expect(declineDetectionResult.status).toBe('detected');
    expect(declineDetectionResult.message).toMatch(/精度低下/);

    // 補正係数の自動提案
    const correctionProposal = proposeAccuracyCorrectionFactor({
      currentAccuracy: currentMonthAccuracy,
      targetAccuracy: previousMonthAccuracy,
      declinePercentage: declineDetectionResult.declinePercentage,
    });

    // 提案された補正係数が妥当な範囲内（0.95～1.05）であることを確認
    expect(correctionProposal.correctionFactor).toBeGreaterThanOrEqual(0.95);
    expect(correctionProposal.correctionFactor).toBeLessThanOrEqual(1.05);
    expect(correctionProposal.correctionFactor).toBe(1.0556); // 95/90 = 1.0556

    // 提案内容に必須情報が含まれていることを確認
    expect(correctionProposal.reason).toMatch(/OCR精度/);
    expect(correctionProposal.expectedImprovementDegree).toBe(5);
    expect(correctionProposal.applicableRange).toBeDefined();
    expect(correctionProposal.applicableRange).toEqual({
      minAccuracy: 85,
      maxAccuracy: 95,
    });

    // 補正係数の適用状況がシステムログに記録されていることを確認
    expect(correctionProposal.logEntry).toBeDefined();
    expect(correctionProposal.logEntry.correctionFactorApplied).toBe(1.0556);
    expect(correctionProposal.logEntry.appliedAt).toBe('2024-01-15T09:00:00Z');
    expect(correctionProposal.logEntry.appliedBy).toBe('system');
    expect(correctionProposal.logEntry.status).toBe('approved');
  });

  test('should not trigger correction when decline is below threshold', () => {
    // 前月のOCR精度データ: 95%
    const previousMonthAccuracy = 95;
    
    // 当月のOCR精度データ: 92%（前月比で-3%低下、閾値以下）
    const currentMonthAccuracy = 92;

    const declineDetectionResult = detectOCRAccuracyDecline({
      previousMonthAccuracy,
      currentMonthAccuracy,
      declineThresholdPercent: 5,
    });

    // 低下が閾値以下なので検知されない
    expect(declineDetectionResult.isDetected).toBe(false);
    expect(declineDetectionResult.declinePercentage).toBe(-3);
    expect(declineDetectionResult.status).toBe('normal');
  });

  test('should handle accuracy improvement without correction proposal', () => {
    // 前月のOCR精度データ: 90%
    const previousMonthAccuracy = 90;
    
    // 当月のOCR精度データ: 95%（前月比で+5%改善）
    const currentMonthAccuracy = 95;

    const declineDetectionResult = detectOCRAccuracyDecline({
      previousMonthAccuracy,
      currentMonthAccuracy,
      declineThresholdPercent: 5,
    });

    // 精度が改善している場合は検知されない
    expect(declineDetectionResult.isDetected).toBe(false);
    expect(declineDetectionResult.declinePercentage).toBe(5);
    expect(declineDetectionResult.status).toBe('improved');
  });

  test('should throw error when accuracy values are invalid', () => {
    expect(() =>
      detectOCRAccuracyDecline({
        previousMonthAccuracy: 105, // 100を超える値
        currentMonthAccuracy: 90,
        declineThresholdPercent: 5,
      })
    ).toThrow(/精度/);

    expect(() =>
      detectOCRAccuracyDecline({
        previousMonthAccuracy: 95,
        currentMonthAccuracy: -10, // 負の値
        declineThresholdPercent: 5,
      })
    ).toThrow(/精度/);

    expect(() =>
      proposeAccuracyCorrectionFactor({
        currentAccuracy: 90,
        targetAccuracy: 95,
        declinePercentage: -5,
      })
    ).toThrow(/目標精度/);
  });

  test('should calculate correction factor for edge case of severe decline', () => {
    // 前月のOCR精度データ: 95%
    const previousMonthAccuracy = 95;
    
    // 当月のOCR精度データ: 80%（前月比で-15%低下、大幅低下）
    const currentMonthAccuracy = 80;

    const declineDetectionResult = detectOCRAccuracyDecline({
      previousMonthAccuracy,
      currentMonthAccuracy,
      declineThresholdPercent: 5,
    });

    expect(declineDetectionResult.isDetected).toBe(true);
    expect(declineDetectionResult.declinePercentage).toBe(-15);

    const correctionProposal = proposeAccuracyCorrectionFactor({
      currentAccuracy: currentMonthAccuracy,
      targetAccuracy: previousMonthAccuracy,
      declinePercentage: declineDetectionResult.declinePercentage,
    });

    // 大幅低下時の補正係数（95/80 = 1.1875）
    expect(correctionProposal.correctionFactor).toBe(1.1875);
    expect(correctionProposal.expectedImprovementDegree).toBe(15);
    expect(correctionProposal.logEntry.status).toBe('approved');
  });
});