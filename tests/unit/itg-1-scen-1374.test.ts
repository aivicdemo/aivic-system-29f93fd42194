import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1374
  test("複数の異常値が同時に存在する営業データから全ての異常が検出される", () => {
    const testDataset = {
      salesRecords: [
        {
          recordId: "REC-001",
          customerId: "",
          customerName: "テスト顧客",
          amount: -50000,
          saleDate: "2099-12-31T23:59:59Z",
          salesPersonName: "!!!***###",
          serviceType: "service-a",
          apCount: 5,
          contractCount: 2,
          status: "completed",
        },
      ],
    };

    const validationResult = validateSalesData(testDataset);

    expect(validationResult.isValid).toBe(false);
    expect(validationResult.errors).toBeDefined();
    expect(Array.isArray(validationResult.errors)).toBe(true);

    const errorCount = validationResult.errors.length;
    expect(errorCount).toBeGreaterThanOrEqual(4);

    const errorTypes = validationResult.errors.map((err: any) => err.type);
    expect(errorTypes).toContain("customerId");
    expect(errorTypes).toContain("amount");
    expect(errorTypes).toContain("saleDate");
    expect(errorTypes).toContain("salesPersonName");

    const customerIdError = validationResult.errors.find(
      (err: any) => err.type === "customerId"
    );
    expect(customerIdError).toBeDefined();
    expect(customerIdError.message).toMatch(/顧客ID|空文字/i);

    const amountError = validationResult.errors.find(
      (err: any) => err.type === "amount"
    );
    expect(amountError).toBeDefined();
    expect(amountError.message).toMatch(/金額|マイナス|負数/i);

    const saleDateError = validationResult.errors.find(
      (err: any) => err.type === "saleDate"
    );
    expect(saleDateError).toBeDefined();
    expect(saleDateError.message).toMatch(/売上日付|未来日|日付/i);

    const salesPersonNameError = validationResult.errors.find(
      (err: any) => err.type === "salesPersonName"
    );
    expect(salesPersonNameError).toBeDefined();
    expect(salesPersonNameError.message).toMatch(/営業担当者|特殊文字|名前/i);

    expect(validationResult.validationLog).toBeDefined();
    expect(validationResult.validationLog.totalErrorsDetected).toBe(errorCount);
    expect(validationResult.validationLog.recordsChecked).toBe(1);
    expect(validationResult.validationLog.errorsRecorded).toBe(errorCount);
    expect(
      validationResult.validationLog.errorsRecorded ===
        validationResult.validationLog.totalErrorsDetected
    ).toBe(true);

    validationResult.errors.forEach((error: any) => {
      expect(error).toHaveProperty("type");
      expect(error).toHaveProperty("message");
      expect(error).toHaveProperty("recordId");
      expect(error.recordId).toBe("REC-001");
    });
  });
});