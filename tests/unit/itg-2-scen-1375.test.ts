import { analyzeAccuracyDeclineCauses } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1375
  test('精度低下度の測定データが空または不完全な場合に原因特定不可エラーを返す', () => {
    // 必須項目が不完全なデータセット: OCR精度が null
    const incompleteData_missingOcrAccuracy = {
      ocr_accuracy_before: null,
      ocr_accuracy_after: 0.75,
      ai_judgment_accuracy_before: 0.82,
      ai_judgment_accuracy_after: 0.79,
      measurement_date: '2024-01-15T10:00:00Z',
      data_volume: 150,
    };

    expect(() =>
      analyzeAccuracyDeclineCauses(incompleteData_missingOcrAccuracy as any)
    ).toThrow(/測定データ/);

    // 必須項目が不完全なデータセット: AI判定精度が undefined
    const incompleteData_missingAiAccuracy = {
      ocr_accuracy_before: 0.88,
      ocr_accuracy_after: 0.75,
      ai_judgment_accuracy_before: undefined,
      ai_judgment_accuracy_after: 0.79,
      measurement_date: '2024-01-15T10:00:00Z',
      data_volume: 150,
    };

    expect(() =>
      analyzeAccuracyDeclineCauses(incompleteData_missingAiAccuracy as any)
    ).toThrow(/測定データ/);

    // 必須項目が不完全なデータセット: measurement_date が空文字列
    const incompleteData_emptyDate = {
      ocr_accuracy_before: 0.88,
      ocr_accuracy_after: 0.75,
      ai_judgment_accuracy_before: 0.82,
      ai_judgment_accuracy_after: 0.79,
      measurement_date: '',
      data_volume: 150,
    };

    expect(() =>
      analyzeAccuracyDeclineCauses(incompleteData_emptyDate as any)
    ).toThrow(/測定データ/);

    // 必須項目が不完全なデータセット: data_volume が 0 以下
    const incompleteData_invalidVolume = {
      ocr_accuracy_before: 0.88,
      ocr_accuracy_after: 0.75,
      ai_judgment_accuracy_before: 0.82,
      ai_judgment_accuracy_after: 0.79,
      measurement_date: '2024-01-15T10:00:00Z',
      data_volume: 0,
    };

    expect(() =>
      analyzeAccuracyDeclineCauses(incompleteData_invalidVolume as any)
    ).toThrow(/測定データ/);

    // 完全なデータセットの場合: エラーを返さず、原因特定結果を返す
    const completeData = {
      ocr_accuracy_before: 0.88,
      ocr_accuracy_after: 0.75,
      ai_judgment_accuracy_before: 0.82,
      ai_judgment_accuracy_after: 0.79,
      measurement_date: '2024-01-15T10:00:00Z',
      data_volume: 150,
    };

    const result = analyzeAccuracyDeclineCauses(completeData);

    // 原因特定が実行され、結果オブジェクトが返されることを検証
    expect(result).toBeDefined();
    expect(result).toHaveProperty('root_cause_category');
    expect(result).toHaveProperty('customization_scope');
    expect(result).toHaveProperty('error_code');
    expect(result.error_code).toBeNull();

    // OCR精度低下率: (0.88 - 0.75) / 0.88 * 100 = 14.77%
    expect(result).toHaveProperty('ocr_accuracy_decline_rate');
    expect(result.ocr_accuracy_decline_rate).toBeCloseTo(14.77, 1);

    // AI判定精度低下率: (0.82 - 0.79) / 0.82 * 100 = 3.66%
    expect(result).toHaveProperty('ai_judgment_accuracy_decline_rate');
    expect(result.ai_judgment_accuracy_decline_rate).toBeCloseTo(3.66, 1);

    // 原因カテゴリが3つのいずれかであることを検証
    expect(
      ['learning_data_shortage', 'model_drift', 'format_change'].includes(
        result.root_cause_category
      )
    ).toBe(true);

    // カスタマイズ範囲がスコープを保持していることを検証
    expect(result.customization_scope).toMatch(/ocr|logic|data/);
  });
});