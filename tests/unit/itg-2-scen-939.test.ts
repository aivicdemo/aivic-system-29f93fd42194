import { diagnoseOCRPrecisionDeclination } from '../../src/logic/it-6-2-1-1';

describe('精度低下原因自動診断機能 - OCR精度閾値の境界値判定', () => {
  test('SCEN-939: OCR精度が閾値と完全に一致する境界値で診断結果が正確に判定される', () => {
    // 定数定義
    const OCR_PRECISION_THRESHOLD = 80.0;
    const OCR_PRECISION_AT_THRESHOLD = 80.0;
    const OCR_PRECISION_BELOW_THRESHOLD = 79.9;
    const OCR_PRECISION_ABOVE_THRESHOLD = 80.1;
    
    const ASSESSMENT_PERIOD_START = '2024-01-15T00:00:00Z';
    const ASSESSMENT_PERIOD_END = '2024-01-22T23:59:59Z';
    
    // ケース1: OCR精度が閾値と完全に一致（80.0%）
    const diagnosisInputAtThreshold = {
      ocrPrecision: OCR_PRECISION_AT_THRESHOLD,
      assessorCount: 30,
      assessmentPeriodStart: ASSESSMENT_PERIOD_START,
      assessmentPeriodEnd: ASSESSMENT_PERIOD_END,
      dataQualityScore: 85.5,
      modelDriftIndicator: 0.02,
    };
    
    const resultAtThreshold = diagnoseOCRPrecisionDeclination(diagnosisInputAtThreshold);
    
    expect(resultAtThreshold).toEqual({
      judgmentStatus: 'meets_standard',
      ocrPrecisionLevel: 'acceptable',
      declinationDetected: false,
      rootCauseClassification: null,
      recommendedAction: null,
      diagnosticConfidenceScore: 95,
    });
    
    // ケース2: OCR精度が閾値より低い（79.9%）
    const diagnosisInputBelowThreshold = {
      ocrPrecision: OCR_PRECISION_BELOW_THRESHOLD,
      assessorCount: 30,
      assessmentPeriodStart: ASSESSMENT_PERIOD_START,
      assessmentPeriodEnd: ASSESSMENT_PERIOD_END,
      dataQualityScore: 75.0,
      modelDriftIndicator: 0.08,
    };
    
    const resultBelowThreshold = diagnoseOCRPrecisionDeclination(diagnosisInputBelowThreshold);
    
    expect(resultBelowThreshold).toEqual({
      judgmentStatus: 'precision_declination_detected',
      ocrPrecisionLevel: 'below_threshold',
      declinationDetected: true,
      rootCauseClassification: 'model_drift',
      recommendedAction: 'relearn_model',
      diagnosticConfidenceScore: 88,
    });
    
    // ケース3: OCR精度が閾値より高い（80.1%）
    const diagnosisInputAboveThreshold = {
      ocrPrecision: OCR_PRECISION_ABOVE_THRESHOLD,
      assessorCount: 30,
      assessmentPeriodStart: ASSESSMENT_PERIOD_START,
      assessmentPeriodEnd: ASSESSMENT_PERIOD_END,
      dataQualityScore: 88.0,
      modelDriftIndicator: 0.01,
    };
    
    const resultAboveThreshold = diagnoseOCRPrecisionDeclination(diagnosisInputAboveThreshold);
    
    expect(resultAboveThreshold).toEqual({
      judgmentStatus: 'meets_standard',
      ocrPrecisionLevel: 'acceptable',
      declinationDetected: false,
      rootCauseClassification: null,
      recommendedAction: null,
      diagnosticConfidenceScore: 96,
    });
    
    // 一貫性検証: 3つの結果をログに記録し、判定状態の一貫性を確認
    const diagnosticLog = [
      {
        ocrPrecisionValue: OCR_PRECISION_AT_THRESHOLD,
        judgmentStatus: resultAtThreshold.judgmentStatus,
        timestamp: '2024-01-22T14:30:00Z',
      },
      {
        ocrPrecisionValue: OCR_PRECISION_BELOW_THRESHOLD,
        judgmentStatus: resultBelowThreshold.judgmentStatus,
        timestamp: '2024-01-22T14:31:00Z',
      },
      {
        ocrPrecisionValue: OCR_PRECISION_ABOVE_THRESHOLD,
        judgmentStatus: resultAboveThreshold.judgmentStatus,
        timestamp: '2024-01-22T14:32:00Z',
      },
    ];
    
    // 境界値判定の一貫性検証
    expect(diagnosticLog[0].judgmentStatus).toBe('meets_standard');
    expect(diagnosticLog[1].judgmentStatus).toBe('precision_declination_detected');
    expect(diagnosticLog[2].judgmentStatus).toBe('meets_standard');
    
    // 閾値での判定と上限での判定が同じであることを確認（上限も基準を満たす）
    expect(resultAtThreshold.judgmentStatus).toBe(resultAboveThreshold.judgmentStatus);
    
    // 下限での判定が異なることを確認（精度低下を検知）
    expect(resultBelowThreshold.judgmentStatus).not.toBe(resultAtThreshold.judgmentStatus);
    
    // 根本原因分類が下限でのみ設定されることを確認
    expect(resultAtThreshold.rootCauseClassification).toBeNull();
    expect(resultBelowThreshold.rootCauseClassification).not.toBeNull();
    expect(resultAboveThreshold.rootCauseClassification).toBeNull();
  });
});