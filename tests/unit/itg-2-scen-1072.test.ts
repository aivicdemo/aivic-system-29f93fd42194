import { assignEducationPriorityByCapacityGap } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  test("SCEN-1072: 教育指導優先度の自動付与 - 能力差スコアに基づいて優先度が正しく付与される", () => {
    // テストデータ: 能力差スコアが異なる3つの査定対象者レコード
    const assessors = [
      {
        assessor_id: "ASS001",
        assessor_name: "新人査定員A",
        capacity_gap_score: 80,
        assigned_priority: null,
        assigned_timestamp: null,
      },
      {
        assessor_id: "ASS002",
        assessor_name: "中堅査定員B",
        capacity_gap_score: 50,
        assigned_priority: null,
        assigned_timestamp: null,
      },
      {
        assessor_id: "ASS003",
        assessor_name: "経験者査定員C",
        capacity_gap_score: 20,
        assigned_priority: null,
        assigned_timestamp: null,
      },
    ];

    const base_timestamp = new Date("2024-01-15T10:30:00Z");

    // 教育指導優先度の自動付与機能を実行
    const result = assignEducationPriorityByCapacityGap(assessors, base_timestamp);

    // 結果の確認: 3つのレコードがすべて返される
    expect(result).toHaveLength(3);

    // 能力差スコア80の対象者の優先度が「高」に付与されていることを確認
    const high_priority_assessor = result.find(
      (a) => a.assessor_id === "ASS001"
    );
    expect(high_priority_assessor?.assigned_priority).toBe("高");
    expect(high_priority_assessor?.assigned_timestamp).toBe(
      base_timestamp.toISOString()
    );

    // 能力差スコア50の対象者の優先度が「中」に付与されていることを確認
    const medium_priority_assessor = result.find(
      (a) => a.assessor_id === "ASS002"
    );
    expect(medium_priority_assessor?.assigned_priority).toBe("中");
    expect(medium_priority_assessor?.assigned_timestamp).toBe(
      base_timestamp.toISOString()
    );

    // 能力差スコア20の対象者の優先度が「低」に付与されていることを確認
    const low_priority_assessor = result.find(
      (a) => a.assessor_id === "ASS003"
    );
    expect(low_priority_assessor?.assigned_priority).toBe("低");
    expect(low_priority_assessor?.assigned_timestamp).toBe(
      base_timestamp.toISOString()
    );

    // すべての対象者に対して適切な優先度が付与されていることを確認
    expect(result.every((a) => a.assigned_priority !== null)).toBe(true);

    // 付与時刻がすべて記録されていることを確認
    expect(result.every((a) => a.assigned_timestamp !== null)).toBe(true);
  });
});