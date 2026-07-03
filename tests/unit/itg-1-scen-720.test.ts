import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import {
  validateAndApproveOperationalData,
} from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ品質基準チェック・承認機能", () => {
  let auditLogEntries: Array<{
    timestamp: string;
    userId: string;
    action: string;
    recordId: string;
    status: string;
  }> = [];

  beforeEach(() => {
    auditLogEntries = [];
  });

  afterEach(() => {
    auditLogEntries = [];
  });

  // SCEN-720
  it("修正済みデータがすべての品質基準をパスし確定・承認ステータスへ遷移する", () => {
    // Arrange
    const recordId = "OP-2024-001";
    const userId = "USER-REP-001";
    const correctedData = {
      id: recordId,
      customerName: "テスト顧客A",
      contactDate: "2024-01-15",
      appointmentStatus: "confirmed",
      transactionAmount: 150000,
      serviceType: "plan-a",
      status: "pending_approval",
      createdAt: "2024-01-10T08:00:00Z",
      correctedAt: "2024-01-12T14:30:00Z",
    };

    const expectedValidationResult = {
      recordId: recordId,
      requiredFieldsCheck: true,
      dataTypeCheck: true,
      formatCheck: true,
      valueRangeCheck: true,
      overallStatus: "合格",
      allCriteriaMet: true,
    };

    const mockAuditLog = (entry: {
      timestamp: string;
      userId: string;
      action: string;
      recordId: string;
      status: string;
    }) => {
      auditLogEntries.push(entry);
    };

    // Act
    const validationResult = validateAndApproveOperationalData(
      correctedData,
      userId,
      mockAuditLog
    );

    // Assert - 1. 検証結果がすべての基準で合格
    expect(validationResult.overallStatus).toBe("合格");
    expect(validationResult.requiredFieldsCheck).toBe(true);
    expect(validationResult.dataTypeCheck).toBe(true);
    expect(validationResult.formatCheck).toBe(true);
    expect(validationResult.valueRangeCheck).toBe(true);
    expect(validationResult.allCriteriaMet).toBe(true);

    // Assert - 2. ステータス遷移確認
    expect(validationResult.newStatus).toBe("確定・承認済み");

    // Assert - 3. 承認操作が監査ログに記録されたことを確認
    expect(auditLogEntries.length).toBe(1);
    const auditEntry = auditLogEntries[0];
    expect(auditEntry.action).toBe("承認");
    expect(auditEntry.recordId).toBe(recordId);
    expect(auditEntry.userId).toBe(userId);
    expect(auditEntry.status).toBe("確定・承認済み");
    expect(auditEntry.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // Assert - 4. 請求処理への進行可能性を確認
    expect(validationResult.proceedToNextWorkflow).toBe(true);
    expect(validationResult.readyForBilling).toBe(true);
  });
});