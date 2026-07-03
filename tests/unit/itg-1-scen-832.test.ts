import { validateAndMergePortalData } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-832
  test("顧客ポータル合意内容統合表示機能 - 関連データ部分欠落時のエラーハンドリング", () => {
    const input = {
      contractId: "CTR-20240115-001",
      customerId: "CUST-12345",
      contractData: {
        contractId: "CTR-20240115-001",
        contractName: "営業代行契約",
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-12-31T23:59:59Z",
        status: "active",
      },
      proposalData: null,
      emailHistoryData: [
        {
          emailId: "EMAIL-001",
          subject: "契約内容確認",
          sentDate: "2024-01-10T09:00:00Z",
          sender: "sales@company.com",
        },
      ],
      deliveryScheduleData: null,
      billingData: {
        billingId: "BILL-001",
        amount: 500000,
        currency: "JPY",
        invoiceDate: "2024-01-15T00:00:00Z",
      },
    };

    const result = validateAndMergePortalData(input);

    expect(result.success).toBe(true);
    expect(result.displayData.contract).toEqual({
      contractId: "CTR-20240115-001",
      contractName: "営業代行契約",
      startDate: "2024-01-01T00:00:00Z",
      endDate: "2024-12-31T23:59:59Z",
      status: "active",
    });

    expect(result.displayData.proposal).toEqual({
      placeholder: true,
      message: "提案資料は利用できません",
    });

    expect(result.displayData.emailHistory).toHaveLength(1);
    expect(result.displayData.emailHistory[0]).toEqual({
      emailId: "EMAIL-001",
      subject: "契約内容確認",
      sentDate: "2024-01-10T09:00:00Z",
      sender: "sales@company.com",
    });

    expect(result.displayData.deliverySchedule).toEqual({
      placeholder: true,
      message: "納期管理情報は利用できません",
    });

    expect(result.displayData.billing).toEqual({
      billingId: "BILL-001",
      amount: 500000,
      currency: "JPY",
      invoiceDate: "2024-01-15T00:00:00Z",
    });

    expect(result.partialDataAvailable).toBe(true);
    expect(result.missingDataCategories).toContain("提案資料");
    expect(result.missingDataCategories).toContain("納期管理情報");
    expect(result.missingDataCategories).toHaveLength(2);

    expect(result.systemHealthy).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});