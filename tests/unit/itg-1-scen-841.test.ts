import { recordAuditLog } from '../../src/logic/it-1781935279444-2-2-1';

describe('ポータルアクション監査ログ自動記録機能', () => {
  // SCEN-841
  test('営業責任者がポータルにログインしたとき、ログイン日時・ユーザーID・IPアドレスが監査ログに自動記録される', () => {
    // Arrange
    const userId = 'user-resp-001';
    const loginTimestamp = new Date('2024-01-15T14:30:00Z');
    const clientIpAddress = '192.168.1.100';
    const actionType = 'login';

    // Act
    const auditLogEntry = recordAuditLog({
      userId,
      loginTimestamp,
      clientIpAddress,
      actionType
    });

    // Assert
    expect(auditLogEntry).toEqual({
      userId: 'user-resp-001',
      loginTimestamp: new Date('2024-01-15T14:30:00Z'),
      clientIpAddress: '192.168.1.100',
      actionType: 'login',
      recordedAt: expect.any(Date)
    });
    expect(auditLogEntry.userId).toBe('user-resp-001');
    expect(auditLogEntry.loginTimestamp).toEqual(new Date('2024-01-15T14:30:00Z'));
    expect(auditLogEntry.clientIpAddress).toBe('192.168.1.100');
    expect(auditLogEntry.actionType).toBe('login');
    expect(auditLogEntry.recordedAt).toBeInstanceOf(Date);
  });
});