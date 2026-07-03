import { validateAndCategorizeVerificationResult } from "../../src/logic/it-1781935279444-2-2-1";

describe("検証結果と根拠資料の構造化整理", () => {
  // SCEN-1180
  test("判定内容が正確・誤り・要確認の3種類で正しく分類される", () => {
    // === Test Data Setup ===
    const accurateCase = {
      salesDataValue: 150,
      contractCondition: 150,
      reportedValue: 150,
      previousMonthValue: 140,
      supportingDocuments: [
        { type: "sales_record", id: "SR-001", timestamp: "2024-01-15T10:00:00Z" },
        { type: "contract", id: "CT-001", timestamp: "2024-01-01T00:00:00Z" },
      ],
    };

    const errorCase = {
      salesDataValue: 150,
      contractCondition: 150,
      reportedValue: 120,
      previousMonthValue: 140,
      supportingDocuments: [
        { type: "sales_record", id: "SR-002", timestamp: "2024-01-15T10:30:00Z" },
        { type: "contract", id: "CT-001", timestamp: "2024-01-01T00:00:00Z" },
      ],
    };

    const needsConfirmationCase = {
      salesDataValue: 150,
      contractCondition: 150,
      reportedValue: 150,
      previousMonthValue: 100,
      supportingDocuments: [
        { type: "sales_record", id: "SR-003", timestamp: "2024-01-15T11:00:00Z" },
        { type: "proposal", id: "PRP-001", timestamp: "2024-01-10T09:00:00Z" },
        { type: "email", id: "EM-001", timestamp: "2024-01-12T14:30:00Z" },
      ],
    };

    // === Verify "Accurate" Classification ===
    const accurateResult = validateAndCategorizeVerificationResult(accurateCase);
    expect(accurateResult.classification).toBe("正確");
    expect(accurateResult.matchPercentage).toBe(100);
    expect(accurateResult.supportingDocuments).toEqual([
      { type: "sales_record", id: "SR-001", timestamp: "2024-01-15T10:00:00Z" },
      { type: "contract", id: "CT-001", timestamp: "2024-01-01T00:00:00Z" },
    ]);
    expect(accurateResult.discrepancyReason).toBe(null);

    // === Verify "Error" Classification ===
    const errorResult = validateAndCategorizeVerificationResult(errorCase);
    expect(errorResult.classification).toBe("誤り");
    expect(errorResult.matchPercentage).toBe(80);
    expect(errorResult.discrepancyAmount).toBe(-30);
    expect(errorResult.discrepancyReason).toBe("報告値が売上データと不一致");
    expect(errorResult.supportingDocuments).toEqual([
      { type: "sales_record", id: "SR-002", timestamp: "2024-01-15T10:30:00Z" },
      { type: "contract", id: "CT-001", timestamp: "2024-01-01T00:00:00Z" },
    ]);

    // === Verify "Needs Confirmation" Classification ===
    const confirmationResult = validateAndCategorizeVerificationResult(needsConfirmationCase);
    expect(confirmationResult.classification).toBe("要確認");
    expect(confirmationResult.matchPercentage).toBe(100);
    expect(confirmationResult.anomalyIndicator).toBe(true);
    expect(confirmationResult.anomalyType).toBe("前月比上昇");
    expect(confirmationResult.anomalyPercentage).toBe(50);
    expect(confirmationResult.supportingDocuments).toEqual([
      { type: "sales_record", id: "SR-003", timestamp: "2024-01-15T11:00:00Z" },
      { type: "proposal", id: "PRP-001", timestamp: "2024-01-10T09:00:00Z" },
      { type: "email", id: "EM-001", timestamp: "2024-01-12T14:30:00Z" },
    ]);

    // === Verify All Classifications Are Consistent ===
    expect([accurateResult.classification, errorResult.classification, confirmationResult.classification]).toEqual(
      expect.arrayContaining(["正確", "誤り", "要確認"]),
    );

    // === Verify Supporting Documents Structure ===
    [accurateResult, errorResult, confirmationResult].forEach((result) => {
      expect(result.supportingDocuments).toBeDefined();
      expect(Array.isArray(result.supportingDocuments)).toBe(true);
      result.supportingDocuments.forEach((doc: any) => {
        expect(doc).toHaveProperty("type");
        expect(doc).toHaveProperty("id");
        expect(doc).toHaveProperty("timestamp");
      });
    });

    // === Verify Result Structure Consistency ===
    expect(accurateResult).toHaveProperty("classification");
    expect(accurateResult).toHaveProperty("matchPercentage");
    expect(accurateResult).toHaveProperty("supportingDocuments");
    expect(errorResult).toHaveProperty("discrepancyReason");
    expect(confirmationResult).toHaveProperty("anomalyIndicator");
  });
});