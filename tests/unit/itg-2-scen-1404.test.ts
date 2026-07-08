import { prioritizeReadingErrors } from "../../src/logic/it-6-2-2-2";

describe("読取誤り優先度判定機能", () => {
  test("SCEN-1404: 誤りの深刻度（金額影響度）と影響範囲に基づいて修正優先度が正確に決定される", () => {
    // テストデータ: 異なる金額影響度と影響範囲を持つ読取誤り
    const readingErrors = [
      {
        error_id: "ERR001",
        amount_impact_degree: 95,
        affected_scope: "全体",
        affected_assessment_count: 150,
      },
      {
        error_id: "ERR002",
        amount_impact_degree: 75,
        affected_scope: "複数査定",
        affected_assessment_count: 45,
      },
      {
        error_id: "ERR003",
        amount_impact_degree: 35,
        affected_scope: "単一査定",
        affected_assessment_count: 1,
      },
      {
        error_id: "ERR004",
        amount_impact_degree: 85,
        affected_scope: "単一査定",
        affected_assessment_count: 2,
      },
      {
        error_id: "ERR005",
        amount_impact_degree: 45,
        affected_scope: "複数査定",
        affected_assessment_count: 30,
      },
      {
        error_id: "ERR006",
        amount_impact_degree: 90,
        affected_scope: "複数査定",
        affected_assessment_count: 60,
      },
    ];

    // 読取誤り優先度判定機能を実行
    const result = prioritizeReadingErrors(readingErrors);

    // 結果の構造を検証
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(6);

    // 優先度順序の検証: 最優先はERR001（高影響度+全体）
    expect(result[0].error_id).toBe("ERR001");
    expect(result[0].priority_score).toBe(9500);
    expect(result[0].priority_level).toBe("高");

    // 次点はERR006（高影響度+複数査定、かつ影響範囲が広い）
    expect(result[1].error_id).toBe("ERR006");
    expect(result[1].priority_score).toBe(5400);
    expect(result[1].priority_level).toBe("高");

    // ERR002はERR004より優先度が低い（同じ複数査定でも金額影響度で判定）
    expect(result[2].error_id).toBe("ERR004");
    expect(result[2].priority_score).toBe(170);
    expect(result[2].priority_level).toBe("中");

    expect(result[3].error_id).toBe("ERR002");
    expect(result[3].priority_score).toBe(3375);
    expect(result[3].priority_level).toBe("中");

    // ERR005は中優先度（低影響度+複数査定）
    expect(result[4].error_id).toBe("ERR005");
    expect(result[4].priority_score).toBe(1350);
    expect(result[4].priority_level).toBe("中");

    // 最後はERR003（低影響度+単一査定）
    expect(result[5].error_id).toBe("ERR003");
    expect(result[5].priority_score).toBe(35);
    expect(result[5].priority_level).toBe("低");

    // 優先度スコア計算の検証（金額影響度 × 影響範囲係数）
    // 全体: 係数 100, 複数査定: 係数 60, 単一査定: 係数 2
    expect(result[0].priority_score).toBe(95 * 100); // ERR001: 95 * 100 = 9500
    expect(result[1].priority_score).toBe(90 * 60); // ERR006: 90 * 60 = 5400
    expect(result[2].priority_score).toBe(85 * 2); // ERR004: 85 * 2 = 170
    expect(result[3].priority_score).toBe(75 * 45); // ERR002: 75 * 45 = 3375
    expect(result[4].priority_score).toBe(45 * 30); // ERR005: 45 * 30 = 1350
    expect(result[5].priority_score).toBe(35 * 1); // ERR003: 35 * 1 = 35

    // 金額影響度と影響範囲の組み合わせの整合性を検証
    // 高影響度+広範囲が最も高い優先度
    const high_wide = result.find(
      (e) => e.amount_impact_degree >= 85 && e.affected_scope === "全体"
    );
    expect(high_wide?.error_id).toBe("ERR001");

    // 高影響度+狭範囲はより優先度が低い
    const high_narrow = result.find(
      (e) => e.amount_impact_degree >= 85 && e.affected_scope === "単一査定"
    );
    expect(high_narrow?.priority_score).toBeLessThan(
      high_wide?.priority_score || 0
    );

    // 低影響度+広範囲は中程度の優先度
    const low_wide = result.find(
      (e) => e.amount_impact_degree <= 50 && e.affected_scope === "複数査定"
    );
    expect(low_wide?.priority_score).toBeLessThan(
      high_wide?.priority_score || 0
    );

    // 低影響度+狭範囲が最も低い優先度
    const low_narrow = result.find(
      (e) => e.amount_impact_degree <= 50 && e.affected_scope === "単一査定"
    );
    expect(low_narrow?.priority_score).toBeLessThan(
      low_wide?.priority_score || 0
    );

    // 優先度レベルの正確性を検証
    const high_priority = result.filter((e) => e.priority_level === "高");
    const medium_priority = result.filter((e) => e.priority_level === "中");
    const low_priority = result.filter((e) => e.priority_level === "低");

    expect(high_priority.length).toBeGreaterThan(0);
    expect(medium_priority.length).toBeGreaterThan(0);
    expect(low_priority.length).toBeGreaterThan(0);

    // 優先度レベル内での順序が正確なことを検証
    for (let i = 0; i < high_priority.length - 1; i++) {
      expect(high_priority[i].priority_score).toBeGreaterThanOrEqual(
        high_priority[i + 1].priority_score
      );
    }
    for (let i = 0; i < medium_priority.length - 1; i++) {
      expect(medium_priority[i].priority_score).toBeGreaterThanOrEqual(
        medium_priority[i + 1].priority_score
      );
    }

    // 全体的な優先度の降順を確認
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].priority_score).toBeGreaterThanOrEqual(
        result[i + 1].priority_score
      );
    }
  });
});