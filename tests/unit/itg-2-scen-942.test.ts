import { validateJudgmentCriteriaAndLearningDataIntegrity } from '../../src/logic/it-6-2-2-1';

describe('判定基準・学習データ整合性検証機能', () => {
  test('SCEN-942: 学習データが空の状態で整合性検証を実行した場合、警告が発生する', () => {
    // Arrange: 学習データが空の状態で整合性検証の入力を準備
    const input = {
      pastProjectData: [],
      priceBookData: [],
      judgmentCriteriaId: 'criteria-001',
      executedAt: new Date('2024-01-15T11:00:00Z'),
      executorId: 'assessor-001'
    };

    // Act: 整合性検証を実行
    const result = validateJudgmentCriteriaAndLearningDataIntegrity(input);

    // Assert: 学習データが空であることを検出し、警告メッセージが返される
    expect(result.isValid).toBe(false);
    expect(result.warning).toBe('学習データが登録されていません');
    expect(result.errorCode).toBe('LEARNING_DATA_EMPTY');
    expect(result.processAborted).toBe(true);
    expect(result.timestamp).toEqual(new Date('2024-01-15T11:00:00Z'));
    expect(result.loggedAt).toBeDefined();

    // Assert: 過去案件データが空の場合のエラー検出
    expect(() =>
      validateJudgmentCriteriaAndLearningDataIntegrity({
        pastProjectData: [],
        priceBookData: [{ id: 'pb-001', itemName: '鉄筋', unitPrice: 100 }],
        judgmentCriteriaId: 'criteria-001',
        executedAt: new Date('2024-01-15T11:00:00Z'),
        executorId: 'assessor-001'
      })
    ).toThrow(/学習データ/);

    // Assert: 物価本データが空の場合のエラー検出
    expect(() =>
      validateJudgmentCriteriaAndLearningDataIntegrity({
        pastProjectData: [{ id: 'proj-001', amount: 5000000, region: '東京' }],
        priceBookData: [],
        judgmentCriteriaId: 'criteria-001',
        executedAt: new Date('2024-01-15T11:00:00Z'),
        executorId: 'assessor-001'
      })
    ).toThrow(/学習データ/);

    // Assert: 整合性検証処理が中断されていることを確認
    expect(result.processAborted).toBe(true);

    // Assert: エラーコードとタイムスタンプがログに記録されることを確認
    expect(result.errorCode).toBeDefined();
    expect(result.timestamp).toBeDefined();
    expect(typeof result.errorCode).toBe('string');
    expect(result.errorCode.length).toBeGreaterThan(0);
  });
});