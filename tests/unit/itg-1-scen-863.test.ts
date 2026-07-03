import { generateContractChangeVerificationReport } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-863: 配信先メールアドレスが存在しない場合に配信エラーが検出される", () => {
    const input = {
      reportTemplateId: "tpl_monthly_001",
      contractChangeData: {
        contractId: "cnt_20240115_001",
        customerId: "cust_ABC",
        changeType: "price_update",
        previousAmount: 100000,
        newAmount: 120000,
        changeDate: "2024-01-15",
      },
      distributionEmailAddresses: [], // 配信先メールアドレスが空
      generatedAt: "2024-01-15T10:30:00Z",
      generatedBy: "user_operator_001",
    };

    const result = generateContractChangeVerificationReport(input);

    // エラー状態を検証
    expect(result.status).toBe("error");
    expect(result.errorCode).toBe("DISTRIBUTION_EMAIL_MISSING");
    expect(result.errorMessage).toMatch(/配信先メールアドレス/);
    expect(result.distributionAttempted).toBe(false);
    expect(result.reportId).toBeDefined();
    expect(result.systemContinued).toBe(true);
  });
});