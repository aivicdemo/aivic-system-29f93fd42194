import { describe, test, expect } from "@jest/globals";
import {
  rankImprovementMeasures,
} from "../../src/logic/it-6-2-2-2";

describe("改善施策優先度判定機能", () => {
  // SCEN-1201
  test("複数の改善施策候補が同一の総合優先度スコアの場合に二次判定基準により順序付けられる", () => {
    // 総合優先度スコア 85.0 で同一の 3 件の改善施策候補を作成
    const measureCandidates = [
      {
        measure_id: "M001",
        measure_name: "学習データ追加",
        total_priority_score: 85.0,
        implementation_difficulty_score: 65.0, // 低い
        effect_immediacy_score: 80.0, // 高い
        related_feedback_count: 45, // 多い
      },
      {
        measure_id: "M002",
        measure_name: "判定ロジック修正",
        total_priority_score: 85.0,
        implementation_difficulty_score: 75.0, // 中程度
        effect_immediacy_score: 70.0, // 中程度
        related_feedback_count: 38, // 中程度
      },
      {
        measure_id: "M003",
        measure_name: "パラメータ調整",
        total_priority_score: 85.0,
        implementation_difficulty_score: 55.0, // 最も低い
        effect_immediacy_score: 75.0, // 中程度
        related_feedback_count: 42, // 中程度
      },
    ];

    // 二次判定基準の優先順位ルール:
    // 1. 実装難易度スコアが低い順（実装容易性を優先）
    // 2. 効果の即時性スコアが高い順（迅速な効果を優先）
    // 3. 関連指摘件数が多い順（影響範囲が大きい順）

    const result = rankImprovementMeasures(measureCandidates);

    // 期待される順序:
    // 1. M003 (実装難易度 55.0 - 最も低い)
    // 2. M001 (実装難易度 65.0、効果即時性 80.0 - 次点で低く、即時性が高い)
    // 3. M002 (実装難易度 75.0 - 最も高い)

    expect(result).toHaveLength(3);
    expect(result[0].measure_id).toBe("M003");
    expect(result[0].measure_name).toBe("パラメータ調整");
    expect(result[0].ranking_order).toBe(1);
    expect(result[0].secondary_criteria_used).toEqual([
      "implementation_difficulty_score",
    ]);

    expect(result[1].measure_id).toBe("M001");
    expect(result[1].measure_name).toBe("学習データ追加");
    expect(result[1].ranking_order).toBe(2);
    expect(result[1].secondary_criteria_used).toEqual([
      "implementation_difficulty_score",
      "effect_immediacy_score",
    ]);

    expect(result[2].measure_id).toBe("M002");
    expect(result[2].measure_name).toBe("判定ロジック修正");
    expect(result[2].ranking_order).toBe(3);
    expect(result[2].secondary_criteria_used).toEqual([
      "implementation_difficulty_score",
    ]);

    // 総合優先度スコアが同一であることを確認
    expect(result[0].total_priority_score).toBe(85.0);
    expect(result[1].total_priority_score).toBe(85.0);
    expect(result[2].total_priority_score).toBe(85.0);

    // 二次判定基準の適用状況を検証
    expect(result[0].implementation_difficulty_score).toBe(55.0);
    expect(result[1].implementation_difficulty_score).toBe(65.0);
    expect(result[2].implementation_difficulty_score).toBe(75.0);

    // 効果の即時性スコアが二次判定基準として適切に反映されていることを確認
    // (M001 と M002 が同一難易度ではないため、ここでは M001 の即時性が確認できるのみ)
    expect(result[1].effect_immediacy_score).toBe(80.0);
  });
});