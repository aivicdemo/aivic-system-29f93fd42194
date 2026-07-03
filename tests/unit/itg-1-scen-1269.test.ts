import { approveBillingInfo } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-1269: [normal] 請求情報最終承認機能 - すべての検証項目をクリアした請求情報が承認可能と判定される", () => {
    const billingInfo = {
      billingId: "BL-2024-001",
      customerId: "CUST-001",
      customerName: "テスト顧客A株式会社",
      serviceId: "SVC-001",
      serviceName: "営業支援サービス",
      billingAmount: 150000,
      billingDate: "2024-01-31",
      billingItems: [
        {
          itemId: "ITEM-001",
          itemName: "アポイント実績報酬",
          quantity: 10,
          unitPrice: 5000,
          amount: 50000,
        },
        {
          itemId: "ITEM-002",
          itemName: "成約実績報酬",
          quantity: 2,
          unitPrice: 50000,
          amount: 100000,
        },
      ],
      requiredFieldsComplete: true,
      customerExists: true,
      amountValid: true,
      dateValid: true,
      itemsValid: true,
    };

    const result = approveBillingInfo(billingInfo);

    expect(result).toEqual({
      approvalStatus: "承認済み",
      billingId: "BL-2024-001",
      isApprovalValid: true,
      validationResults: {
        customerMasterExists: true,
        amountValidity: true,
        requiredFieldsComplete: true,
        dateValidity: true,
        billingItemsValid: true,
      },
      approvalTimestamp: expect.any(String),
      message: "請求情報がすべての検証項目をクリアしました。承認処理が完了しました。",
    });

    expect(result.isApprovalValid).toBe(true);
    expect(result.approvalStatus).toBe("承認済み");
    expect(result.validationResults.customerMasterExists).toBe(true);
    expect(result.validationResults.amountValidity).toBe(true);
    expect(result.validationResults.requiredFieldsComplete).toBe(true);
    expect(result.validationResults.dateValidity).toBe(true);
    expect(result.validationResults.billingItemsValid).toBe(true);
  });
});