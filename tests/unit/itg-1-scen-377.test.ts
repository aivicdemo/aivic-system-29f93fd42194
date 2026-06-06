import { processPriorityProductionInstructions } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("緊急度がMediumの指示が適切な順序で調整される", () => {
    // SCEN-377
    const productionInstructions = [
      {
        id: "PI001",
        priorityLevel: 2, // Medium (早めの作成)
        estimatedDuration: 120,
        status: "pending",
        createdAt: new Date("2024-01-15T09:00:00Z")
      },
      {
        id: "PI002", 
        priorityLevel: 2, // Medium (後の作成)
        estimatedDuration: 180,
        status: "pending",
        createdAt: new Date("2024-01-15T10:30:00Z")
      },
      {
        id: "PI003",
        priorityLevel: 1, // High
        estimatedDuration: 90,
        status: "pending",
        createdAt: new Date("2024-01-15T11:00:00Z")
      },
      {
        id: "PI004",
        priorityLevel: 3, // Low
        estimatedDuration: 150,
        status: "pending",
        createdAt: new Date("2024-01-15T08:00:00Z")
      }
    ];

    const emergencyLevel = 2;
    const currentWorkload = { capacity: 1000, current: 600 };

    const result = processPriorityProductionInstructions(
      productionInstructions,
      emergencyLevel,
      currentWorkload
    );

    // 優先度順の並び: High(1) → Medium(2,2) → Low(3)
    // Medium内では作成日時の古い順
    expect(result.prioritizedInstructions).toHaveLength(4);
    expect(result.prioritizedInstructions[0].id).toBe("PI003"); // High
    expect(result.prioritizedInstructions[1].id).toBe("PI001"); // Medium (早い作成時刻)
    expect(result.prioritizedInstructions[2].id).toBe("PI002"); // Medium (遅い作成時刻) 
    expect(result.prioritizedInstructions[3].id).toBe("PI004"); // Low

    // スケジュール時刻の連続性確認
    expect(result.scheduledStartTimes["PI003"]).toBeDefined();
    expect(result.scheduledStartTimes["PI001"]).toBeDefined();
    expect(result.scheduledStartTimes["PI002"]).toBeDefined();
    expect(result.scheduledStartTimes["PI004"]).toBeDefined();

    // 調整対象の特定
    expect(result.adjustedInstructions).toHaveLength(1);
    expect(result.adjustedInstructions[0].id).toBe("PI004");

    // 影響分析結果
    expect(result.impactAnalysis).toContain("緊急指示の優先処理により");
  });
});