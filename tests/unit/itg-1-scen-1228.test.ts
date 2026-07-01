import { detectAndNotifySalesDataChange } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-1228: [edge] 営業データ変更の自動検知・通知機能 - 通知先の顧客企業情報が登録されていない場合、通知準備がスキップされ警告ログが記録される
  test('should skip notification preparation and log WARNING when customer enterprise info is missing', () => {
    const salesDataChange = {
      salesDataId: 'SD-20240115-001',
      customerId: 'CUST-999',
      changeType: 'AMOUNT_UPDATE',
      previousAmount: 50000,
      newAmount: 75000,
      changedAt: new Date('2024-01-15T11:00:00Z'),
      changedBy: 'operator-001',
    };

    const customerEnterpriseRegistry = {
      'CUST-001': {
        customerId: 'CUST-001',
        enterpriseName: 'Customer A Inc.',
        contactEmail: 'contact@customera.co.jp',
        isActive: true,
      },
      'CUST-002': {
        customerId: 'CUST-002',
        enterpriseName: 'Customer B Corp.',
        contactEmail: 'contact@customerb.co.jp',
        isActive: true,
      },
    };

    const mockLogs: { level: string; message: string; timestamp: Date }[] = [];
    const mockSalesDataStorage: typeof salesDataChange[] = [];

    const logCapture = (level: string, message: string) => {
      mockLogs.push({
        level,
        message,
        timestamp: new Date('2024-01-15T11:00:00Z'),
      });
    };

    const saveData = (data: typeof salesDataChange) => {
      mockSalesDataStorage.push(data);
    };

    const result = detectAndNotifySalesDataChange({
      salesDataChange,
      customerEnterpriseRegistry,
      onLog: logCapture,
      onSave: saveData,
    });

    // 1) 通知準備処理がスキップされ、メール送信などの通知処理が実行されない
    expect(result.notificationSkipped).toBe(true);
    expect(result.emailSent).toBe(false);
    expect(result.notificationAttempted).toBe(false);

    // 2) システムログに警告レベルのログが記録される
    const warningLogs = mockLogs.filter((log) => log.level === 'WARNING');
    expect(warningLogs.length).toBeGreaterThan(0);

    // 3) ログメッセージに通知先顧客企業未登録の原因が明記される
    const relevantWarning = warningLogs.find(
      (log) =>
        log.message.includes('通知先') &&
        (log.message.includes('未登録') ||
          log.message.includes('登録されていない') ||
          log.message.includes('CUST-999'))
    );
    expect(relevantWarning).toBeDefined();
    expect(relevantWarning?.message).toMatch(/CUST-999|未登録|登録されていない/);

    // 4) 営業データ自体は正常に保存される
    expect(mockSalesDataStorage.length).toBe(1);
    expect(mockSalesDataStorage[0].salesDataId).toBe('SD-20240115-001');
    expect(mockSalesDataStorage[0].newAmount).toBe(75000);
    expect(mockSalesDataStorage[0].customerId).toBe('CUST-999');

    // 5) システムエラーや例外は発生しない
    expect(result.hasError).toBe(false);
    expect(result.exceptionOccurred).toBe(false);
    expect(result.salesDataPersisted).toBe(true);
  });
});