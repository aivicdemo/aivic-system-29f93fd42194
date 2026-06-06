import { convertToUnifiedProductionInstructionFormat } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("統一フォーマット生成機能 - 部署ごとの入力方法に対応した統一フォーマットが生成される", () => {
    // SCEN-362
    const productionInstruction = {
      productSpecification: "製品A 寸法:100x50x20mm 材質:ステンレス",
      deliveryDate: "2024-02-15",
      processes: ["切削加工", "研磨", "検査"],
      materials: ["ステンレス板材", "研磨剤"],
      assignedWorker: "田中太郎"
    };

    const targetDepartments = [
      { id: "manufacturing", name: "製造部" },
      { id: "quality", name: "品質管理部" },
      { id: "materials", name: "資材調達部" }
    ];

    const departmentInputMethods = {
      "manufacturing": "handy_scanner",
      "quality": "manual_input",
      "materials": "manual_input"
    };

    const result = convertToUnifiedProductionInstructionFormat(
      productionInstruction,
      targetDepartments,
      departmentInputMethods
    );

    expect(result.unifiedFormatInstruction).toContain("製品A");
    expect(result.unifiedFormatInstruction).toContain("2024-02-15");
    expect(result.unifiedFormatInstruction).toContain("切削加工");
    expect(result.unifiedFormatInstruction).toContain("田中太郎");

    expect(result.departmentSpecificFormats["manufacturing"]).toBeDefined();
    expect(result.departmentSpecificFormats["quality"]).toBeDefined();
    expect(result.departmentSpecificFormats["materials"]).toBeDefined();

    expect(result.distributionStatus).toBe("completed");
    expect(result.deliveryTimestamp).toBeInstanceOf(Date);
  });
});