import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { checkSLAExceedanceAndNotify } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - SLA監視', () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-783: [normal] 資料リリース通知から確認完了までのSLA監視機能
  test('SLA超過時に代表ユーザーに遅延アラートが正常に送信される', async () => {
    // テストデータ：資料リリース通知
    const notificationId = 'notif_20240115_001';
    const documentId = 'doc_contract_2024_001';
    const documentName = '基本契約書_2024年版';
    const customerId = 'cust_abc123';
    const customerName = '株式会社テスト';
    
    // 通知送信時刻（固定値）
    const notificationSentAt = new Date('2024-01-15T09:00:00Z');
    
    // SLA設定：24時間以内に確認完了が必須
    const slaHours = 24;
    
    // SLA超過をシミュレート：通知から26時間経過
    const currentTime = new Date('2024-01-16T11:00:00Z');
    const elapsedMs = currentTime.getTime() - notificationSentAt.getTime();
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    const exceedanceHours = elapsedHours - slaHours; // 2時間超過
    
    // SLA超過判定：経過時間がSLA制限時間を超過
    const isExceeded = elapsedHours > slaHours;
    expect(isExceeded).toBe(true);
    expect(exceedanceHours).toBe(2);
    
    // 代表ユーザー情報
    const adminUserId = 'user_admin_001';
    const adminEmail = 'admin@company.example.com';
    
    // API モック：アラート送信エンドポイント
    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        alertId: 'alert_20240116_sla_001',
        sentAt: '2024-01-16T11:00:00Z',
      }),
      { status: 200 }
    );
    
    // SLA監視機能を実行
    const alertResult = await checkSLAExceedanceAndNotify({
      notificationId: notificationId,
      documentId: documentId,
      documentName: documentName,
      customerId: customerId,
      customerName: customerName,
      notificationSentAt: notificationSentAt.toISOString(),
      currentTime: currentTime.toISOString(),
      slaHours: slaHours,
      adminUserId: adminUserId,
      adminEmail: adminEmail,
    });
    
    // 戻り値の構造を検証
    expect(alertResult).toEqual({
      isExceeded: true,
      notificationId: notificationId,
      exceedanceHours: 2,
      documentInfo: {
        documentId: documentId,
        documentName: documentName,
      },
      customerInfo: {
        customerId: customerId,
        customerName: customerName,
      },
      alertId: 'alert_20240116_sla_001',
      alertSentAt: '2024-01-16T11:00:00Z',
      adminUserId: adminUserId,
      adminEmail: adminEmail,
    });
    
    // API呼び出しが正確に実行されたことを検証
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toMatch(/\/api\/alert\/send/);
    expect(callArgs[1].method).toBe('POST');
    
    // リクエストボディの内容を検証
    const requestBody = JSON.parse(callArgs[1].body);
    expect(requestBody.notificationId).toBe(notificationId);
    expect(requestBody.exceedanceHours).toBe(2);
    expect(requestBody.documentName).toBe(documentName);
    expect(requestBody.customerName).toBe(customerName);
    expect(requestBody.adminEmail).toBe(adminEmail);
    
    // アラート内容が必須情報をすべて含んでいることを検証
    expect(alertResult.alertId).toBeDefined();
    expect(alertResult.alertSentAt).toBeDefined();
    expect(alertResult.notificationId).toBe(notificationId);
    expect(alertResult.exceedanceHours).toBe(2);
    expect(alertResult.documentInfo.documentName).toBe(documentName);
    expect(alertResult.customerInfo.customerName).toBe(customerName);
  });
});