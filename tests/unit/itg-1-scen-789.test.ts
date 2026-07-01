import { describe, test, expect, beforeEach } from "@jest/globals";
import { markObsoleteDocumentsForDeprecation } from "../../src/logic/it-1781935279444-1-1-1";

describe("旧版資料の自動廃棄マーキング機能", () => {
  // SCEN-789
  test("有効期限が過去日付の資料が廃棄対象にマークされない場合、エラーハンドリングが実行される", () => {
    const nowDate = new Date("2024-12-15T10:00:00Z");
    const expiredDate1 = new Date("2024-01-10T00:00:00Z");
    const expiredDate2 = new Date("2024-06-20T00:00:00Z");
    const validDate = new Date("2025-06-15T00:00:00Z");

    const testDocuments = [
      {
        id: "doc-001",
        fileName: "contract_v1.pdf",
        fileVersion: "v1.0",
        expiryDate: expiredDate1,
        effectiveDate: new Date("2023-01-01T00:00:00Z"),
        documentType: "contract",
        customerId: "cust-123",
        status: "active",
        createdAt: new Date("2023-12-01T00:00:00Z"),
        updatedAt: new Date("2024-01-15T00:00:00Z"),
      },
      {
        id: "doc-002",
        fileName: "proposal_v2.pdf",
        fileVersion: "v2.1",
        expiryDate: expiredDate2,
        effectiveDate: new Date("2023-06-01T00:00:00Z"),
        documentType: "proposal",
        customerId: "cust-456",
        status: "active",
        createdAt: new Date("2024-05-10T00:00:00Z"),
        updatedAt: new Date("2024-06-25T00:00:00Z"),
      },
      {
        id: "doc-003",
        fileName: "contract_v2.pdf",
        fileVersion: "v2.0",
        expiryDate: validDate,
        effectiveDate: new Date("2024-06-15T00:00:00Z"),
        documentType: "contract",
        customerId: "cust-123",
        status: "active",
        createdAt: new Date("2024-06-01T00:00:00Z"),
        updatedAt: new Date("2024-12-01T00:00:00Z"),
      },
    ];

    const input = {
      documents: testDocuments,
      currentDate: nowDate,
      adminEmailAddress: "admin@company.jp",
      systemLogPath: "/var/log/system.log",
    };

    let result: any;
    let errorCaught: Error | null = null;

    try {
      result = markObsoleteDocumentsForDeprecation(input);
    } catch (error) {
      if (error instanceof Error) {
        errorCaught = error;
      }
    }

    if (errorCaught) {
      expect(errorCaught.message).toMatch(/有効期限/);

      const errorMessage = errorCaught.message;
      expect(errorMessage).toContain("doc-001");
      expect(errorMessage).toContain("doc-002");
      expect(errorMessage).toContain("2024-01-10");
      expect(errorMessage).toContain("2024-06-20");
    }

    if (result) {
      expect(result).toHaveProperty("errorHandled");
      expect(result.errorHandled).toBe(true);

      expect(result).toHaveProperty("errorLog");
      expect(Array.isArray(result.errorLog)).toBe(true);
      expect(result.errorLog.length).toBeGreaterThan(0);

      const errorLogEntry = result.errorLog[0];
      expect(errorLogEntry).toHaveProperty("errorCode");
      expect(errorLogEntry.errorCode).toMatch(/DEPRECATION_MARK_FAILURE/);

      expect(errorLogEntry).toHaveProperty("timestamp");
      expect(typeof errorLogEntry.timestamp).toBe("string");

      expect(errorLogEntry).toHaveProperty("message");
      expect(errorLogEntry.message).toMatch(/有効期限/);

      expect(errorLogEntry).toHaveProperty("affectedDocumentIds");
      expect(Array.isArray(errorLogEntry.affectedDocumentIds)).toBe(true);
      expect(errorLogEntry.affectedDocumentIds).toContain("doc-001");
      expect(errorLogEntry.affectedDocumentIds).toContain("doc-002");

      expect(result).toHaveProperty("adminNotificationSent");
      expect(result.adminNotificationSent).toBe(true);

      expect(result).toHaveProperty("notificationTimestamp");
      expect(typeof result.notificationTimestamp).toBe("string");

      expect(result).toHaveProperty("systemStatus");
      expect(result.systemStatus).toBe("operational");

      expect(result).toHaveProperty("subsequentProcessBlocked");
      expect(result.subsequentProcessBlocked).toBe(false);

      expect(result).toHaveProperty("logPersisted");
      expect(result.logPersisted).toBe(true);

      expect(result.errorLog[0]).toHaveProperty("rootCause");
      expect(result.errorLog[0].rootCause).toMatch(/マーク処理失敗|更新失敗|状態遷移失敗/);
    }

    expect(result || errorCaught).toBeTruthy();
  });
});