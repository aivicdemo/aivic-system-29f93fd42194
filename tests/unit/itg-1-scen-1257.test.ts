import { validateBillingInfoAgainstContract } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1257
  test("[error] 請求情報検証機能 - 契約内容と一致しない請求金額が異常値として検出される", () => {
    const contractId = "CONTRACT-001";
    const contractAmount = 100000;
    const billingAmount = 150000;
    const expectedDiscrepancy = 50000;

    const input = {
      contractId: contractId,
      contractAmount: contractAmount,
      billingAmount: billingAmount,
    };

    const result = validateBillingInfoAgainstContract(input);

    expect(result).toHaveProperty("isValid");
    expect(result.isValid).toBe(false);

    expect(result).toHaveProperty("errorCode");
    expect(result.errorCode).toBe("BILLING_AMOUNT_MISMATCH");

    expect(result).toHaveProperty("errorMessage");
    expect(typeof result.errorMessage).toBe("string");
    expect(result.errorMessage.length).toBeGreaterThan(0);

    expect(result).toHaveProperty("discrepancy");
    expect(result.discrepancy).toBe(expectedDiscrepancy);

    expect(result).toHaveProperty("contractId");
    expect(result.contractId).toBe(contractId);

    expect(result).toHaveProperty("contractAmount");
    expect(result.contractAmount).toBe(contractAmount);

    expect(result).toHaveProperty("billingAmount");
    expect(result.billingAmount).toBe(billingAmount);
  });
});