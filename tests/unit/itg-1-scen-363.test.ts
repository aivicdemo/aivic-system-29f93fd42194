import { convertToUnifiedProductionInstructionFormat } from '../../src/logic/it-1';

describe("統一フォーマット生成機能", () => {
  test("ハンディスキャナ対応部署でバーコード付きフォーマットが生成される", () => {
    // SCEN-363
    const productionInstruction = {
      productSpecification: {
        productNumber: "P-2024-001",
        productName: "高強度アルミニウム合金パネル",
        specifications: "厚み3.0mm、サイズ1200×800mm、表面処理：アルマイト",
        quantity: 150
      },
      deliveryDate: "2024-02-15",
      processSteps: [
        "材料切断", "成形加工", "表面処理", "品質検査", "梱包"
      ],
      materialsList: [
        { materialId: "AL-6061", quantity: 180, unit: "kg" },
        { materialId: "CHEM-001", quantity: 5, unit: "L" }
      ],
      assignedWorker: "田中太郎"
    };

    const targetDepartments = [
      { id: "DEPT-001", name: "成形加工部", location: "工場A-2F" },
      { id: "DEPT-002", name: "表面処理部", location: "工場B-1F" }
    ];

    const departmentInputMethods = {
      "DEPT-001": "handy_scanner",
      "DEPT-002": "handy_scanner"
    };

    const result = convertToUnifiedProductionInstructionFormat(
      productionInstruction,
      targetDepartments,
      departmentInputMethods
    );

    expect(result.unifiedFormatInstruction).toContain("P-2024-001");
    expect(result.unifiedFormatInstruction).toContain("高強度アルミニウム合金パネル");
    expect(result.unifiedFormatInstruction).toContain("2024-02-15");
    
    expect(result.departmentSpecificFormats["DEPT-001"]).toBeDefined();
    expect(result.departmentSpecificFormats["DEPT-002"]).toBeDefined();
    
    expect(result.departmentSpecificFormats["DEPT-001"]).toContain("BARCODE:");
    expect(result.departmentSpecificFormats["DEPT-001"]).toContain("QR:");
    expect(result.departmentSpecificFormats["DEPT-002"]).toContain("BARCODE:");
    expect(result.departmentSpecificFormats["DEPT-002"]).toContain("QR:");
    
    expect(result.distributionStatus).toBe("completed");
    expect(result.deliveryTimestamp).toBeInstanceOf(Date);
  });
});