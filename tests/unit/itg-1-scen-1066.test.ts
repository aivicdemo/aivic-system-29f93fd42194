import { defineImprovementProposalProcess } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-1066: 改善提案プロセスの定義要素が不足している場合、エラーが返却される", () => {
    // ケース1: プロセス名が空白
    expect(() =>
      defineImprovementProposalProcess({
        processName: "",
        description: "改善提案の評価・承認プロセス",
        executors: ["manager_001"],
      })
    ).toThrow(/プロセス名/);

    // ケース2: 説明が空白
    expect(() =>
      defineImprovementProposalProcess({
        processName: "改善提案評価プロセス",
        description: "",
        executors: ["manager_001"],
      })
    ).toThrow(/説明/);

    // ケース3: 実行者が空配列
    expect(() =>
      defineImprovementProposalProcess({
        processName: "改善提案評価プロセス",
        description: "改善提案の評価・承認プロセス",
        executors: [],
      })
    ).toThrow(/実行者/);

    // ケース4: プロセス名と説明の両方が空白
    expect(() =>
      defineImprovementProposalProcess({
        processName: "",
        description: "",
        executors: ["manager_001"],
      })
    ).toThrow(/プロセス名|説明/);

    // ケース5: 正常な場合は定義オブジェクトが返却される
    const result = defineImprovementProposalProcess({
      processName: "改善提案評価プロセス",
      description: "改善提案の評価・承認プロセス",
      executors: ["manager_001", "manager_002"],
    });

    expect(result).toEqual({
      processName: "改善提案評価プロセス",
      description: "改善提案の評価・承認プロセス",
      executors: ["manager_001", "manager_002"],
      createdAt: expect.any(String),
      status: "active",
    });

    expect(result.processName).toBe("改善提案評価プロセス");
    expect(result.description).toBe("改善提案の評価・承認プロセス");
    expect(Array.isArray(result.executors)).toBe(true);
    expect(result.executors.length).toBe(2);
    expect(result.status).toBe("active");
  });
});