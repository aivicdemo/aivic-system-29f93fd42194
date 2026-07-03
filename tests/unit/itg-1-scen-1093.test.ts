import { describe, test, expect } from '@jest/globals';
import { updateDocumentWithMultipleImprovements } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-1093: [edge] ドキュメント反映・更新機能 - 複数の改善点が同時に反映された場合、すべての更新が正確に適用される
  test('複数の改善点を同時に更新した場合、すべてが正確に反映される', () => {
    const documentId = 'DOC-20240115-001';
    const userId = 'USER-REP-001';
    const timestamp = new Date('2024-01-15T11:00:00Z');

    const multipleImprovements = [
      {
        fieldName: 'salesAmount',
        previousValue: 1000000,
        newValue: 1050000,
        reason: '営業金額修正',
        improvementType: 'correction'
      },
      {
        fieldName: 'billingDate',
        previousValue: '2024-01-31',
        newValue: '2024-02-15',
        reason: '請求日変更',
        improvementType: 'dateChange'
      },
      {
        fieldName: 'customerInfo',
        previousValue: 'CUST-2023-001',
        newValue: 'CUST-2024-001',
        reason: '顧客情報更新',
        improvementType: 'customerUpdate'
      }
    ];

    const result = updateDocumentWithMultipleImprovements(
      documentId,
      userId,
      multipleImprovements,
      timestamp
    );

    expect(result.success).toBe(true);
    expect(result.documentId).toBe('DOC-20240115-001');
    expect(result.updateCount).toBe(3);
    expect(result.appliedImprovements).toEqual([
      {
        fieldName: 'salesAmount',
        previousValue: 1000000,
        newValue: 1050000,
        status: 'applied'
      },
      {
        fieldName: 'billingDate',
        previousValue: '2024-01-31',
        newValue: '2024-02-15',
        status: 'applied'
      },
      {
        fieldName: 'customerInfo',
        previousValue: 'CUST-2023-001',
        newValue: 'CUST-2024-001',
        status: 'applied'
      }
    ]);

    expect(result.integrityVerified).toBe(true);
    expect(result.historyLogRecorded).toBe(true);
    expect(result.relatedDataSynchronized).toBe(true);

    expect(result.auditLog).toHaveLength(3);
    expect(result.auditLog[0]).toEqual({
      timestamp: '2024-01-15T11:00:00Z',
      userId: 'USER-REP-001',
      fieldName: 'salesAmount',
      oldValue: 1000000,
      newValue: 1050000,
      reason: '営業金額修正'
    });
    expect(result.auditLog[1]).toEqual({
      timestamp: '2024-01-15T11:00:00Z',
      userId: 'USER-REP-001',
      fieldName: 'billingDate',
      oldValue: '2024-01-31',
      newValue: '2024-02-15',
      reason: '請求日変更'
    });
    expect(result.auditLog[2]).toEqual({
      timestamp: '2024-01-15T11:00:00Z',
      userId: 'USER-REP-001',
      fieldName: 'customerInfo',
      oldValue: 'CUST-2023-001',
      newValue: 'CUST-2024-001',
      reason: '顧客情報更新'
    });

    expect(result.finalDocumentState).toEqual({
      salesAmount: 1050000,
      billingDate: '2024-02-15',
      customerInfo: 'CUST-2024-001'
    });

    expect(result.performanceMetrics.totalExecutionTimeMs).toBeLessThan(5000);
    expect(result.performanceMetrics.errorCount).toBe(0);
    expect(result.performanceMetrics.synchronizationDelay).toBeLessThan(1000);

    expect(result.relatedDataUpdates).toEqual({
      invoiceGenerated: {
        invoiceId: 'INV-20240215-001',
        updatedAmount: 1050000,
        status: 'updated'
      },
      customerMasterUpdated: {
        customerId: 'CUST-2024-001',
        syncStatus: 'synchronized'
      },
      billingRecordUpdated: {
        recordId: 'BILL-20240215-001',
        newBillingDate: '2024-02-15',
        status: 'updated'
      }
    });
  });

  test('複数の改善点に含まれるフィールドが無効な場合、エラーが発生する', () => {
    const documentId = 'DOC-20240115-002';
    const userId = 'USER-REP-001';
    const timestamp = new Date('2024-01-15T11:00:00Z');

    const invalidImprovements = [
      {
        fieldName: 'salesAmount',
        previousValue: 1000000,
        newValue: 1050000,
        reason: '営業金額修正',
        improvementType: 'correction'
      },
      {
        fieldName: 'invalidField',
        previousValue: 'old',
        newValue: 'new',
        reason: '無効フィールド修正',
        improvementType: 'correction'
      }
    ];

    expect(() =>
      updateDocumentWithMultipleImprovements(
        documentId,
        userId,
        invalidImprovements,
        timestamp
      )
    ).toThrow(/無効フィールド/);
  });

  test('空の改善点配列を送信した場合、エラーが発生する', () => {
    const documentId = 'DOC-20240115-003';
    const userId = 'USER-REP-001';
    const timestamp = new Date('2024-01-15T11:00:00Z');
    const emptyImprovements: any[] = [];

    expect(() =>
      updateDocumentWithMultipleImprovements(
        documentId,
        userId,
        emptyImprovements,
        timestamp
      )
    ).toThrow(/改善点/);
  });

  test('改善点の数が最大制限を超えた場合、エラーが発生する', () => {
    const documentId = 'DOC-20240115-004';
    const userId = 'USER-REP-001';
    const timestamp = new Date('2024-01-15T11:00:00Z');

    const excessiveImprovements = Array.from({ length: 51 }, (_, i) => ({
      fieldName: `field${i}`,
      previousValue: `old${i}`,
      newValue: `new${i}`,
      reason: `修正理由${i}`,
      improvementType: 'correction'
    }));

    expect(() =>
      updateDocumentWithMultipleImprovements(
        documentId,
        userId,
        excessiveImprovements,
        timestamp
      )
    ).toThrow(/制限/);
  });
});