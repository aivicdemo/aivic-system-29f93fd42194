import { rankImprovementProposalsByPriority } from "../../src/logic/it-1-br-6-2-1";

describe("複数改善提案の優先度自動ランク付け機能", () => {
  // SCEN-1263
  test("同一の優先度スコアを持つ改善提案がタイムスタンプの昇順で順序付けされること", () => {
    const proposal_c = {
      proposal_id: "prop_c",
      priority_score: 85,
      timestamp: new Date("2024-01-15T09:55:00Z"),
      improvement_area: "data_quality",
      estimated_effect: "5%",
    };

    const proposal_a = {
      proposal_id: "prop_a",
      priority_score: 85,
      timestamp: new Date("2024-01-15T10:00:00Z"),
      improvement_area: "model_drift",
      estimated_effect: "7%",
    };

    const proposal_b = {
      proposal_id: "prop_b",
      priority_score: 85,
      timestamp: new Date("2024-01-15T10:05:00Z"),
      improvement_area: "format_change",
      estimated_effect: "6%",
    };

    const proposals = [proposal_a, proposal_b, proposal_c];

    const ranked_proposals = rankImprovementProposalsByPriority(proposals);

    expect(ranked_proposals).toHaveLength(3);

    expect(ranked_proposals[0].proposal_id).toBe("prop_c");
    expect(ranked_proposals[0].priority_score).toBe(85);
    expect(ranked_proposals[0].timestamp).toEqual(
      new Date("2024-01-15T09:55:00Z")
    );

    expect(ranked_proposals[1].proposal_id).toBe("prop_a");
    expect(ranked_proposals[1].priority_score).toBe(85);
    expect(ranked_proposals[1].timestamp).toEqual(
      new Date("2024-01-15T10:00:00Z")
    );

    expect(ranked_proposals[2].proposal_id).toBe("prop_b");
    expect(ranked_proposals[2].priority_score).toBe(85);
    expect(ranked_proposals[2].timestamp).toEqual(
      new Date("2024-01-15T10:05:00Z")
    );

    for (let i = 0; i < ranked_proposals.length - 1; i++) {
      const current_time = ranked_proposals[i].timestamp.getTime();
      const next_time = ranked_proposals[i + 1].timestamp.getTime();
      expect(current_time).toBeLessThanOrEqual(next_time);
    }
  });
});