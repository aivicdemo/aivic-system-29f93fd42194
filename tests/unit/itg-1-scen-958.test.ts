import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証 - 複数基準違反時の通知", () => {
  // SCEN-958
  test("複数の品質基準に引っかかる場合、すべての不適合を通知して修正を促す", () => {
    const invalidSalesRecord = {
      salesDataId: "SD-20240115-001",
      customerName: "",
      appointmentCount: 5,
      contractCount: 2,
      amount: -50000,
      billingDate: "",
      serviceType: "営業代行",
      status: "pending",
      recordedAt: "2024-01-15T10:00:00Z",
    };

    const result = validateSalesDataQuality(invalidSalesRecord);

    expect(result.isValid).toBe(false);
    expect(result.defects).toBeDefined();
    expect(result.defects.length).toBe(3);

    const defectMessages = result.defects.map(
      (d: { field: string; message: string }) => d.field
    );
    expect(defectMessages).toContain("customerName");
    expect(defectMessages).toContain("amount");
    expect(defectMessages).toContain("billingDate");

    const customerNameDefect = result.defects.find(
      (d: { field: string }) => d.field === "customerName"
    );
    expect(customerNameDefect.message).toMatch(/顧客名|必須/);

    const amountDefect = result.defects.find(
      (d: { field: string }) => d.field === "amount"
    );
    expect(amountDefect.message).toMatch(/金額|負数|マイナス/);

    const billingDateDefect = result.defects.find(
      (d: { field: string }) => d.field === "billingDate"
    );
    expect(billingDateDefect.message).toMatch(/請求日|必須/);

    expect(result.notificationSent).toBe(true);
    expect(result.notificationContent).toBeDefined();
    expect(result.notificationContent.defectSummary).toContain("顧客名");
    expect(result.notificationContent.defectSummary).toContain("金額");
    expect(result.notificationContent.defectSummary).toContain("請求日");

    expect(result.notificationContent.correctionInstructions).toBeDefined();
    expect(result.notificationContent.correctionInstructions.length).toBeGreaterThanOrEqual(3);

    const customerNameInstruction = result.notificationContent.correctionInstructions.find(
      (i: { field: string }) => i.field === "customerName"
    );
    expect(customerNameInstruction).toBeDefined();
    expect(customerNameInstruction.action).toMatch(/入力|確認/);

    const amountInstruction = result.notificationContent.correctionInstructions.find(
      (i: { field: string }) => i.field === "amount"
    );
    expect(amountInstruction).toBeDefined();
    expect(amountInstruction.action).toMatch(/正の数/);

    const billingDateInstruction = result.notificationContent.correctionInstructions.find(
      (i: { field: string }) => i.field === "billingDate"
    );
    expect(billingDateInstruction).toBeDefined();
    expect(billingDateInstruction.action).toMatch(/日付|設定/);

    expect(result.recordIdentifier).toBe("SD-20240115-001");
    expect(result.correctionRequired).toBe(true);
    expect(result.allDefectsIdentified).toBe(true);
  });
});