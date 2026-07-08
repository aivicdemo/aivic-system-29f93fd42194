import { validateAIJudgmentAccuracy } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  test('SCEN-1421: AI判定精度が合格基準を下回る場合に不合格判定が返される', () => {
    // Arrange: テスト入力データ
    const accuracyScore = 59; // 合格基準（60%）未満の精度値
    const passingThreshold = 60; // 合格基準 60%
    const judgmentInput = {
      ocrAccuracy: accuracyScore,
      passingStandard: passingThreshold,
      judgeId: 'JUDGE_001',
      caseId: 'CASE_20240115_001',
      timestamp: new Date('2024-01-15T11:00:00Z').toISOString(),
    };

    // Act: 判定処理を実行
    const result = validateAIJudgmentAccuracy(judgmentInput);

    // Assert: 不合格判定の確認
    expect(result.status).toBe('不合格');
    expect(result.score).toBe(59);
    expect(result.passingThreshold).toBe(60);
    expect(result.judgmentResult).toBeDefined();
    expect(result.judgmentResult).not.toBeNull();
    
    // 不合格の理由またはエラーコードが含まれていることを確認
    expect(result.reason).toBeDefined();
    expect(result.reason.length).toBeGreaterThan(0);
    
    // エラーコードが含まれていることを確認
    expect(result.errorCode).toBeDefined();
    expect(result.errorCode).toBe('AI_ACCURACY_BELOW_THRESHOLD');
    
    // 処理が終了状態であることを確認（次のステップに進まない）
    expect(result.isProcessingComplete).toBe(true);
    expect(result.canProceedToNextStep).toBe(false);

    // 詳細情報の検証
    expect(result.deficitAmount).toBe(accuracyScore - passingThreshold);
    expect(result.deficitPercentage).toBe(1); // (59-60)/60 = -1.67% → 小数第2位四捨五入後 -1%
    expect(result.judgmentTimestamp).toBe('2024-01-15T11:00:00Z');
    expect(result.judgeId).toBe('JUDGE_001');
    expect(result.caseId).toBe('CASE_20240115_001');
  });
});