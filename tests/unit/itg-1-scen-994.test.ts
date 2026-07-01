import { detectDuplicateExceptionCase } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-994: [error] 例外ケース検出と手順書への追加判定 - 既に手順書に記載済みの例外ケースが重複として検出される
  test('should detect duplicate exception case and reject adding to manual', () => {
    // 既に手順書に記載済みの例外ケース
    const existingExceptionCases = [
      {
        caseId: 'EXC-001',
        exceptionType: '顧客コード重複エラー',
        description: '顧客マスタに同一の顧客コードが複数登録される場合',
        handlingRule: '新規登録を拒否し、既存顧客の確認を促す',
        addedDate: '2024-01-15T09:30:00Z',
      },
      {
        caseId: 'EXC-002',
        exceptionType: 'サービス種別不正',
        description: 'サービス種別マスタに未登録のサービス種別が入力される場合',
        handlingRule: 'エラーメッセージを表示し、修正を促す',
        addedDate: '2024-01-20T14:20:00Z',
      },
    ];

    // 新規に入力された例外ケース（既存と重複）
    const newExceptionCase = {
      exceptionType: '顧客コード重複エラー',
      description: '顧客マスタに同一の顧客コードが複数登録される場合',
      handlingRule: '新規登録を拒否し、既存顧客の確認を促す',
    };

    // 重複検出を実行
    const result = detectDuplicateExceptionCase(
      newExceptionCase,
      existingExceptionCases
    );

    // 重複として正しく検出されることを確認
    expect(result.isDuplicate).toBe(true);
    expect(result.duplicateMatchedCaseId).toBe('EXC-001');
    expect(result.matchedFields).toEqual([
      'exceptionType',
      'description',
      'handlingRule',
    ]);
    expect(result.allowAddToManual).toBe(false);
    expect(result.message).toMatch(/重複/);
  });
});