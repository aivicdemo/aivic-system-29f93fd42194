import { recordContractChangeAuditLog } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 契約変更監査ログ自動記録', () => {
  // SCEN-1227: [normal] 契約変更監査ログ自動記録機能 - 複数の項目が同時に変更された場合、すべての変更が監査ログに個別記録される
  test('should record 4 individual audit logs when 4 contract fields are changed simultaneously', () => {
    const contractId = 'CONTRACT-20240115-001';
    const userId = 'USER-ADMIN-0001';
    const transactionId = 'TXN-20240115-1445-ABC123';
    const changeTimestamp = '2024-01-15T14:45:00.000Z';

    const contractChangeData = {
      contractId: contractId,
      userId: userId,
      transactionId: transactionId,
      changeTimestamp: changeTimestamp,
      changes: [
        {
          fieldName: '契約金額',
          fieldCode: 'contract_amount',
          oldValue: '1000000',
          newValue: '1200000',
          dataType: 'number',
          unit: '円'
        },
        {
          fieldName: '契約期間開始',
          fieldCode: 'contract_start_date',
          oldValue: '2024-01-01',
          newValue: '2024-02-01',
          dataType: 'date',
          unit: null
        },
        {
          fieldName: '担当者ID',
          fieldCode: 'account_manager_id',
          oldValue: 'STAFF-001',
          newValue: 'STAFF-002',
          dataType: 'string',
          unit: null
        },
        {
          fieldName: '請求頻度',
          fieldCode: 'billing_frequency',
          oldValue: 'monthly',
          newValue: 'quarterly',
          dataType: 'string',
          unit: null
        }
      ]
    };

    const auditLogs = recordContractChangeAuditLog(contractChangeData);

    // ログレコード件数の検証
    expect(auditLogs).toHaveLength(4);

    // 第1件のログ: 契約金額の変更
    expect(auditLogs[0]).toEqual({
      auditLogId: expect.any(String),
      contractId: contractId,
      userId: userId,
      transactionId: transactionId,
      fieldName: '契約金額',
      fieldCode: 'contract_amount',
      oldValue: '1000000',
      newValue: '1200000',
      dataType: 'number',
      unit: '円',
      changeTimestamp: changeTimestamp,
      recordedAt: expect.any(String)
    });

    // 第2件のログ: 契約期間開始の変更
    expect(auditLogs[1]).toEqual({
      auditLogId: expect.any(String),
      contractId: contractId,
      userId: userId,
      transactionId: transactionId,
      fieldName: '契約期間開始',
      fieldCode: 'contract_start_date',
      oldValue: '2024-01-01',
      newValue: '2024-02-01',
      dataType: 'date',
      unit: null,
      changeTimestamp: changeTimestamp,
      recordedAt: expect.any(String)
    });

    // 第3件のログ: 担当者IDの変更
    expect(auditLogs[2]).toEqual({
      auditLogId: expect.any(String),
      contractId: contractId,
      userId: userId,
      transactionId: transactionId,
      fieldName: '担当者ID',
      fieldCode: 'account_manager_id',
      oldValue: 'STAFF-001',
      newValue: 'STAFF-002',
      dataType: 'string',
      unit: null,
      changeTimestamp: changeTimestamp,
      recordedAt: expect.any(String)
    });

    // 第4件のログ: 請求頻度の変更
    expect(auditLogs[3]).toEqual({
      auditLogId: expect.any(String),
      contractId: contractId,
      userId: userId,
      transactionId: transactionId,
      fieldName: '請求頻度',
      fieldCode: 'billing_frequency',
      oldValue: 'monthly',
      newValue: 'quarterly',
      dataType: 'string',
      unit: null,
      changeTimestamp: changeTimestamp,
      recordedAt: expect.any(String)
    });

    // すべてのログが同一トランザクションIDで関連付けられているか検証
    const allTransactionIds = auditLogs.map((log) => log.transactionId);
    expect(new Set(allTransactionIds).size).toBe(1);
    expect(allTransactionIds[0]).toBe(transactionId);

    // すべてのログが同一契約IDで関連付けられているか検証
    const allContractIds = auditLogs.map((log) => log.contractId);
    expect(new Set(allContractIds).size).toBe(1);
    expect(allContractIds[0]).toBe(contractId);

    // すべてのログが同一ユーザーIDで関連付けられているか検証
    const allUserIds = auditLogs.map((log) => log.userId);
    expect(new Set(allUserIds).size).toBe(1);
    expect(allUserIds[0]).toBe(userId);

    // すべてのログのタイムスタンプが同一か、ミリ秒単位で連続しているか検証
    const recordedAtTimestamps = auditLogs.map(
      (log) => new Date(log.recordedAt).getTime()
    );
    const timeDiffs = [];
    for (let i = 1; i < recordedAtTimestamps.length; i++) {
      timeDiffs.push(
        recordedAtTimestamps[i] - recordedAtTimestamps[i - 1]
      );
    }
    // 最大時間差が10ミリ秒以内であることを検証（連続して記録されたことの証）
    const maxTimeDiff = Math.max(...timeDiffs);
    expect(maxTimeDiff).toBeLessThanOrEqual(10);

    // 各監査ログの変更項目名が正確に記録されているか検証
    const recordedFieldNames = auditLogs.map((log) => log.fieldName);
    expect(recordedFieldNames).toEqual([
      '契約金額',
      '契約期間開始',
      '担当者ID',
      '請求頻度'
    ]);

    // 各監査ログの変更前値が正確に記録されているか検証
    const recordedOldValues = auditLogs.map((log) => log.oldValue);
    expect(recordedOldValues).toEqual([
      '1000000',
      '2024-01-01',
      'STAFF-001',
      'monthly'
    ]);

    // 各監査ログの変更後値が正確に記録されているか検証
    const recordedNewValues = auditLogs.map((log) => log.newValue);
    expect(recordedNewValues).toEqual([
      '1200000',
      '2024-02-01',
      'STAFF-002',
      'quarterly'
    ]);
  });
});