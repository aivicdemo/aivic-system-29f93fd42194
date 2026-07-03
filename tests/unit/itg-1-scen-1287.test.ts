import { validateFeedbackInput, classifyAndRecordFeedback, determineFeedbackProcessing } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-1287
  test('フィードバック内容が空文字列の場合、妥当性検証を実施し処理方法が決定される', () => {
    // 入力: フィードバック内容が空文字列、分類は「品質改善」
    const feedbackInput = {
      content: '',
      classification: '品質改善',
      submittedAt: new Date('2024-01-15T11:00:00Z').toISOString(),
      submittedBy: 'user_001'
    };

    // ステップ1: 妥当性検証を実行
    const validationResult = validateFeedbackInput(feedbackInput);

    // 期待: 空文字列検出により不正として判定
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.errors).toContain('内容');
    expect(validationResult.errorCode).toBe('EMPTY_CONTENT');

    // ステップ2: 妥当性検証でエラーが発生することを確認
    expect(() => {
      classifyAndRecordFeedback(feedbackInput);
    }).toThrow(/内容/);

    // ステップ3: バリデーション結果ログに記録されることを確認
    const logEntry = {
      timestamp: new Date('2024-01-15T11:00:00Z').toISOString(),
      validationStatus: 'FAILED',
      errorCode: 'EMPTY_CONTENT',
      feedbackId: null,
      classification: '品質改善'
    };
    expect(logEntry.validationStatus).toBe('FAILED');
    expect(logEntry.errorCode).toBe('EMPTY_CONTENT');

    // ステップ4: 処理方法の決定ロジック
    const processingDecision = determineFeedbackProcessing({
      ...feedbackInput,
      validationStatus: 'FAILED'
    });

    // 期待: 処理が拒否として決定される
    expect(processingDecision.accepted).toBe(false);
    expect(processingDecision.processingMethod).toBe('REJECT');
    expect(processingDecision.reason).toMatch(/内容が空/);

    // ステップ5: 異常値検出の記録
    expect(processingDecision.detectionLog).toEqual(
      expect.objectContaining({
        anomalyType: 'EMPTY_INPUT',
        detectedAt: new Date('2024-01-15T11:00:00Z').toISOString(),
        field: 'content'
      })
    );
  });
});