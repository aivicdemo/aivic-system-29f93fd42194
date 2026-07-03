import { determineImprovementItemPriority } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能 - 改善項目優先度判定", () => {
  // SCEN-912
  test("優先度が同一の複数改善項目が存在する場合、発生頻度が高い項目が上位にソートされる", () => {
    const improvementItems = [
      {
        id: "item_a",
        title: "改善項目A",
        priorityLevel: 2,
        occurrenceFrequency: 15,
      },
      {
        id: "item_b",
        title: "改善項目B",
        priorityLevel: 2,
        occurrenceFrequency: 8,
      },
      {
        id: "item_c",
        title: "改善項目C",
        priorityLevel: 2,
        occurrenceFrequency: 20,
      },
    ];

    const result = determineImprovementItemPriority(improvementItems);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("item_c");
    expect(result[0].occurrenceFrequency).toBe(20);
    expect(result[1].id).toBe("item_a");
    expect(result[1].occurrenceFrequency).toBe(15);
    expect(result[2].id).toBe("item_b");
    expect(result[2].occurrenceFrequency).toBe(8);
  });
});