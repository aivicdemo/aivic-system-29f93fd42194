import { processPriorityProductionInstructions } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  // SCEN-375
  test("同一緊急度の指示同士で作成時刻順に処理順序が調整される", () => {
    const productionInstructions = [
      {
        id: "inst_C",
        priorityLevel: 1,
        estimatedDuration: 120,
        createdTime: "2024-01-15T11:00:00Z"
      },
      {
        id: "inst_A", 
        priorityLevel: 1,
        estimatedDuration: 60,
        createdTime: "2024-01-15T09:00:00Z"
      },
      {
        id: "inst_B",
        priorityLevel: 1, 
        estimatedDuration: 90,
        createdTime: "2024-01-15T10:00:00Z"
      }
    ];

    const emergencyLevel = 1;
    const currentWorkload = { capacity: 100, currentLoad: 50 };

    const result = processPriorityProductionInstructions(
      productionInstructions,
      emergencyLevel,
      currentWorkload
    );

    expect(result.prioritizedInstructions).toHaveLength(3);
    expect(result.prioritizedInstructions[0].id).toBe("inst_A");
    expect(result.prioritizedInstructions[1].id).toBe("inst_B"); 
    expect(result.prioritizedInstructions[2].id).toBe("inst_C");

    expect(result.scheduledStartTimes["inst_A"]).toBeDefined();
    expect(result.scheduledStartTimes["inst_B"]).toBeDefined();
    expect(result.scheduledStartTimes["inst_C"]).toBeDefined();

    expect(result.adjustedInstructions).toHaveLength(0);
    expect(result.impactAnalysis).toContain("優先度処理完了");
  });
});