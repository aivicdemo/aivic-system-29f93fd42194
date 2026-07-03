import { recordExceptionCase } from '../../src/logic/it-1781935279444-2-2-1';

describe('月次業務例外ケース記録機能 - 重複判定と統合指示', () => {
  test('SCEN-910: 複数の重複した例外ケースが記録されようとした場合、重複判定と統合指示を返す', () => {
    // 1件目の例外ケース：成功することを確認
    const firstExceptionCase = {
      customerId: 'C001',
      billingMonth: '2024-01',
      exceptionCategory: '請求金額不一致',
      details: '計算ロジック誤り - アポ数カウント誤算',
      recordedAt: '2024-01-15T10:00:00Z',
      recordedBy: 'USER_001',
    };

    const firstResult = recordExceptionCase(firstExceptionCase);
    expect(firstResult.status).toBe('success');
    expect(firstResult.recordId).toBeDefined();
    expect(firstResult.duplicateDetected).toBe(false);
    expect(typeof firstResult.recordId).toBe('string');
    const firstRecordId = firstResult.recordId;

    // 2件目の例外ケース：1件目と同一キー条件だが詳細情報が異なる
    const secondExceptionCase = {
      customerId: 'C001',
      billingMonth: '2024-01',
      exceptionCategory: '請求金額不一致',
      details: '割引ルール適用誤り',
      recordedAt: '2024-01-15T11:30:00Z',
      recordedBy: 'USER_002',
    };

    const secondResult = recordExceptionCase(secondExceptionCase);
    expect(secondResult.status).toBe('conflict');
    expect(secondResult.duplicateDetected).toBe(true);
    expect(secondResult.httpStatusCode).toBe(409);
    expect(secondResult.conflictingRecordIds).toContain(firstRecordId);
    expect(secondResult.conflictingRecordIds.length).toBe(1);
    expect(secondResult.mergeOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: '統合',
          description: expect.any(String),
        }),
        expect.objectContaining({
          action: '上書き',
          description: expect.any(String),
        }),
        expect.objectContaining({
          action: '既存レコード保持',
          description: expect.any(String),
        }),
      ])
    );
    expect(secondResult.recommendedAction).toBe('統合が必要');

    // 3件目の例外ケース：同一キー条件、複数重複検出を検証
    const thirdExceptionCase = {
      customerId: 'C001',
      billingMonth: '2024-01',
      exceptionCategory: '請求金額不一致',
      details: '成約数カウント漏れ',
      recordedAt: '2024-01-15T12:45:00Z',
      recordedBy: 'USER_003',
    };

    const thirdResult = recordExceptionCase(thirdExceptionCase);
    expect(thirdResult.status).toBe('conflict');
    expect(thirdResult.duplicateDetected).toBe(true);
    expect(thirdResult.httpStatusCode).toBe(409);
    expect(thirdResult.conflictingRecordIds.length).toBe(2);
    expect(thirdResult.conflictingRecordIds).toContain(firstRecordId);
    expect(thirdResult.mergeOptions.length).toBe(3);
    expect(thirdResult.mergeOptions[0].action).toBe('統合');
    expect(thirdResult.mergeOptions[1].action).toBe('上書き');
    expect(thirdResult.mergeOptions[2].action).toBe('既存レコード保持');
    expect(thirdResult.recommendedAction).toMatch(/統合が必要|複数重複検出/);

    // 統合指示メッセージの形式検証
    expect(thirdResult).toHaveProperty('mergeInstructionMessage');
    expect(typeof thirdResult.mergeInstructionMessage).toBe('string');
    expect(thirdResult.mergeInstructionMessage.length).toBeGreaterThan(0);
    expect(thirdResult.mergeInstructionMessage).toMatch(/衝突/);

    // 重複判定ロジックの検証：異なるキー条件は重複と判定しない
    const differentCustomerCase = {
      customerId: 'C002',
      billingMonth: '2024-01',
      exceptionCategory: '請求金額不一致',
      details: '異なる顧客',
      recordedAt: '2024-01-15T13:00:00Z',
      recordedBy: 'USER_004',
    };

    const differentCustomerResult = recordExceptionCase(differentCustomerCase);
    expect(differentCustomerResult.status).toBe('success');
    expect(differentCustomerResult.duplicateDetected).toBe(false);

    const differentMonthCase = {
      customerId: 'C001',
      billingMonth: '2024-02',
      exceptionCategory: '請求金額不一致',
      details: '異なる請求月',
      recordedAt: '2024-02-15T13:00:00Z',
      recordedBy: 'USER_004',
    };

    const differentMonthResult = recordExceptionCase(differentMonthCase);
    expect(differentMonthResult.status).toBe('success');
    expect(differentMonthResult.duplicateDetected).toBe(false);

    const differentCategoryCase = {
      customerId: 'C001',
      billingMonth: '2024-01',
      exceptionCategory: '納期遅延',
      details: '異なる区分',
      recordedAt: '2024-01-15T13:00:00Z',
      recordedBy: 'USER_004',
    };

    const differentCategoryResult = recordExceptionCase(differentCategoryCase);
    expect(differentCategoryResult.status).toBe('success');
    expect(differentCategoryResult.duplicateDetected).toBe(false);
  });
});