import { approveContractChange } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-1242: [normal] 契約変更承認・署名記録機能
  test('営業責任者が変更内容を承認した場合、承認記録が保存され、署名ログが生成される', () => {
    const contractChangeId = 'CC-2024-001';
    const approverId = 'USER-SALES-001';
    const approverName = '営業責任者太郎';
    const approvalTimestamp = new Date('2024-12-15T14:30:00Z');
    const signatureData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...';
    const contractChangeContent = {
      contractId: 'CONTRACT-001',
      changeItems: [
        {
          fieldName: '請求金額',
          beforeValue: '100000',
          afterValue: '120000',
        },
        {
          fieldName: '納期',
          beforeValue: '2024-12-31',
          afterValue: '2025-01-15',
        },
      ],
      changedBy: 'USER-ADMIN-001',
      changedAt: new Date('2024-12-14T10:00:00Z'),
    };

    const result = approveContractChange({
      contractChangeId,
      approverId,
      approverName,
      approvalTimestamp,
      signatureData,
      contractChangeContent,
    });

    // 承認記録が保存されていることを検証
    expect(result.approvalRecord).toBeDefined();
    expect(result.approvalRecord.contractChangeId).toBe(contractChangeId);
    expect(result.approvalRecord.approverId).toBe(approverId);
    expect(result.approvalRecord.approverName).toBe(approverName);
    expect(result.approvalRecord.approvalStatus).toBe('承認完了');
    expect(result.approvalRecord.approvalTimestamp.toISOString()).toBe(
      approvalTimestamp.toISOString()
    );

    // 署名ログが生成されていることを検証
    expect(result.signatureLog).toBeDefined();
    expect(result.signatureLog.contractChangeId).toBe(contractChangeId);
    expect(result.signatureLog.approverId).toBe(approverId);
    expect(result.signatureLog.signatureData).toBe(signatureData);
    expect(result.signatureLog.signatureTimestamp.toISOString()).toBe(
      approvalTimestamp.toISOString()
    );

    // 契約変更のステータスが承認完了に更新されていることを検証
    expect(result.contractChangeStatus).toBe('承認完了');

    // 監査ログが記録されていることを検証
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.eventType).toBe('契約変更承認');
    expect(result.auditLog.approverId).toBe(approverId);
    expect(result.auditLog.approverName).toBe(approverName);
    expect(result.auditLog.contractChangeId).toBe(contractChangeId);
    expect(result.auditLog.eventTimestamp.toISOString()).toBe(
      approvalTimestamp.toISOString()
    );
    expect(result.auditLog.changeContent).toEqual(contractChangeContent);

    // 正常完了メッセージ
    expect(result.message).toBe('承認処理が完了しました');
    expect(result.success).toBe(true);
  });
});