import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { detectAndRecordExceptionCase } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  let mockLogger: any;
  let mockAuditTable: any[];

  beforeEach(() => {
    mockAuditTable = [];
    mockLogger = {
      error: jest.fn((msg: string, data: any) => {
        mockAuditTable.push({
          timestamp: new Date("2024-01-15T10:30:00Z").toISOString(),
          level: "ERROR",
          message: msg,
          data,
        });
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-995
  test("手順書に未記載の例外ケースが検出された場合、エラーオブジェクトにステータス'ERROR'、タイムスタンプ、詳細情報が含まれ、監査テーブルに永続化される", () => {
    const exceptionalCases = [
      {
        caseId: "EXC-001",
        discountRate: -0.15,
        description: "割引率が負数",
      },
      {
        caseId: "EXC-002",
        billingAmount: NaN,
        description: "請求金額がNaN",
      },
      {
        caseId: "EXC-003",
        customerCode: "",
        description: "顧客コードが空文字列",
      },
    ];

    const results: any[] = [];

    exceptionalCases.forEach((exCase) => {
      const errorRecord = detectAndRecordExceptionCase(exCase, mockLogger);
      results.push(errorRecord);
    });

    expect(results).toHaveLength(3);

    const firstError = results[0];
    expect(firstError.status).toBe("ERROR");
    expect(firstError.errorCode).toBe("INVALID_DISCOUNT_RATE");
    expect(firstError.errorMessage).toMatch(/割引率/);
    expect(firstError.inputValue).toBe(-0.15);
    expect(firstError.timestamp).toBeDefined();
    expect(typeof firstError.timestamp).toBe("string");

    const secondError = results[1];
    expect(secondError.status).toBe("ERROR");
    expect(secondError.errorCode).toBe("INVALID_BILLING_AMOUNT");
    expect(secondError.errorMessage).toMatch(/請求金額/);
    expect(isNaN(secondError.inputValue)).toBe(true);
    expect(secondError.timestamp).toBeDefined();

    const thirdError = results[2];
    expect(thirdError.status).toBe("ERROR");
    expect(thirdError.errorCode).toBe("INVALID_CUSTOMER_CODE");
    expect(thirdError.errorMessage).toMatch(/顧客コード/);
    expect(thirdError.inputValue).toBe("");
    expect(thirdError.timestamp).toBeDefined();

    expect(mockLogger.error).toHaveBeenCalledTimes(3);
    expect(mockAuditTable).toHaveLength(3);

    mockAuditTable.forEach((auditEntry) => {
      expect(auditEntry.level).toBe("ERROR");
      expect(auditEntry.timestamp).toBeDefined();
      expect(auditEntry.data).toHaveProperty("errorCode");
      expect(auditEntry.data).toHaveProperty("errorMessage");
      expect(auditEntry.data).toHaveProperty("inputValue");
    });

    expect(mockAuditTable[0].data.errorCode).toBe("INVALID_DISCOUNT_RATE");
    expect(mockAuditTable[1].data.errorCode).toBe("INVALID_BILLING_AMOUNT");
    expect(mockAuditTable[2].data.errorCode).toBe("INVALID_CUSTOMER_CODE");
  });
});