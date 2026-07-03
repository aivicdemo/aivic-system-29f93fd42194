import { calculateCrmRequirementPriorityScore } from "../../src/logic/it-1781935279444-1-1-1";

describe("CRM要件優先度スコア算出機能", () => {
  // SCEN-1342: [normal] CRM要件優先度スコア算出 - 営業代行企業からの機能要件が正確に優先度スコアとして算出され、高優先度要件が次期リリース対象に分類される
  test("営業代行企業から提出された機能要件が正確に優先度スコアとして算出され、スコア80以上の高優先度要件が次期リリース対象に正確に分類され、算出されたスコアがシステムに正確に記録されること", () => {
    // ケース1: 高優先度要件（重要度5、影響度5、緊急度5）- 期待スコア: 95
    const requirement_1 = {
      requirement_id: "REQ-001",
      requirement_title: "営業データ自動抽出機能",
      importance: 5,
      impact_level: 5,
      urgency: 5,
      created_at: "2024-01-15T09:00:00Z",
    };

    const result_1 = calculateCrmRequirementPriorityScore(requirement_1);

    // スコア値が0～100の数値で返されることを確認
    expect(typeof result_1.priority_score).toBe("number");
    expect(result_1.priority_score).toBeGreaterThanOrEqual(0);
    expect(result_1.priority_score).toBeLessThanOrEqual(100);

    // 重要度5 × 0.4 + 影響度5 × 0.35 + 緊急度5 × 0.25 = 2.0 + 1.75 + 1.25 = 5.0 → スケール化して95
    expect(result_1.priority_score).toBe(95);
    expect(result_1.classification).toBe("next_release");
    expect(result_1.requirement_id).toBe("REQ-001");

    // ケース2: 中優先度要件（重要度3、影響度3、緊急度3）- 期待スコア: 57
    const requirement_2 = {
      requirement_id: "REQ-002",
      requirement_title: "レポート配信スケジュール管理",
      importance: 3,
      impact_level: 3,
      urgency: 3,
      created_at: "2024-01-15T10:00:00Z",
    };

    const result_2 = calculateCrmRequirementPriorityScore(requirement_2);

    // 重要度3 × 0.4 + 影響度3 × 0.35 + 緊急度3 × 0.25 = 1.2 + 1.05 + 0.75 = 3.0 → スケール化して57
    expect(result_2.priority_score).toBe(57);
    expect(result_2.classification).toBe("future_consideration");
    expect(result_2.requirement_id).toBe("REQ-002");

    // ケース3: ボーダーラインケース（スコア80丁度）- 期待スコア: 80
    const requirement_3 = {
      requirement_id: "REQ-003",
      requirement_title: "契約書バージョン管理",
      importance: 4,
      impact_level: 4,
      urgency: 4,
      created_at: "2024-01-15T11:00:00Z",
    };

    const result_3 = calculateCrmRequirementPriorityScore(requirement_3);

    // 重要度4 × 0.4 + 影響度4 × 0.35 + 緊急度4 × 0.25 = 1.6 + 1.4 + 1.0 = 4.0 → スケール化して80
    expect(result_3.priority_score).toBe(80);
    expect(result_3.classification).toBe("next_release");
    expect(result_3.requirement_id).toBe("REQ-003");

    // ケース4: 低優先度要件（重要度1、影響度1、緊急度1）- 期待スコア: 19
    const requirement_4 = {
      requirement_id: "REQ-004",
      requirement_title: "ログ詳細表示機能",
      importance: 1,
      impact_level: 1,
      urgency: 1,
      created_at: "2024-01-15T12:00:00Z",
    };

    const result_4 = calculateCrmRequirementPriorityScore(requirement_4);

    // 重要度1 × 0.4 + 影響度1 × 0.35 + 緊急度1 × 0.25 = 0.4 + 0.35 + 0.25 = 1.0 → スケール化して19
    expect(result_4.priority_score).toBe(19);
    expect(result_4.classification).toBe("future_consideration");
    expect(result_4.requirement_id).toBe("REQ-004");

    // ケース5: 非対称優先度要件（重要度5、影響度1、緊急度3）
    const requirement_5 = {
      requirement_id: "REQ-005",
      requirement_title: "請求自動化機能拡張",
      importance: 5,
      impact_level: 1,
      urgency: 3,
      created_at: "2024-01-15T13:00:00Z",
    };

    const result_5 = calculateCrmRequirementPriorityScore(requirement_5);

    // 重要度5 × 0.4 + 影響度1 × 0.35 + 緊急度3 × 0.25 = 2.0 + 0.35 + 0.75 = 3.1 → スケール化して62
    expect(result_5.priority_score).toBe(62);
    expect(result_5.classification).toBe("future_consideration");
    expect(result_5.requirement_id).toBe("REQ-005");

    // スコア80以上の要件が正確に次期リリース対象に分類されることを確認
    const all_results = [result_1, result_2, result_3, result_4, result_5];
    const next_release_items = all_results.filter(
      (r) => r.classification === "next_release"
    );

    expect(next_release_items.length).toBe(2);
    expect(next_release_items[0].requirement_id).toBe("REQ-001");
    expect(next_release_items[0].priority_score).toBe(95);
    expect(next_release_items[1].requirement_id).toBe("REQ-003");
    expect(next_release_items[1].priority_score).toBe(80);

    // スコア80未満の要件が次期リリース対象外として分類されることを確認
    const future_consideration_items = all_results.filter(
      (r) => r.classification === "future_consideration"
    );

    expect(future_consideration_items.length).toBe(3);
    expect(future_consideration_items.map((r) => r.requirement_id)).toEqual([
      "REQ-002",
      "REQ-004",
      "REQ-005",
    ]);
    expect(future_consideration_items.every((r) => r.priority_score < 80)).toBe(
      true
    );

    // 算出されたスコアがすべてのデータに正確に記録されていることを確認
    expect(result_1).toHaveProperty("priority_score");
    expect(result_1).toHaveProperty("classification");
    expect(result_1).toHaveProperty("requirement_id");
    expect(result_1).toHaveProperty("calculated_at");

    expect(result_2).toHaveProperty("priority_score");
    expect(result_2).toHaveProperty("classification");

    expect(result_3).toHaveProperty("priority_score");
    expect(result_3).toHaveProperty("classification");

    expect(result_4).toHaveProperty("priority_score");
    expect(result_4).toHaveProperty("classification");

    expect(result_5).toHaveProperty("priority_score");
    expect(result_5).toHaveProperty("classification");

    // 優先度スコアが計算式に基づいて正確に算出されていることを複数要件で検証
    all_results.forEach((result) => {
      expect(result.priority_score).toBeGreaterThanOrEqual(0);
      expect(result.priority_score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(result.priority_score)).toBe(true);
    });

    // スコアの昇降順が正確であることを確認
    expect(result_1.priority_score).toBeGreaterThan(result_3.priority_score);
    expect(result_3.priority_score).toBeGreaterThan(result_5.priority_score);
    expect(result_5.priority_score).toBeGreaterThan(result_2.priority_score);
    expect(result_2.priority_score).toBeGreaterThan(result_4.priority_score);
  });
});