import { detectLearningDataUpdateTrigger } from '../../src/logic/it-6-2-2-1';

describe('学習データ更新トリガー自動判定機能', () => {
  // SCEN-1125
  test('メタデータが欠落している場合にエラーを返す', () => {
    // 必須メタデータ: datasetVersion, lastUpdatedAt, modelAccuracyScore
    
    // Case 1: datasetVersion 欠落
    const request_missing_version = {
      lastUpdatedAt: '2024-01-15T10:00:00Z',
      modelAccuracyScore: 0.87,
      ocrAccuracyTrend: -0.03,
      judgmentAccuracyTrend: -0.02,
    };
    
    expect(() => {
      detectLearningDataUpdateTrigger(request_missing_version as any);
    }).toThrow(/データセット版番号|メタデータが不完全|必須項目が不足/);

    // Case 2: lastUpdatedAt 欠落
    const request_missing_update_date = {
      datasetVersion: 3,
      modelAccuracyScore: 0.87,
      ocrAccuracyTrend: -0.03,
      judgmentAccuracyTrend: -0.02,
    };
    
    expect(() => {
      detectLearningDataUpdateTrigger(request_missing_update_date as any);
    }).toThrow(/最終更新日時|メタデータが不完全|必須項目が不足/);

    // Case 3: modelAccuracyScore 欠落
    const request_missing_accuracy = {
      datasetVersion: 3,
      lastUpdatedAt: '2024-01-15T10:00:00Z',
      ocrAccuracyTrend: -0.03,
      judgmentAccuracyTrend: -0.02,
    };
    
    expect(() => {
      detectLearningDataUpdateTrigger(request_missing_accuracy as any);
    }).toThrow(/モデル精度スコア|メタデータが不完全|必須項目が不足/);

    // Case 4: 複数メタデータ欠落
    const request_missing_multiple = {
      datasetVersion: 3,
      ocrAccuracyTrend: -0.03,
    };
    
    expect(() => {
      detectLearningDataUpdateTrigger(request_missing_multiple as any);
    }).toThrow(/メタデータが不完全|必須項目が不足/);

    // Case 5: 空オブジェクト
    const request_empty = {};
    
    expect(() => {
      detectLearningDataUpdateTrigger(request_empty as any);
    }).toThrow(/メタデータが不完全|必須項目が不足/);

    // Case 6: null リクエスト
    expect(() => {
      detectLearningDataUpdateTrigger(null as any);
    }).toThrow(/メタデータが不完全|必須項目が不足/);

    // Case 7: undefined リクエスト
    expect(() => {
      detectLearningDataUpdateTrigger(undefined as any);
    }).toThrow(/メタデータが不完全|必須項目が不足/);

    // Case 8: 正常系（メタデータ完全） - エラーが発生しないことを確認
    const request_valid = {
      datasetVersion: 3,
      lastUpdatedAt: '2024-01-15T10:00:00Z',
      modelAccuracyScore: 0.87,
      ocrAccuracyTrend: -0.03,
      judgmentAccuracyTrend: -0.02,
    };
    
    const result = detectLearningDataUpdateTrigger(request_valid);
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('triggerDetected');
    expect(typeof result.triggerDetected).toBe('boolean');
  });
});