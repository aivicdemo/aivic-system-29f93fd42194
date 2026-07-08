import { validateExplanationMaterialQuality } from '../../src/logic/it-6-2-2-1';

describe('査定員による説明資料の品質チェック', () => {
  // SCEN-1014
  test('OCR読取精度・判定根拠・グラフ正確性・説明文完全性の4項目すべてが基準を満たす場合に合格判定される', () => {
    const explanationMaterial = {
      ocrReadAccuracy: 96.5,
      ocrReadAccuracyStandard: 95.0,
      judgmentReasonClarity: true,
      judgmentReasonStandard: true,
      graphAccuracy: true,
      graphAccuracyStandard: true,
      explanationCompleteness: true,
      explanationCompletenessStandard: true,
      createdAt: new Date('2024-01-15T11:00:00Z'),
      assessorId: 'ASSESSOR_001',
      estimateId: 'EST_2024_001',
      materialId: 'MAT_2024_001'
    };

    const result = validateExplanationMaterialQuality(explanationMaterial);

    expect(result.status).toBe('PASS');
    expect(result.ocrReadAccuracyCheck).toBe('PASS');
    expect(result.judgmentReasonCheck).toBe('PASS');
    expect(result.graphAccuracyCheck).toBe('PASS');
    expect(result.explanationCompletenessCheck).toBe('PASS');
    expect(result.overallJudgment).toBe('合格');
    expect(result.judgmentDate).toEqual(new Date('2024-01-15T11:00:00Z'));
    expect(result.assessorId).toBe('ASSESSOR_001');
    expect(result.materialId).toBe('MAT_2024_001');
  });

  test('OCR読取精度が基準値未満の場合は不合格判定される', () => {
    const explanationMaterial = {
      ocrReadAccuracy: 94.0,
      ocrReadAccuracyStandard: 95.0,
      judgmentReasonClarity: true,
      judgmentReasonStandard: true,
      graphAccuracy: true,
      graphAccuracyStandard: true,
      explanationCompleteness: true,
      explanationCompletenessStandard: true,
      createdAt: new Date('2024-01-15T11:00:00Z'),
      assessorId: 'ASSESSOR_001',
      estimateId: 'EST_2024_001',
      materialId: 'MAT_2024_001'
    };

    const result = validateExplanationMaterialQuality(explanationMaterial);

    expect(result.status).toBe('FAIL');
    expect(result.ocrReadAccuracyCheck).toBe('FAIL');
    expect(result.judgmentReasonCheck).toBe('PASS');
    expect(result.graphAccuracyCheck).toBe('PASS');
    expect(result.explanationCompletenessCheck).toBe('PASS');
    expect(result.overallJudgment).toBe('不合格');
    expect(result.failureReasons).toContain('OCR読取精度');
  });

  test('判定根拠が明確でない場合は不合格判定される', () => {
    const explanationMaterial = {
      ocrReadAccuracy: 96.5,
      ocrReadAccuracyStandard: 95.0,
      judgmentReasonClarity: false,
      judgmentReasonStandard: true,
      graphAccuracy: true,
      graphAccuracyStandard: true,
      explanationCompleteness: true,
      explanationCompletenessStandard: true,
      createdAt: new Date('2024-01-15T11:00:00Z'),
      assessorId: 'ASSESSOR_001',
      estimateId: 'EST_2024_001',
      materialId: 'MAT_2024_001'
    };

    const result = validateExplanationMaterialQuality(explanationMaterial);

    expect(result.status).toBe('FAIL');
    expect(result.ocrReadAccuracyCheck).toBe('PASS');
    expect(result.judgmentReasonCheck).toBe('FAIL');
    expect(result.graphAccuracyCheck).toBe('PASS');
    expect(result.explanationCompletenessCheck).toBe('PASS');
    expect(result.overallJudgment).toBe('不合格');
    expect(result.failureReasons).toContain('判定根拠');
  });

  test('グラフの数値と算出根拠が一致していない場合は不合格判定される', () => {
    const explanationMaterial = {
      ocrReadAccuracy: 96.5,
      ocrReadAccuracyStandard: 95.0,
      judgmentReasonClarity: true,
      judgmentReasonStandard: true,
      graphAccuracy: false,
      graphAccuracyStandard: true,
      explanationCompleteness: true,
      explanationCompletenessStandard: true,
      createdAt: new Date('2024-01-15T11:00:00Z'),
      assessorId: 'ASSESSOR_001',
      estimateId: 'EST_2024_001',
      materialId: 'MAT_2024_001'
    };

    const result = validateExplanationMaterialQuality(explanationMaterial);

    expect(result.status).toBe('FAIL');
    expect(result.ocrReadAccuracyCheck).toBe('PASS');
    expect(result.judgmentReasonCheck).toBe('PASS');
    expect(result.graphAccuracyCheck).toBe('FAIL');
    expect(result.explanationCompletenessCheck).toBe('PASS');
    expect(result.overallJudgment).toBe('不合格');
    expect(result.failureReasons).toContain('グラフ正確性');
  });

  test('説明文の必須項目が不完全な場合は不合格判定される', () => {
    const explanationMaterial = {
      ocrReadAccuracy: 96.5,
      ocrReadAccuracyStandard: 95.0,
      judgmentReasonClarity: true,
      judgmentReasonStandard: true,
      graphAccuracy: true,
      graphAccuracyStandard: true,
      explanationCompleteness: false,
      explanationCompletenessStandard: true,
      createdAt: new Date('2024-01-15T11:00:00Z'),
      assessorId: 'ASSESSOR_001',
      estimateId: 'EST_2024_001',
      materialId: 'MAT_2024_001'
    };

    const result = validateExplanationMaterialQuality(explanationMaterial);

    expect(result.status).toBe('FAIL');
    expect(result.ocrReadAccuracyCheck).toBe('PASS');
    expect(result.judgmentReasonCheck).toBe('PASS');
    expect(result.graphAccuracyCheck).toBe('PASS');
    expect(result.explanationCompletenessCheck).toBe('FAIL');
    expect(result.overallJudgment).toBe('不合格');
    expect(result.failureReasons).toContain('説明文完全性');
  });

  test('複数の項目が基準を満たさない場合はすべての不合格理由が記録される', () => {
    const explanationMaterial = {
      ocrReadAccuracy: 94.0,
      ocrReadAccuracyStandard: 95.0,
      judgmentReasonClarity: false,
      judgmentReasonStandard: true,
      graphAccuracy: false,
      graphAccuracyStandard: true,
      explanationCompleteness: false,
      explanationCompletenessStandard: true,
      createdAt: new Date('2024-01-15T11:00:00Z'),
      assessorId: 'ASSESSOR_001',
      estimateId: 'EST_2024_001',
      materialId: 'MAT_2024_001'
    };

    const result = validateExplanationMaterialQuality(explanationMaterial);

    expect(result.status).toBe('FAIL');
    expect(result.overallJudgment).toBe('不合格');
    expect(result.failureReasons.length).toBe(4);
    expect(result.failureReasons).toContain('OCR読取精度');
    expect(result.failureReasons).toContain('判定根拠');
    expect(result.failureReasons).toContain('グラフ正確性');
    expect(result.failureReasons).toContain('説明文完全性');
  });

  test('OcrReadAccuracyが基準値と同値の場合は合格判定される', () => {
    const explanationMaterial = {
      ocrReadAccuracy: 95.0,
      ocrReadAccuracyStandard: 95.0,
      judgmentReasonClarity: true,
      judgmentReasonStandard: true,
      graphAccuracy: true,
      graphAccuracyStandard: true,
      explanationCompleteness: true,
      explanationCompletenessStandard: true,
      createdAt: new Date('2024-01-15T11:00:00Z'),
      assessorId: 'ASSESSOR_001',
      estimateId: 'EST_2024_001',
      materialId: 'MAT_2024_001'
    };

    const result = validateExplanationMaterialQuality(explanationMaterial);

    expect(result.status).toBe('PASS');
    expect(result.ocrReadAccuracyCheck).toBe('PASS');
    expect(result.overallJudgment).toBe('合格');
  });

  test('結果レコードに適切なタイムスタンプとメタデータが含まれる', () => {
    const explanationMaterial = {
      ocrReadAccuracy: 96.5,
      ocrReadAccuracyStandard: 95.0,
      judgmentReasonClarity: true,
      judgmentReasonStandard: true,
      graphAccuracy: true,
      graphAccuracyStandard: true,
      explanationCompleteness: true,
      explanationCompletenessStandard: true,
      createdAt: new Date('2024-01-15T11:00:00Z'),
      assessorId: 'ASSESSOR_001',
      estimateId: 'EST_2024_001',
      materialId: 'MAT_2024_001'
    };

    const result = validateExplanationMaterialQuality(explanationMaterial);

    expect(result.materialId).toBe('MAT_2024_001');
    expect(result.assessorId).toBe('ASSESSOR_001');
    expect(result.estimateId).toBe('EST_2024_001');
    expect(result.judgmentDate).toEqual(new Date('2024-01-15T11:00:00Z'));
  });
});