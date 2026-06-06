import { convertToUnifiedProductionInstructionFormat } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("統一フォーマット生成機能 - 未対応の入力方法が指定された場合にデフォルトフォーマットが生成される", () => {
    // SCEN-364
    const productionInstruction = {
      productSpec: "製品A仕様書",
      deliveryDate: "2024-03-15",
      processId: "PROC001",
      materials: ["材料A", "材料B"],
      workerId: "WORKER001"
    };

    const targetDepartments = [
      { id: "DEPT001", name: "製造部門1" },
      { id: "DEPT002", name: "製造部門2" }
    ];

    const departmentInputMethods = {
      "DEPT001": "voice",
      "DEPT002": "handwriting"
    };

    const result = convertToUnifiedProductionInstructionFormat(
      productionInstruction,
      targetDepartments,
      departmentInputMethods
    );

    expect(result.unifiedFormatInstruction).toBeDefined();
    expect(result.unifiedFormatInstruction).toContain("製品A仕様書");
    expect(result.unifiedFormatInstruction).toContain("2024-03-15");

    expect(result.departmentSpecificFormats).toBeDefined();
    expect(result.departmentSpecificFormats["DEPT001"]).toBeDefined();
    expect(result.departmentSpecificFormats["DEPT002"]).toBeDefined();

    expect(result.distributionStatus).toBe("completed");
    expect(result.deliveryTimestamp).toBeInstanceOf(Date);
  });
});