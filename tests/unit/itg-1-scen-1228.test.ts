import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { recordContractChangeAuditLog } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 契約変更監査ログ自動記録', () => {
  let mockDbConnection: any;
  let mockAuditLogDb: any;
  let transactionRolledBack: boolean;
  let contractDataBeforeChange: any;

  beforeEach(() => {
    transactionRolledBack = false;
    contractDataBeforeChange = {
      contract_id: 'CONTRACT-12345',
      customer_id: 'CUST-001',
      monthly_fee: 100000,
      contract_start_date: '2024-01-01',
      contract_end_date: '2024-12-31',
      service_type: 'BASIC',
      status: 'ACTIVE',
    };

    // Mock database connection for contract updates
    mockDbConnection = {
      beginTransaction: jest.fn().mockResolvedValue(true),
      updateContract: jest.fn(async (contractData: any) => {
        // Simulate successful contract update
        return { success: true, updated_at: '2024-01-15T11:00:00Z' };
      }),
      rollback: jest.fn(async () => {
        transactionRolledBack = true;
      }),
      commit: jest.fn().mockResolvedValue(true),
      close: jest.fn().mockResolvedValue(true),
    };

    // Mock database connection for audit log (intentionally fails)
    mockAuditLogDb = {
      insertAuditLog: jest.fn(async (auditRecord: any) => {
        // Simulate database connection error for audit log recording
        throw new Error('監査ログデータベース接続エラー');
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1228
  test('契約変更時に監査ログ記録失敗でロールバック実行し変更前状態に復帰', async () => {
    const changeDetails = {
      contract_id: 'CONTRACT-12345',
      customer_id: 'CUST-001',
      changed_fields: {
        monthly_fee: 150000, // Changed from 100000
      },
      change_reason: '割引終了に伴う料金改定',
      changed_by: 'OP-USER-001',
      changed_at: new Date('2024-01-15T11:00:00Z'),
    };

    const auditLogRecord = {
      audit_log_id: 'AUDIT-LOG-001',
      contract_id: changeDetails.contract_id,
      change_type: 'UPDATE',
      change_details: changeDetails.changed_fields,
      change_reason: changeDetails.change_reason,
      changed_by: changeDetails.changed_by,
      changed_at: changeDetails.changed_at.toISOString(),
      previous_values: {
        monthly_fee: contractDataBeforeChange.monthly_fee,
      },
      new_values: {
        monthly_fee: changeDetails.changed_fields.monthly_fee,
      },
    };

    // Call function with mocked connections
    let thrownError: any = null;
    let result: any = null;

    try {
      result = await recordContractChangeAuditLog(
        changeDetails,
        contractDataBeforeChange,
        mockDbConnection,
        mockAuditLogDb
      );
    } catch (error) {
      thrownError = error;
    }

    // Assert 1: Error message displayed for audit log failure
    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toMatch(/監査ログ/);

    // Assert 2: Transaction rollback was executed
    expect(transactionRolledBack).toBe(true);
    expect(mockDbConnection.rollback).toHaveBeenCalled();

    // Assert 3: Contract data was NOT updated (rollback occurred before commit)
    expect(mockDbConnection.commit).not.toHaveBeenCalled();

    // Assert 4: Audit log insert was attempted but failed
    expect(mockAuditLogDb.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        contract_id: 'CONTRACT-12345',
        change_type: 'UPDATE',
        changed_by: 'OP-USER-USER-001',
      })
    );

    // Assert 5: System returned to pre-change state (no update committed)
    expect(result).toEqual({
      success: false,
      error_message: '監査ログの記録に失敗しました。変更は保存されていません',
      rolled_back: true,
      contract_id: 'CONTRACT-12345',
    });

    // Assert 6: Verify contract data remains unchanged in system state
    expect(mockDbConnection.updateContract).not.toHaveBeenCalled();
  });
});