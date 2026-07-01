import { describe, test, expect, beforeEach } from "@jest/globals";
import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証 - 検証結果レポートの承認・差戻し判定", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1034: [edge] 検証結果レポートの承認・差戻し判定 - エラー件数がゼロのときに承認が判定される
  test("エラー件数がゼロの場合、検証結果レポートが自動的に承認と判定される", () => {
    const validationReport = {
      reportId: "REPORT-20240115-001",
      validationPeriod: {
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-31T23:59:59Z",
      },
      totalRecordsValidated: 150,
      errorCount: 0,
      warningCount: 5,
      errorDetails: [],
      warningDetails: [
        {
          recordId: "SALES-20240110-001",
          field: "contactDate",
          message: "接触日時が営業時間外",
          severity: "warning",
        },
        {
          recordId: "SALES-20240112-003",
          field: "appointmentStatus",
          message: "アポ確定ステータスが曖昧",
          severity: "warning",
        },
        {
          recordId: "SALES-20240115-005",
          field: "salesAmount",
          message: "売上金額が平均値から大きく乖離",
          severity: "warning",
        },
        {
          recordId: "SALES-20240118-002",
          field: "customerReaction",
          message: "顧客反応コードが標準値範囲外",
          severity: "warning",
        },
        {
          recordId: "SALES-20240120-004",
          field: "serviceName",
          message: "サービス名が契約対象外",
          severity: "warning",
        },
      ],
      generatedAt: "2024-01-31T09:00:00Z",
      generatedBy: "SYSTEM_AUTO",
    };

    const result = validateSalesDataQuality(validationReport);

    expect(result).toEqual({
      reportId: "REPORT-20240115-001",
      validationStatus: "承認",
      approvalStatus: "承認済み",
      rejectionFlag: false,
      approvalDateTime: expect.any(String),
      errorCount: 0,
      warningCount: 5,
      allowsProceedToNextStep: true,
      requiresApprovalByManager: false,
      canInitiateBillingProcess: true,
      remarks: "エラーが0件のため自動承認",
    });

    expect(result.validationStatus).toBe("承認");
    expect(result.approvalStatus).toBe("承認済み");
    expect(result.rejectionFlag).toBe(false);
    expect(result.allowsProceedToNextStep).toBe(true);
    expect(result.canInitiateBillingProcess).toBe(true);
    expect(result.errorCount).toBe(0);
    expect(result.warningCount).toBe(5);

    const approvalTime = new Date(result.approvalDateTime);
    expect(approvalTime.getTime()).toBeLessThanOrEqual(
      new Date("2024-01-31T09:30:00Z").getTime()
    );
    expect(approvalTime.getTime()).toBeGreaterThanOrEqual(
      new Date("2024-01-31T08:30:00Z").getTime()
    );
  });
});