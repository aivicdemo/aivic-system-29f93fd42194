import { processPriorityProductionInstructions } from "../../src/logic/it-1";

describe("生産指示優先度調整機能", () => {
  test("緊急度Highの指示が通常指示より優先的に処理順序が調整される", () => {
    // SCEN-374

    const productionInstructions = [
      {
        id: "PI001",
        priorityLevel: 3,
        status: "pending",
        estimatedDuration: 120,
        createdAt: new Date("2024-01-15T09:00:00Z"),
        title: "通常指示1"
      },
      {
        id: "PI002", 
        priorityLevel: 3,
        status: "pending",
        estimatedDuration: 90,
        createdAt: new Date("2024-01-15T09:30:00Z"),
        title: "通常指示2"
      },
      {
        id: "PI003",
        priorityLevel: 1,
        status: "pending", 
        estimatedDuration: 150,
        createdAt: new Date("2024-01-15T10:00:00Z"),
        title: "緊急指示1"
      }
    ];

    const emergencyLevel = 2;
    const currentWorkload = {
      currentCapacity: 80,
      maxCapacity: 100,
      availableSlots: 3
    };

    const result = processPriorityProductionInstructions(
      productionInstructions,
      emergencyLevel,
      currentWorkload
    );

    // 優先度順に並び替えられ、緊急指示が最初に配置される
    expect(result.prioritizedInstructions).toHaveLength(3);
    expect(result.prioritizedInstructions[0].id).toBe("PI003");
    expect(result.prioritizedInstructions[0].priorityLevel).toBe(1);
    expect(result.prioritizedInstructions[1].id).toBe("PI001");
    expect(result.prioritizedInstructions[2].id).toBe("PI002");

    // スケジュール開始時刻が設定される（緊急指示が最初）
    expect(result.scheduledStartTimes["PI003"]).toEqual(new Date("2024-01-15T10:00:00Z"));
    expect(result.scheduledStartTimes["PI001"]).toEqual(new Date("2024-01-15T12:30:00Z"));
    expect(result.scheduledStartTimes["PI002"]).toEqual(new Date("2024-01-15T14:30:00Z"));

    // 通常指示が調整対象として識別される
    expect(result.adjustedInstructions).toHaveLength(2);
    expect(result.adjustedInstructions[0].id).toBe("PI001");
    expect(result.adjustedInstructions[1].id).toBe("PI002");

    // 影響分析結果が含まれる
    expect(result.impactAnalysis).toBe("緊急指示により通常指示2件のスケジュール調整が発生");
  });
});