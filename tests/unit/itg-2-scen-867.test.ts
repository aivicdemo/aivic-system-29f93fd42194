import { detectAndCorrectOCRQualityDegradation } from '../../src/logic/it-1-br-6-2-1';

describe('OCR精度低下検知・補正機能', () => {
  // SCEN-867
  test('不完全な精度低下データが入力された場合、エラーを返し補正処理を実行しない', () => {
    // 不完全なデータ：必須フィールド欠落パターン
    const incompleteDataMissingOCRAccuracy = {
      evaluationDatetime: '2024-01-15T09:00:00Z',
      // ocr_accuracy: 欠落
      aiJudgmentAccuracy: 78.5,
      feedbackCount: 12,
      learningDataUpdateStatus: 'pending'
    };

    const incompleteDataMissingAIAccuracy = {
      evaluationDatetime: '2024-01-15T09:00:00Z',
      ocrAccuracy: 72.3,
      // aiJudgmentAccuracy: 欠落
      feedbackCount: 12,
      learningDataUpdateStatus: 'pending'
    };

    const incompleteDataMissingEvaluationDatetime = {
      // evaluationDatetime: 欠落
      ocrAccuracy: 72.3,
      aiJudgmentAccuracy: 78.5,
      feedbackCount: 12,
      learningDataUpdateStatus: 'pending'
    };

    const incompleteDataMissingFeedbackCount = {
      evaluationDatetime: '2024-01-15T09:00:00Z',
      ocrAccuracy: 72.3,
      aiJudgmentAccuracy: 78.5,
      // feedbackCount: 欠落
      learningDataUpdateStatus: 'pending'
    };

    // パターン1: ocrAccuracy 欠落時
    expect(() =>
      detectAndCorrectOCRQualityDegradation(incompleteDataMissingOCRAccuracy as any)
    ).toThrow(/ocrAccuracy|必須フィールド/);

    // パターン2: aiJudgmentAccuracy 欠落時
    expect(() =>
      detectAndCorrectOCRQualityDegradation(incompleteDataMissingAIAccuracy as any)
    ).toThrow(/aiJudgmentAccuracy|必須フィールド/);

    // パターン3: evaluationDatetime 欠落時
    expect(() =>
      detectAndCorrectOCRQualityDegradation(incompleteDataMissingEvaluationDatetime as any)
    ).toThrow(/evaluationDatetime|必須フィールド/);

    // パターン4: feedbackCount 欠落時
    expect(() =>
      detectAndCorrectOCRQualityDegradation(incompleteDataMissingFeedbackCount as any)
    ).toThrow(/feedbackCount|必須フィールド/);

    // 補正処理が実行されていないことを検証
    // 入力されたデータがそのまま返却されない（エラーが発生する）
    const incompleteData = {
      evaluationDatetime: '2024-01-15T09:00:00Z',
      ocrAccuracy: 72.3,
      // aiJudgmentAccuracy: 欠落
      feedbackCount: 12,
      learningDataUpdateStatus: 'pending'
    };

    let errorThrown = false;
    let thrownError: Error | null = null;

    try {
      detectAndCorrectOCRQualityDegradation(incompleteData as any);
    } catch (error) {
      errorThrown = true;
      thrownError = error as Error;
    }

    // エラーが投げられたことを確認
    expect(errorThrown).toBe(true);
    // エラーメッセージが空でないこと
    expect(thrownError?.message).toBeTruthy();
    // エラーメッセージが必須フィールド関連のキーワードを含むこと
    expect(thrownError?.message).toMatch(
      /必須フィールド|aiJudgmentAccuracy|フィールド|必須/i
    );
  });
});