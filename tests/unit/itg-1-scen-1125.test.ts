import { describe, test, expect, beforeEach } from "@jest/globals";
import { validateGeneratedReport } from "../../src/logic/it-1781935279444-2-2-1";

describe("生成レポートの自動品質検証", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1125
  test("レポート内に必須項目が欠落している場合に検証エラーとして検出される", () => {
    // === Setup: レポートオブジェクト（必須項目が欠落）===
    const reportWithMissingFields = {
      reportId: "RPT-2024-001",
      customerId: "CUST-123",
      // customerName は欠落
      billingAmount: 150000,
      // billingDate は欠落
      dueDate: new Date("2024-02-15"),
      serviceType: "営業成果報酬",
      generatedAt: new Date("2024-01-15T10:00:00Z"),
    };

    // === Action: 品質検証を実行 ===
    const validationResult = validateGeneratedReport(reportWithMissingFields);

    // === Assertion 1: 検証結果が失敗（エラー）を示す ===
    expect(validationResult.isValid).toBe(false);

    // === Assertion 2: 検証ステータスが「error」 ===
    expect(validationResult.status).toBe("error");

    // === Assertion 3: 欠落項目が特定されている ===
    expect(validationResult.missingFields).toEqual(
      expect.arrayContaining(["customerName", "billingDate"])
    );
    expect(validationResult.missingFields.length).toBe(2);

    // === Assertion 4: エラーメッセージに欠落項目が明記されている ===
    expect(validationResult.errorMessage).toMatch(/顧客名/);
    expect(validationResult.errorMessage).toMatch(/請求日/);

    // === Assertion 5: エラーメッセージが具体的な欠落項目を列挙 ===
    expect(validationResult.errorMessage).toContain("customerName");
    expect(validationResult.errorMessage).toContain("billingDate");

    // === Assertion 6: ログエントリが記録されている ===
    expect(validationResult.logs).toBeDefined();
    expect(validationResult.logs.length).toBeGreaterThan(0);

    // === Assertion 7: ログに検証失敗の詳細情報が含まれている ===
    const failureLog = validationResult.logs.find(
      (log) => log.level === "error"
    );
    expect(failureLog).toBeDefined();
    expect(failureLog?.message).toMatch(/必須項目/);
    expect(failureLog?.details).toContain("customerName");
    expect(failureLog?.details).toContain("billingDate");

    // === Assertion 8: ログタイムスタンプが記録されている ===
    expect(failureLog?.timestamp).toBeDefined();
    expect(failureLog?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // === Assertion 9: 検証対象レポートIDが記録されている ===
    expect(failureLog?.reportId).toBe("RPT-2024-001");

    // === Assertion 10: 正常系検証として、すべての必須項目が存在する場合 ===
    const reportWithAllFields = {
      reportId: "RPT-2024-002",
      customerId: "CUST-456",
      customerName: "株式会社ABC",
      billingAmount: 200000,
      billingDate: new Date("2024-01-15"),
      dueDate: new Date("2024-02-15"),
      serviceType: "営業成果報酬",
      generatedAt: new Date("2024-01-15T10:00:00Z"),
    };

    const validResult = validateGeneratedReport(reportWithAllFields);
    expect(validResult.isValid).toBe(true);
    expect(validResult.status).toBe("success");
    expect(validResult.missingFields.length).toBe(0);
  });
});