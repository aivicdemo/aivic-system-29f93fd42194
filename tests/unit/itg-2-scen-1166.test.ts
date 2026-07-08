import { calculatePrecisionIndicators } from '../../src/logic/it-6-2-1-1';

describe('Model Update Effect Quantification - Precision Measurement Data Validation', () => {
  test('SCEN-1166: Should throw error when precision measurement data is missing', () => {
    const incompleteDataset = {
      assessor_id: 'ASSESSOR_001',
      work_type: '土工',
      amount_range: '1000万~5000万',
      ocr_precision_before: 92.5,
      ocr_precision_after: 94.8,
      ai_judgment_precision_before: null,
      ai_judgment_precision_after: 95.2,
      sample_count: 150,
      measurement_date: '2024-02-15',
      model_version_before: 'v2.1',
      model_version_after: 'v2.2',
    };

    expect(() => calculatePrecisionIndicators(incompleteDataset)).toThrow(/精度測定データ/);
  });

  test('SCEN-1166: Should throw error when sample count is missing', () => {
    const incompleteDataset = {
      assessor_id: 'ASSESSOR_002',
      work_type: '鋼構造',
      amount_range: '5000万~1億',
      ocr_precision_before: 89.3,
      ocr_precision_after: 91.7,
      ai_judgment_precision_before: 87.2,
      ai_judgment_precision_after: 89.5,
      sample_count: null,
      measurement_date: '2024-02-15',
      model_version_before: 'v2.1',
      model_version_after: 'v2.2',
    };

    expect(() => calculatePrecisionIndicators(incompleteDataset)).toThrow(/サンプル数/);
  });

  test('SCEN-1166: Should throw error when measurement date is missing', () => {
    const incompleteDataset = {
      assessor_id: 'ASSESSOR_003',
      work_type: '建築',
      amount_range: '1000万以下',
      ocr_precision_before: 94.1,
      ocr_precision_after: 96.3,
      ai_judgment_precision_before: 91.8,
      ai_judgment_precision_after: 93.6,
      sample_count: 200,
      measurement_date: null,
      model_version_before: 'v2.1',
      model_version_after: 'v2.2',
    };

    expect(() => calculatePrecisionIndicators(incompleteDataset)).toThrow(/測定日時/);
  });

  test('SCEN-1166: Should successfully calculate precision indicators when all required data is present', () => {
    const completeDataset = {
      assessor_id: 'ASSESSOR_004',
      work_type: '土工',
      amount_range: '1000万~5000万',
      ocr_precision_before: 92.5,
      ocr_precision_after: 94.8,
      ai_judgment_precision_before: 88.9,
      ai_judgment_precision_after: 91.2,
      sample_count: 180,
      measurement_date: '2024-02-15T10:30:00Z',
      model_version_before: 'v2.1',
      model_version_after: 'v2.2',
    };

    const result = calculatePrecisionIndicators(completeDataset);

    expect(result).toEqual({
      assessor_id: 'ASSESSOR_004',
      work_type: '土工',
      amount_range: '1000万~5000万',
      ocr_improvement_rate: 2.5,
      ai_judgment_improvement_rate: 2.6,
      combined_improvement_rate: 2.55,
      sample_count: 180,
      measurement_date: '2024-02-15T10:30:00Z',
      model_version_before: 'v2.1',
      model_version_after: 'v2.2',
      visualization_status: 'completed',
    });
  });

  test('SCEN-1166: Should throw error when OCR precision before measurement is missing', () => {
    const incompleteDataset = {
      assessor_id: 'ASSESSOR_005',
      work_type: '電気',
      amount_range: '1000万~5000万',
      ocr_precision_before: null,
      ocr_precision_after: 93.2,
      ai_judgment_precision_before: 89.5,
      ai_judgment_precision_after: 91.8,
      sample_count: 165,
      measurement_date: '2024-02-16T09:00:00Z',
      model_version_before: 'v2.1',
      model_version_after: 'v2.2',
    };

    expect(() => calculatePrecisionIndicators(incompleteDataset)).toThrow(/更新前OCR精度/);
  });

  test('SCEN-1166: Should throw error when model versions are missing', () => {
    const incompleteDataset = {
      assessor_id: 'ASSESSOR_006',
      work_type: '機械',
      amount_range: '5000万~1億',
      ocr_precision_before: 90.6,
      ocr_precision_after: 92.9,
      ai_judgment_precision_before: 86.3,
      ai_judgment_precision_after: 88.7,
      sample_count: 195,
      measurement_date: '2024-02-17T14:15:00Z',
      model_version_before: null,
      model_version_after: null,
    };

    expect(() => calculatePrecisionIndicators(incompleteDataset)).toThrow(/モデルバージョン/);
  });

  test('SCEN-1166: Should calculate precision indicators with boundary value sample count', () => {
    const completeDataset = {
      assessor_id: 'ASSESSOR_007',
      work_type: '水道',
      amount_range: '1000万以下',
      ocr_precision_before: 95.2,
      ocr_precision_after: 96.8,
      ai_judgment_precision_before: 93.1,
      ai_judgment_precision_after: 94.5,
      sample_count: 100,
      measurement_date: '2024-02-18T11:45:00Z',
      model_version_before: 'v2.1',
      model_version_after: 'v2.2',
    };

    const result = calculatePrecisionIndicators(completeDataset);

    expect(result.ocr_improvement_rate).toBe(1.6);
    expect(result.ai_judgment_improvement_rate).toBe(1.5);
    expect(result.combined_improvement_rate).toBe(1.55);
    expect(result.visualization_status).toBe('completed');
  });

  test('SCEN-1166: Should throw error when assessor ID is missing', () => {
    const incompleteDataset = {
      assessor_id: null,
      work_type: '通信',
      amount_range: '1000万~5000万',
      ocr_precision_before: 91.4,
      ocr_precision_after: 93.7,
      ai_judgment_precision_before: 88.2,
      ai_judgment_precision_after: 90.6,
      sample_count: 170,
      measurement_date: '2024-02-19T16:20:00Z',
      model_version_before: 'v2.1',
      model_version_after: 'v2.2',
    };

    expect(() => calculatePrecisionIndicators(incompleteDataset)).toThrow(/査定員ID/);
  });

  test('SCEN-1166: Should throw error when work type is missing', () => {
    const incompleteDataset = {
      assessor_id: 'ASSESSOR_008',
      work_type: null,
      amount_range: '1000万~5000万',
      ocr_precision_before: 93.8,
      ocr_precision_after: 95.2,
      ai_judgment_precision_before: 90.5,
      ai_judgment_precision_after: 92.1,
      sample_count: 155,
      measurement_date: '2024-02-20T13:30:00Z',
      model_version_before: 'v2.1',
      model_version_after: 'v2.2',
    };

    expect(() => calculatePrecisionIndicators(incompleteDataset)).toThrow(/工種/);
  });
});