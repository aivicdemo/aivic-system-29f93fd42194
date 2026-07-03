import { recordContractChangeNotification } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-845: [normal] 契約変更内容の標準化記録機能 - 契約変更通知の内容が標準化フォーマットで正常に記録される
  test('契約変更通知の内容が標準化フォーマットで正常に記録され、契約変更履歴に表示され、データベースに永続化されること', () => {
    const contractChangeInput = {
      contractId: 'CTR-2024-001',
      customerName: '株式会社ABC',
      changeDateTime: '2024-01-15T10:30:00Z',
      changeContent: {
        beforeValue: '基本料金: 100,000円/月',
        afterValue: '基本料金: 120,000円/月',
        changeReason: '成果報酬基準の改定'
      },
      changedBy: 'user_rep_001',
      recordedAt: '2024-01-15T10:30:00Z'
    };

    const result = recordContractChangeNotification(contractChangeInput);

    expect(result).toEqual({
      recordId: expect.any(String),
      contractId: 'CTR-2024-001',
      customerName: '株式会社ABC',
      changeDateTime: '2024-01-15T10:30:00Z',
      changeContent: {
        beforeValue: '基本料金: 100,000円/月',
        afterValue: '基本料金: 120,000円/月',
        changeReason: '成果報酬基準の改定'
      },
      changedBy: 'user_rep_001',
      recordedAt: '2024-01-15T10:30:00Z',
      status: '記録済み',
      persistedAt: expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/)
    });

    expect(result.recordId).toBeTruthy();
    expect(result.status).toBe('記録済み');
    expect(result.contractId).toBe('CTR-2024-001');
    expect(result.customerName).toBe('株式会社ABC');
    expect(result.changeContent.beforeValue).toBe('基本料金: 100,000円/月');
    expect(result.changeContent.afterValue).toBe('基本料金: 120,000円/月');
    expect(result.changeContent.changeReason).toBe('成果報酬基準の改定');
    expect(result.changedBy).toBe('user_rep_001');
  });
});