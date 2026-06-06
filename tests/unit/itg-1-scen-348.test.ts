import { calculateProcessSequenceAndTime } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("工程マスタにない工程が指定された場合にエラーが発生する", () => {
    // SCEN-348
    const productSpecification = {
      productId: "PROD001",
      productName: "標準建設資材A",
      specifications: {
        dimensions: "100x50x20mm",
        material: "スチール",
        processingRequirements: ["PROC999", "PROC002"]
      }
    };

    const deliveryDate = new Date("2024-02-15T16:00:00Z");

    const processMaster = [
      {
        processId: "PROC001",
        processName: "切断加工",
        standardTime: 30,
        prerequisites: [],
        equipment: "切断機A"
      },
      {
        processId: "PROC002", 
        processName: "溶接加工",
        standardTime: 45,
        prerequisites: ["PROC001"],
        equipment: "溶接機B"
      }
    ];

    expect(() => calculateProcessSequenceAndTime(productSpecification, deliveryDate, processMaster))
      .toThrow(/工程マスタ/);
  });
});