import { generateExplanationMaterial } from "../../src/logic/it-6-3-1";

describe("査定結果説明資料の自動生成・配信機能", () => {
  test("SCEN-755: 相場乖離データが存在しない場合、説明資料生成がエラーハンドルされる", () => {
    const assessmentCaseId = "CASE-2024-001";
    const assessmentDataWithoutDeviation = {
      assessmentCaseId: assessmentCaseId,
      estimateAmount: 1500000,
      estimateQuantity: 100,
      unitPrice: 15000,
      deviationRate: null,
      deviationAmount: null,
      referenceDataCount: 0,
      correctionFactor: 1.0,
      assessmentEmployeeId: "EMP-001",
      assessmentTimestamp: "2024-01-15T10:30:00Z",
      judgmentLogicApplied: "LOGIC-STD-001",
    };

    expect(() =>
      generateExplanationMaterial(assessmentDataWithoutDeviation)
    ).toThrow(/乖離データ/);
  });
});