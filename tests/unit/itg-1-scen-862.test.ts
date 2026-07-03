import {
  generateContractChangeValidationReport,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

describe("月次サマリーテンプレート定義・管理機能", () => {
  test("SCEN-862: 契約変更検証レポートの自動生成と顧客営業責任者への送付", async () => {
    fetchMock.resetMocks();

    const contractChangeData = {
      contractId: "CONTRACT-2024-001",
      customerId: "CUST-A001",
      customerName: "株式会社テスト企業",
      businessResponsibleEmail: "responsible@test-company.jp",
      changeDate: "2024-01-15",
      changeType: "service_scope_update",
      previousTerms: {
        serviceScope: "Standard Package",
        billingAmount: 500000,
        effectiveDate: "2023-12-01",
      },
      newTerms: {
        serviceScope: "Premium Package",
        billingAmount: 750000,
        effectiveDate: "2024-01-01",
      },
      changeReason: "顧客リクエストによるプラン升級",
      approvalStatus: "approved",
      validationChecks: {
        priceRangeValid: true,
        contractTermsConsistent: true,
        noConflictWithExistingAgreement: true,
      },
    };

    const mockReportContent = {
      reportId: "REPORT-2024-001-CHG",
      reportTitle: "契約変更検証レポート",
      generatedAt: "2024-01-15T10:30:00Z",
      customerId: "CUST-A001",
      customerName: "株式会社テスト企業",
      contractId: "CONTRACT-2024-001",
      changeDetails: {
        changeDate: "2024-01-15",
        changeType: "service_scope_update",
        reason: "顧客リクエストによるプラン升級",
        previousTerms: {
          serviceScope: "Standard Package",
          billingAmount: 500000,
        },
        newTerms: {
          serviceScope: "Premium Package",
          billingAmount: 750000,
        },
        amountDifference: 250000,
      },
      validationResults: {
        priceRangeValidation: "合格",
        contractTermsConsistency: "合格",
        conflictCheck: "合格",
        overallStatus: "合格",
      },
      deliveryEmailAddress: "responsible@test-company.jp",
      deliveryTimestamp: "2024-01-15T10:30:00Z",
      reportFormat: "PDF",
      approvalSignature: {
        approver: "営業代表者",
        approvalDate: "2024-01-15",
        status: "approved",
      },
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockReportContent), {
      status: 200,
    });

    fetchMock.mockResponseOnce(
      JSON.stringify({
        messageId: "MSG-2024-001",
        deliveryStatus: "sent",
        recipientEmail: "responsible@test-company.jp",
        sentAt: "2024-01-15T10:30:30Z",
        subject:
          "契約変更検証レポート - 株式会社テスト企業 (契約ID: CONTRACT-2024-001)",
      }),
      { status: 200 }
    );

    const result = await generateContractChangeValidationReport(
      contractChangeData
    );

    expect(result.reportId).toBe("REPORT-2024-001-CHG");
    expect(result.reportTitle).toBe("契約変更検証レポート");
    expect(result.customerId).toBe("CUST-A001");
    expect(result.customerName).toBe("株式会社テスト企業");
    expect(result.contractId).toBe("CONTRACT-2024-001");

    expect(result.changeDetails.changeType).toBe("service_scope_update");
    expect(result.changeDetails.previousTerms.serviceScope).toBe(
      "Standard Package"
    );
    expect(result.changeDetails.previousTerms.billingAmount).toBe(500000);
    expect(result.changeDetails.newTerms.serviceScope).toBe("Premium Package");
    expect(result.changeDetails.newTerms.billingAmount).toBe(750000);
    expect(result.changeDetails.amountDifference).toBe(250000);

    expect(result.validationResults.priceRangeValidation).toBe("合格");
    expect(result.validationResults.contractTermsConsistency).toBe("合格");
    expect(result.validationResults.conflictCheck).toBe("合格");
    expect(result.validationResults.overallStatus).toBe("合格");

    expect(result.deliveryEmailAddress).toBe("responsible@test-company.jp");
    expect(result.reportFormat).toBe("PDF");

    expect(result.approvalSignature.approver).toBe("営業代表者");
    expect(result.approvalSignature.status).toBe("approved");

    const reportGenerateCall = fetchMock.mock.calls[0];
    expect(reportGenerateCall[0]).toContain(
      "contract-change-validation-report"
    );

    const deliveryCall = fetchMock.mock.calls[1];
    expect(deliveryCall[0]).toContain("send-report");

    expect(result.deliveryStatus).toBe("sent");
    expect(result.messageId).toBe("MSG-2024-001");
    expect(result.sentAt).toBe("2024-01-15T10:30:30Z");

    expect(result.generatedAt).toBe("2024-01-15T10:30:00Z");
  });
});