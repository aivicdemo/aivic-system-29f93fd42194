import { detectAndNotifyContractChange } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1226
  test('変更前後の値が同一の場合、変更として検知されず、契約変更管理システムへの登録がスキップされる', async () => {
    const fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();
    fetchMock.resetMocks();

    // 入力: 既存データと同一の値を持つ営業データ変更
    const beforeValue = {
      customerId: 'CUST001',
      customerName: '株式会社ABC',
      amount: 150000,
      contractStartDate: '2024-01-01',
      contractEndDate: '2024-12-31',
      serviceType: 'standard'
    };

    const afterValue = {
      customerId: 'CUST001',
      customerName: '株式会社ABC',
      amount: 150000,
      contractStartDate: '2024-01-01',
      contractEndDate: '2024-12-31',
      serviceType: 'standard'
    };

    // 契約変更管理システムへのAPI呼び出しは行われない想定（スキップされる）
    fetchMock.mockResponseOnce(JSON.stringify({ success: true }), { status: 200 });

    const result = await detectAndNotifyContractChange({
      beforeValue,
      afterValue,
      changedBy: 'user_001',
      changedAt: new Date('2024-11-15T10:30:00Z')
    });

    // 期待結果: 変更検知されない（isChanged === false）
    expect(result.isChanged).toBe(false);

    // 期待結果: 契約変更管理システムへの登録がスキップ（registeredToContractSystem === false）
    expect(result.registeredToContractSystem).toBe(false);

    // 期待結果: 通知が送信されない（notificationSent === false）
    expect(result.notificationSent).toBe(false);

    // 期待結果: 変更検知ログに「変更なし」の判定が記録される
    expect(result.detectionLog).toEqual(
      expect.objectContaining({
        status: '変更なし',
        beforeData: beforeValue,
        afterData: afterValue,
        timestamp: new Date('2024-11-15T10:30:00Z')
      })
    );

    // 契約変更管理システムへのAPI呼び出しが行われないことを確認
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/contract-change-management/register'),
      expect.anything()
    );

    // 通知API呼び出しが行われないことを確認
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications/send'),
      expect.anything()
    );
  });
});