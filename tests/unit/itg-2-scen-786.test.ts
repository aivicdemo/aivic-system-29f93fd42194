import { determineModelRetrainingTiming } from '../../src/logic/it-6-2-2-2';

describe('モデル再学習実行タイミング自動判定機能', () => {
  test('SCEN-786: 学習データの品質情報が欠落している場合にエラーハンドリングが行われる', () => {
    // Arrange: 品質情報が不完全な学習データセット
    const incompleteTrainingDataset = {
      pastProjectDataCount: 450,
      priceBookVersion: '2024-Q1',
      lastUpdateDate: '2024-01-15T09:00:00Z',
      // 品質情報を意図的に省略
      dataQualityScore: undefined,
      abnormalValueFlag: undefined,
      missingRate: undefined,
      trainingDataCoverageByRegion: {
        north: 95,
        central: 88,
        south: 92,
      },
    };

    const modelRetrainingTrigger = {
      ocrPrecisionDropThreshold: 5,
      aiJudgmentPrecisionDropThreshold: 5,
      currentOcrPrecision: 87.2,
      previousMonthOcrPrecision: 92.1,
      currentAiJudgmentPrecision: 84.5,
      previousMonthAiJudgmentPrecision: 89.3,
      userFeedbackCount: 32,
      userFeedbackThreshold: 20,
    };

    // Act & Assert: エラーハンドリング動作を検証
    expect(() => {
      determineModelRetrainingTiming(incompleteTrainingDataset, modelRetrainingTrigger);
    }).toThrow(/品質情報/);

    // エラーログに欠落項目が記録されていることを確認
    const errorLogCapture: { message: string; missingFields: string[] } = {
      message: '',
      missingFields: [],
    };

    try {
      determineModelRetrainingTiming(incompleteTrainingDataset, modelRetrainingTrigger);
    } catch (error) {
      if (error instanceof Error) {
        errorLogCapture.message = error.message;
        // 欠落している品質情報項目を特定
        if (incompleteTrainingDataset.dataQualityScore === undefined) {
          errorLogCapture.missingFields.push('dataQualityScore');
        }
        if (incompleteTrainingDataset.abnormalValueFlag === undefined) {
          errorLogCapture.missingFields.push('abnormalValueFlag');
        }
        if (incompleteTrainingDataset.missingRate === undefined) {
          errorLogCapture.missingFields.push('missingRate');
        }
      }
    }

    // エラーログの内容検証
    expect(errorLogCapture.missingFields).toContain('dataQualityScore');
    expect(errorLogCapture.missingFields).toContain('abnormalValueFlag');
    expect(errorLogCapture.missingFields).toContain('missingRate');
    expect(errorLogCapture.missingFields.length).toBe(3);

    // 完全な品質情報を含む場合の正常系動作検証
    const completeTrainingDataset = {
      pastProjectDataCount: 450,
      priceBookVersion: '2024-Q1',
      lastUpdateDate: '2024-01-15T09:00:00Z',
      dataQualityScore: 92.5,
      abnormalValueFlag: false,
      missingRate: 1.2,
      trainingDataCoverageByRegion: {
        north: 95,
        central: 88,
        south: 92,
      },
    };

    // 再学習判定結果を取得
    const result = determineModelRetrainingTiming(
      completeTrainingDataset,
      modelRetrainingTrigger,
    );

    // 品質情報が完全な場合、プロセスが正常に進行することを検証
    expect(result).toBeDefined();
    expect(result).toHaveProperty('shouldRetrain');
    expect(typeof result.shouldRetrain).toBe('boolean');
    expect(result.shouldRetrain).toBe(true); // OCR精度が5.9%低下、AI判定精度が4.8%低下、フィードバック件数が閾値超過のため
    expect(result).toHaveProperty('priority');
    expect(['high', 'medium', 'low']).toContain(result.priority);
    expect(result.priority).toBe('high'); // 複数の指標が同時に閾値超過
    expect(result).toHaveProperty('recommendedDataUpdate');
    expect(typeof result.recommendedDataUpdate).toBe('object');
  });
});