import { describe, test, expect, beforeEach } from '@jest/globals';
import { recordContractChangeRejection } from '../../src/logic/it-1781935279444-2-1-1';

describe('契約変更承認・署名記録機能 - 営業責任者が承認を拒否した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1244
  test('営業責任者が承認を拒否した場合、拒否理由が記録され、契約変更が反映されない', () => {
    // テストデータ: 承認待ちステータスの契約変更申請
    const contractChangeId = 'CC-20240115-001';
    const customerId = 'CUST-0001';
    const previousContractAmount = 100000;
    const newContractAmount = 120000;
    const changeStatus = 'pending_approval';
    const rejectionReason = '条件が合致していません';
    const rejectionUserId = 'USER-SALES-RESP-001';
    const rejectionTimestamp = new Date('2024-01-15T14:30:00Z');

    // 実行: 営業責任者が契約変更申請を拒否
    const result = recordContractChangeRejection({
      contractChangeId,
      customerId,
      rejectionReason,
      rejectionUserId,
      rejectionTimestamp,
      currentStatus: changeStatus,
      previousAmount: previousContractAmount,
      newAmount: newContractAmount
    });

    // 検証1: 拒否ステータスが記録される
    expect(result.status).toBe('rejected');

    // 検証2: 拒否理由が記録される
    expect(result.rejectionReason).toBe('条件が合致していません');

    // 検証3: 拒否ユーザーが記録される
    expect(result.rejectionUserId).toBe('USER-SALES-RESP-001');

    // 検証4: 拒否日時が記録される
    expect(result.rejectionTimestamp).toEqual(new Date('2024-01-15T14:30:00Z'));

    // 検証5: 監査ログに拒否日時と拒否理由が記載される
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.action).toBe('rejected');
    expect(result.auditLog.reason).toBe('条件が合致していません');
    expect(result.auditLog.timestamp).toEqual(new Date('2024-01-15T14:30:00Z'));

    // 検証6: 実際の契約情報は変更されない（金額が旧値のまま）
    expect(result.contractAmount).toBe(100000);

    // 検証7: 請求データは更新されていない
    expect(result.billingUpdated).toBe(false);

    // 検証8: 契約変更申請レコードが拒否状態で保存される
    expect(result.contractChangeId).toBe('CC-20240115-001');
    expect(result.customerId).toBe('CUST-0001');
  });

  // エラーケース: 拒否理由が空の場合
  test('拒否理由が空の場合、エラーが発生する', () => {
    const contractChangeId = 'CC-20240115-002';
    const customerId = 'CUST-0002';
    const rejectionUserId = 'USER-SALES-RESP-001';
    const rejectionTimestamp = new Date('2024-01-15T14:35:00Z');

    expect(() =>
      recordContractChangeRejection({
        contractChangeId,
        customerId,
        rejectionReason: '',
        rejectionUserId,
        rejectionTimestamp,
        currentStatus: 'pending_approval',
        previousAmount: 50000,
        newAmount: 60000
      })
    ).toThrow(/拒否理由/);
  });

  // エラーケース: ステータスが既に「拒否」の場合、重複拒否を防ぐ
  test('既に拒否済みの契約変更申請を再度拒否しようとした場合、エラーが発生する', () => {
    const contractChangeId = 'CC-20240115-003';
    const customerId = 'CUST-0003';

    expect(() =>
      recordContractChangeRejection({
        contractChangeId,
        customerId,
        rejectionReason: '再度拒否します',
        rejectionUserId: 'USER-SALES-RESP-002',
        rejectionTimestamp: new Date('2024-01-15T15:00:00Z'),
        currentStatus: 'rejected',
        previousAmount: 80000,
        newAmount: 95000
      })
    ).toThrow(/ステータス/);
  });
});