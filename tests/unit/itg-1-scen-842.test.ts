import { recordAuditLog } from '../../src/logic/it-1781935279444-2-2-1';

describe('ポータルアクション監査ログ自動記録機能', () => {
  // SCEN-842
  test('文書閲覧・編集・移動のアクション実行時、実行日時・実行者・操作内容・対象データが記録される', () => {
    // 初期条件: テストユーザーでポータルにログイン
    const testUser = {
      userId: 'user-001',
      username: 'test_user',
      email: 'test@example.com'
    };

    const documentFile = {
      fileId: 'doc-12345',
      fileName: 'sales_proposal_2024.pdf',
      fileType: 'pdf'
    };

    const actionTimestamp = new Date('2024-01-15T14:30:00Z');

    // アクション1: 文書閲覧
    const viewAuditLog = recordAuditLog({
      userId: testUser.userId,
      username: testUser.username,
      actionType: 'VIEW',
      targetDataId: documentFile.fileId,
      targetDataName: documentFile.fileName,
      actionTimestamp: actionTimestamp,
      details: {
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0'
      }
    });

    // 期待値: 閲覧アクションの記録
    expect(viewAuditLog.auditLogId).toBeDefined();
    expect(viewAuditLog.userId).toBe('user-001');
    expect(viewAuditLog.username).toBe('test_user');
    expect(viewAuditLog.actionType).toBe('VIEW');
    expect(viewAuditLog.targetDataId).toBe('doc-12345');
    expect(viewAuditLog.targetDataName).toBe('sales_proposal_2024.pdf');
    expect(viewAuditLog.actionTimestamp).toEqual(actionTimestamp);
    expect(viewAuditLog.recordedAt).toBeDefined();

    // アクション2: 文書編集
    const editTimestamp = new Date('2024-01-15T14:35:00Z');
    const editAuditLog = recordAuditLog({
      userId: testUser.userId,
      username: testUser.username,
      actionType: 'EDIT',
      targetDataId: documentFile.fileId,
      targetDataName: documentFile.fileName,
      actionTimestamp: editTimestamp,
      details: {
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        changesSummary: 'Updated contract terms'
      }
    });

    // 期待値: 編集アクションの記録
    expect(editAuditLog.auditLogId).toBeDefined();
    expect(editAuditLog.auditLogId).not.toBe(viewAuditLog.auditLogId);
    expect(editAuditLog.userId).toBe('user-001');
    expect(editAuditLog.actionType).toBe('EDIT');
    expect(editAuditLog.targetDataId).toBe('doc-12345');
    expect(editAuditLog.targetDataName).toBe('sales_proposal_2024.pdf');
    expect(editAuditLog.actionTimestamp).toEqual(editTimestamp);
    expect(editAuditLog.actionTimestamp.getTime()).toBeGreaterThan(viewAuditLog.actionTimestamp.getTime());

    // アクション3: 文書間の移動
    const targetDocument = {
      fileId: 'doc-67890',
      fileName: 'contract_v2.docx'
    };

    const moveTimestamp = new Date('2024-01-15T14:40:00Z');
    const moveAuditLog = recordAuditLog({
      userId: testUser.userId,
      username: testUser.username,
      actionType: 'MOVE',
      targetDataId: targetDocument.fileId,
      targetDataName: targetDocument.fileName,
      actionTimestamp: moveTimestamp,
      details: {
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        sourceDocumentId: documentFile.fileId,
        sourceDocumentName: documentFile.fileName
      }
    });

    // 期待値: 移動アクションの記録
    expect(moveAuditLog.auditLogId).toBeDefined();
    expect(moveAuditLog.auditLogId).not.toBe(viewAuditLog.auditLogId);
    expect(moveAuditLog.auditLogId).not.toBe(editAuditLog.auditLogId);
    expect(moveAuditLog.userId).toBe('user-001');
    expect(moveAuditLog.username).toBe('test_user');
    expect(moveAuditLog.actionType).toBe('MOVE');
    expect(moveAuditLog.targetDataId).toBe('doc-67890');
    expect(moveAuditLog.targetDataName).toBe('contract_v2.docx');
    expect(moveAuditLog.actionTimestamp).toEqual(moveTimestamp);
    expect(moveAuditLog.actionTimestamp.getTime()).toBeGreaterThan(editAuditLog.actionTimestamp.getTime());

    // 複合検証: 3つのアクションすべてが記録されており、タイムスタンプが順序立っている
    const allLogs = [viewAuditLog, editAuditLog, moveAuditLog];
    
    expect(allLogs.length).toBe(3);
    
    // 各ログが必須フィールドをすべて持つことを確認
    allLogs.forEach((log) => {
      expect(log.auditLogId).toBeTruthy();
      expect(log.userId).toBe('user-001');
      expect(log.username).toBe('test_user');
      expect(log.actionType).toMatch(/^(VIEW|EDIT|MOVE)$/);
      expect(log.targetDataId).toBeTruthy();
      expect(log.targetDataName).toBeTruthy();
      expect(log.actionTimestamp).toBeInstanceOf(Date);
      expect(log.recordedAt).toBeInstanceOf(Date);
    });

    // 時系列順序が保持されていることを確認
    expect(viewAuditLog.actionTimestamp.getTime()).toBeLessThan(editAuditLog.actionTimestamp.getTime());
    expect(editAuditLog.actionTimestamp.getTime()).toBeLessThan(moveAuditLog.actionTimestamp.getTime());

    // 操作内容が正確に記録されていることを確認
    expect(viewAuditLog.actionType).toBe('VIEW');
    expect(editAuditLog.actionType).toBe('EDIT');
    expect(moveAuditLog.actionType).toBe('MOVE');

    // 対象データが正確に記録されていることを確認
    expect(viewAuditLog.targetDataName).toBe('sales_proposal_2024.pdf');
    expect(editAuditLog.targetDataName).toBe('sales_proposal_2024.pdf');
    expect(moveAuditLog.targetDataName).toBe('contract_v2.docx');
  });
});