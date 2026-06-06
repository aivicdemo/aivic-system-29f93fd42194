import { processPriorityProductionInstructions } from "../../src/logic/it-1";

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("未定義の緊急度が設定された生産指示に対してエラーが発生し、適切なエラーメッセージが表示される", () => {
    // SCEN-376
    const productionInstructions = [
      {
        id: "INST001",
        productName: "建材A",
        quantity: 100,
        deadline: "2024-01-20",
        priorityLevel: "UNDEFINED",
        estimatedDuration: 120
      }
    ];
    const emergencyLevel = 2;
    const currentWorkload = { utilizationRate: 75, availableCapacity: 200 };

    expect(() => processPriorityProductionInstructions(productionInstructions, emergencyLevel, currentWorkload))
      .toThrow(/緊急度/);
  });
});