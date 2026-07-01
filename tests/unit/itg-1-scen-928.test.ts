import { prioritizeImprovementItems } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-928: [edge] 改善項目の優先度判定・選別機能 - 優先度が同一の複数の改善項目が存在する場合、副判定基準に基づいて順序付けられる
  test("should order improvement items by secondary criteria when priority level is identical", () => {
    const improvement_items = [
      {
        improvement_item_id: "imp_001",
        priority_level: 2,
        impact_score: 65,
        occurrence_frequency: 3,
        resolution_cost: 8500,
      },
      {
        improvement_item_id: "imp_002",
        priority_level: 2,
        impact_score: 85,
        occurrence_frequency: 2,
        resolution_cost: 5000,
      },
      {
        improvement_item_id: "imp_003",
        priority_level: 2,
        impact_score: 75,
        occurrence_frequency: 5,
        resolution_cost: 12000,
      },
    ];

    const result = prioritizeImprovementItems(improvement_items);

    expect(result).toHaveLength(3);
    expect(result[0].improvement_item_id).toBe("imp_002");
    expect(result[0].impact_score).toBe(85);
    expect(result[1].improvement_item_id).toBe("imp_003");
    expect(result[1].occurrence_frequency).toBe(5);
    expect(result[2].improvement_item_id).toBe("imp_001");
    expect(result[2].impact_score).toBe(65);
  });
});