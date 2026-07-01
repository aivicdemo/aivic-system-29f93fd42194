import { validateBillingData } from "../../src/logic/it-1781935279444-2-2-1";

describe("請求データ自動検証 - 請求額が契約上限を超えている場合", () => {
  // SCEN-1315
  test("請求額が契約上限を超えている場合、検証エラーが検出され異常通知が発行される", () => {
    const contractId = "CONTRACT_001";
    const contractMaxAmount = 100000; // 契約上限額: 100,000円
    const billingAmount = 120000; // 請求額: 120,000円 (上限を超過)

    const billingData = {
      contractId,
      customerId: "CUSTOMER_001",
      serviceId: "SERVICE_001",
      billingAmount,
      billingDate: "2024-01-15",
      period: "2024-01",
    };

    const contractInfo = {
      contractId,
      maxAmount: contractMaxAmount,
      status: "active",
    };

    // 検証実行
    const result = validateBillingData(billingData, contractInfo);

    // 検証エラーが発生することを確認
    expect(result.isValid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);

    // エラーメッセージに上限超過に関する内容が含まれることを確認
    const exceedsMaxError = result.errors.find((error: string) =>
      /上限|超過|超え/.test(error)
    );
    expect(exceedsMaxError).toBeDefined();

    // 異常通知（アラート）が生成されたことを確認
    expect(result.alertGenerated).toBe(true);

    // 異常通知の内容確認
    expect(result.alert).toBeDefined();
    expect(result.alert.type).toBe("BILLING_LIMIT_EXCEEDED");
    expect(result.alert.severity).toBe("HIGH");
    expect(result.alert.message).toMatch(/請求額が契約上限を超過/);

    // 超過額の計算確認
    const exceedAmount = billingAmount - contractMaxAmount;
    expect(result.alert.exceedAmount).toBe(exceedAmount); // 20,000円

    // 処理ステータスが中断されていることを確認
    expect(result.processingStatus).toBe("STOPPED");

    // 詳細情報の確認
    expect(result.details).toBeDefined();
    expect(result.details.contractMaxAmount).toBe(contractMaxAmount);
    expect(result.details.requestedAmount).toBe(billingAmount);
    expect(result.details.exceededPercentage).toBe(20); // 20% 超過
  });
});