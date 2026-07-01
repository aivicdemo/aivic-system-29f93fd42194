import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  recordAuditLog,
  retrieveAuditLogsByTimestamp,
  validateAuditLogSequence
} from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの変更履歴・監査ログ自動記録機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1257
  test('同一ミリ秒での複数変更時に各変更が一意に識別され記録される', () => {
    const customerId = 'CUST-20250131-001';
    const userId = 'USER-ADMIN-001';
    const fixedTimestamp = new Date('2025-01-31T09:30:15.500Z');
    const timestampMs = fixedTimestamp.getTime();

    // テストデータ: 同一ミリ秒内に実行される複数の異なるフィールド変更
    const changes = [
      {
        fieldName: 'customer_name',
        oldValue: '山田太郎商事',
        newValue: '山田太郎商事改'
      },
      {
        fieldName: 'email_address',
        oldValue: 'old@example.com',
        newValue: 'new@example.com'
      },
      {
        fieldName: 'phone_number',
        oldValue: '03-1234-5678',
        newValue: '03-1234-5679'
      }
    ];

    // 複数の変更を同一ミリ秒内に連続実行し、各ログエントリを記録
    const auditLogEntries = changes.map((change, index) => {
      const logEntry = recordAuditLog({
        customerId,
        userId,
        timestampMs,
        sequenceNumber: index + 1,
        fieldName: change.fieldName,
        oldValue: change.oldValue,
        newValue: change.newValue,
        changeType: 'UPDATE',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 Test'
      });
      return logEntry;
    });

    // 実行後、監査ログデータベースから該当するすべてのログエントリを取得
    const retrievedLogs = retrieveAuditLogsByTimestamp({
      customerId,
      timestampMs,
      endTimestampMs: timestampMs + 1
    });

    // 検証1: 3件のログエントリがすべて記録されている（漏落がない）
    expect(auditLogEntries).toHaveLength(3);
    expect(retrievedLogs).toHaveLength(3);

    // 検証2: 各ログエントリに一意のIDまたはシーケンス番号が付与されている
    const auditLogIds = auditLogEntries.map((log) => log.auditLogId);
    const uniqueIds = new Set(auditLogIds);
    expect(uniqueIds.size).toBe(3); // すべてのIDが一意

    const sequenceNumbers = auditLogEntries.map((log) => log.sequenceNumber);
    expect(sequenceNumbers).toEqual([1, 2, 3]); // シーケンス番号が正確に付与

    // 検証3: 各ログエントリのタイムスタンプが同じミリ秒であることを確認
    auditLogEntries.forEach((log) => {
      expect(log.timestampMs).toBe(timestampMs);
    });

    // 検証4: 各ログエントリの変更内容（フィールド名、変更前後の値）が正確に記録されている
    expect(auditLogEntries[0]).toMatchObject({
      fieldName: 'customer_name',
      oldValue: '山田太郎商事',
      newValue: '山田太郎商事改',
      changeType: 'UPDATE'
    });
    expect(auditLogEntries[1]).toMatchObject({
      fieldName: 'email_address',
      oldValue: 'old@example.com',
      newValue: 'new@example.com',
      changeType: 'UPDATE'
    });
    expect(auditLogEntries[2]).toMatchObject({
      fieldName: 'phone_number',
      oldValue: '03-1234-5678',
      newValue: '03-1234-5679',
      changeType: 'UPDATE'
    });

    // 検証5: ログエントリの順序が変更の実行順序と一致している
    expect(retrievedLogs.map((log) => log.fieldName)).toEqual([
      'customer_name',
      'email_address',
      'phone_number'
    ]);
    expect(retrievedLogs.map((log) => log.sequenceNumber)).toEqual([1, 2, 3]);

    // 検証6: 同一ユーザーによる同一ミリ秒での複数変更がすべて正しく区別されている
    auditLogEntries.forEach((log) => {
      expect(log.customerId).toBe(customerId);
      expect(log.userId).toBe(userId);
    });

    // 検証7: ログエントリの完全性と区別可能性を総合確認
    const validationResult = validateAuditLogSequence({
      auditLogs: retrievedLogs
    });
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.totalChangeCount).toBe(3);
    expect(validationResult.duplicateCount).toBe(0);
    expect(validationResult.allEntriesHaveUniqueId).toBe(true);
    expect(validationResult.sequenceIntegrity).toBe(true);

    // 検証8: 各ログエントリが必須フィールドをすべて持つことを確認
    auditLogEntries.forEach((log) => {
      expect(log.auditLogId).toBeDefined();
      expect(log.auditLogId).toMatch(/^ALA-\d+$/); // フォーマット検証
      expect(log.customerId).toBeDefined();
      expect(log.userId).toBeDefined();
      expect(log.timestampMs).toBeDefined();
      expect(log.sequenceNumber).toBeDefined();
      expect(log.fieldName).toBeDefined();
      expect(log.oldValue).toBeDefined();
      expect(log.newValue).toBeDefined();
      expect(log.changeType).toBeDefined();
    });
  });
});