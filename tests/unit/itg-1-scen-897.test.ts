import { validateInvoiceAmount } from "../../src/logic/it-1781935279444-2-2-1";

describe("請求額異常値判定・承認フロー自動決定機能", () => {
  // SCEN-897: [error] 請求額異常値判定・承認フロー自動決定機能 - データ検証ルール違反が検出された場合は要修正フローが選択される
  test("データ検証ルール違反が検出された場合、承認フロー自動決定機能は『要修正フロー』を選択し、違反内容と修正対象項目が明確に表示される", () => {
    const invoiceData = {
      invoiceId: "INV-20240115-001",
      customerId: "CUST-A001",
      serviceId: "SVC-001",
      invoiceAmount: -5000,
      previousMonthAmount: 10000,
      discountRate: 1.5,
      minInvoiceAmount: 0,
      maxInvoiceAmount: 50000,
      invoicePeriodStart: "2024-01-01",
      invoicePeriodEnd: "2024-01-31",
      createdAt: "2024-01-15T11:00:00Z",
      createdBy: "operator_01",
    };

    const result = validateInvoiceAmount(invoiceData);

    expect(result.isValid).toBe(false);
    expect(result.approvalFlow).toBe("要修正フロー");
    expect(result.validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: "invoiceAmount",
          errorCode: "NEGATIVE_AMOUNT",
          errorMessage: expect.stringContaining("負数"),
          remedialAction: "修正必須",
        }),
        expect.objectContaining({
          fieldName: "discountRate",
          errorCode: "INVALID_DISCOUNT_RATE",
          errorMessage: expect.stringContaining("1以下"),
          remedialAction: "修正必須",
        }),
      ])
    );

    expect(result.validationErrors.length).toBeGreaterThanOrEqual(2);

    const remediableFields = result.validationErrors
      .filter((error) => error.remedialAction === "修正必須")
      .map((error) => error.fieldName);

    expect(remediableFields).toContain("invoiceAmount");
    expect(remediableFields).toContain("discountRate");

    expect(result.canRetry).toBe(true);
    expect(result.retryInstructions).toBeDefined();
    expect(result.retryInstructions.length).toBeGreaterThan(0);

    const amountRetryInstruction = result.retryInstructions.find(
      (instruction) => instruction.fieldName === "invoiceAmount"
    );
    expect(amountRetryInstruction).toBeDefined();
    expect(amountRetryInstruction?.expectedRange).toEqual([0, 50000]);

    const discountRetryInstruction = result.retryInstructions.find(
      (instruction) => instruction.fieldName === "discountRate"
    );
    expect(discountRetryInstruction).toBeDefined();
    expect(discountRetryInstruction?.expectedRange).toEqual([0, 1]);

    expect(result.lastValidationTimestamp).toBe("2024-01-15T11:00:00Z");
    expect(result.validationStatus).toBe("検証失敗");
  });
});