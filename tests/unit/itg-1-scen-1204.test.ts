import { describe, test, expect, beforeEach } from '@jest/globals';
import { generateAndQueueChangeNotificationEmail } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ変更内容メール自動生成・送信キュー追加', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1204
  test('有効なメールアドレスが紐付いている場合、変更内容を含むメールが生成され送信キューに追加される', () => {
    // Arrange
    const userId = 'user-001';
    const userEmail = 'sales-manager@customer.example.jp';
    const userName = '営業責任者';
    
    const contractId = 'contract-001';
    const customerId = 'customer-001';
    const customerName = '顧客A企業';
    
    const changeType = 'PRICE_UPDATE';
    const previousValue = 100000;
    const newValue = 120000;
    const changeReason = '成約数増加に伴う契約額改定';
    const changeTimestamp = '2024-01-15T10:30:00Z';
    const changerUserId = 'operator-001';
    const changerName = '営業オペレーター';
    
    const input = {
      userId,
      userEmail,
      userName,
      contractId,
      customerId,
      customerName,
      changeType,
      previousValue,
      newValue,
      changeReason,
      changeTimestamp,
      changerUserId,
      changerName,
    };

    // Act
    const result = generateAndQueueChangeNotificationEmail(input);

    // Assert - メール生成の成功
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    
    // メールオブジェクトの構造と内容検証
    expect(result.emailQueued).toBeDefined();
    expect(result.emailQueued.toAddress).toBe(userEmail);
    expect(result.emailQueued.recipientName).toBe(userName);
    expect(result.emailQueued.contractId).toBe(contractId);
    expect(result.emailQueued.customerId).toBe(customerId);
    
    // メール件名に変更内容の要約が含まれていることを確認
    expect(result.emailQueued.subject).toMatch(/契約内容変更通知/);
    expect(result.emailQueued.subject).toMatch(/顧客A企業/);
    
    // メール本文に変更前後の値が含まれていることを検証
    expect(result.emailQueued.body).toMatch(/100000/);
    expect(result.emailQueued.body).toMatch(/120000/);
    expect(result.emailQueued.body).toMatch(/成約数増加に伴う契約額改定/);
    
    // メール本文に変更日時が含まれていることを検証
    expect(result.emailQueued.body).toMatch(/2024-01-15/);
    expect(result.emailQueued.body).toMatch(/10:30/);
    
    // メール本文に変更者情報が含まれていることを検証
    expect(result.emailQueued.body).toMatch(/営業オペレーター/);
    
    // 送信キューのステータスが「待機中」であることを確認
    expect(result.emailQueued.queueStatus).toBe('PENDING');
    expect(result.emailQueued.queuedAt).toBe(changeTimestamp);
    
    // 送信キューのメールアドレスが正しいことを検証
    expect(result.emailQueued.toAddress).toBe(userEmail);
    
    // メール内容の詳細情報が構造化されて格納されていることを確認
    expect(result.emailQueued.changeDetails).toBeDefined();
    expect(result.emailQueued.changeDetails.changeType).toBe('PRICE_UPDATE');
    expect(result.emailQueued.changeDetails.previousValue).toBe(100000);
    expect(result.emailQueued.changeDetails.newValue).toBe(120000);
    expect(result.emailQueued.changeDetails.reason).toBe(changeReason);
    
    // 送信キューの初期ステータスが管理されていることを確認
    expect(result.queueId).toBeDefined();
    expect(result.queueId).toMatch(/^queue-/);
  });
});