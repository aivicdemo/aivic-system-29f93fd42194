import { calculateImprovisementProposalPriority } from "../../src/logic/it-1-br-6-2-1";

describe("複数改善提案の優先度自動ランク付け機能", () => {
  // SCEN-1261
  test("OCR精度低下・AI判定精度低下・ユーザーフィードバック件数急増が同時発生時、改善提案が優先度スコアで正確にランク付けされる", () => {
    // 改善提案1: OCR精度低下
    const proposal_ocr_degradation = {
      proposal_id: "PROP_001",
      proposal_type: "OCR_ACCURACY_DEGRADATION",
      detected_metric_value: 68,
      threshold_value: 75,
      variance_from_threshold: 75 - 68,
      business_impact_score: 85,
      implementation_difficulty_score: 45,
    };

    // 改善提案2: AI判定精度低下
    const proposal_ai_degradation = {
      proposal_id: "PROP_002",
      proposal_type: "AI_JUDGMENT_ACCURACY_DEGRADATION",
      detected_metric_value: 72,
      threshold_value: 80,
      variance_from_threshold: 80 - 72,
      business_impact_score: 90,
      implementation_difficulty_score: 55,
    };

    // 改善提案3: ユーザーフィードバック件数急増
    const proposal_feedback_surge = {
      proposal_id: "PROP_003",
      proposal_type: "USER_FEEDBACK_SURGE",
      detected_metric_value: 125,
      threshold_value: 80,
      variance_from_threshold: 125 - 80,
      business_impact_score: 70,
      implementation_difficulty_score: 35,
    };

    const proposals = [
      proposal_ocr_degradation,
      proposal_ai_degradation,
      proposal_feedback_surge,
    ];

    // 優先度スコア計算実行
    const result = calculateImprovisementProposalPriority({
      proposals: proposals,
      reference_date: new Date("2024-11-15T09:00:00Z"),
    });

    // 優先度スコア計算の論理:
    // 優先度スコア = (業務影響度スコア × 1.5) - (実装難度スコア × 0.8) + (閾値乖離度 × 2)
    // PROP_001: (85 × 1.5) - (45 × 0.8) + (7 × 2) = 127.5 - 36 + 14 = 105.5
    // PROP_002: (90 × 1.5) - (55 × 0.8) + (8 × 2) = 135 - 44 + 16 = 107
    // PROP_003: (70 × 1.5) - (35 × 0.8) + (45 × 2) = 105 - 28 + 90 = 167

    // 期待される優先度順: PROP_003 > PROP_002 > PROP_001
    expect(result.ranked_proposals).toHaveLength(3);

    // 第1位: フィードバック件数急増（最高優先度）
    expect(result.ranked_proposals[0].proposal_id).toBe("PROP_003");
    expect(result.ranked_proposals[0].priority_score).toBe(167);
    expect(result.ranked_proposals[0].priority_rank).toBe(1);

    // 第2位: AI判定精度低下
    expect(result.ranked_proposals[1].proposal_id).toBe("PROP_002");
    expect(result.ranked_proposals[1].priority_score).toBe(107);
    expect(result.ranked_proposals[1].priority_rank).toBe(2);

    // 第3位: OCR精度低下
    expect(result.ranked_proposals[2].proposal_id).toBe("PROP_001");
    expect(result.ranked_proposals[2].priority_score).toBe(105.5);
    expect(result.ranked_proposals[2].priority_rank).toBe(3);

    // 結果セットの構造検証
    expect(result.total_proposals_count).toBe(3);
    expect(result.ranking_completed_at).toBeDefined();
    expect(result.ranking_completed_at).toEqual(new Date("2024-11-15T09:00:00Z"));

    // スコアがスコアの降順でソートされていることを確認
    for (let i = 0; i < result.ranked_proposals.length - 1; i++) {
      expect(result.ranked_proposals[i].priority_score).toBeGreaterThanOrEqual(
        result.ranked_proposals[i + 1].priority_score
      );
    }

    // 提案が実行可能順序として優先度順にランク付けされたことを確認
    expect(result.implementation_sequence).toEqual([
      "PROP_003",
      "PROP_002",
      "PROP_001",
    ]);

    // 優先度管理画面用の表示データ構造が生成されていること
    expect(result.display_data).toBeDefined();
    expect(result.display_data.priority_visualization).toHaveLength(3);

    // 各改善提案の詳細情報が正確に出力されていることを確認
    expect(result.ranked_proposals[0]).toEqual({
      proposal_id: "PROP_003",
      proposal_type: "USER_FEEDBACK_SURGE",
      priority_rank: 1,
      priority_score: 167,
      business_impact_score: 70,
      implementation_difficulty_score: 35,
      variance_from_threshold: 45,
      recommendation_status: "HIGHEST_PRIORITY",
    });

    expect(result.ranked_proposals[1]).toEqual({
      proposal_id: "PROP_002",
      proposal_type: "AI_JUDGMENT_ACCURACY_DEGRADATION",
      priority_rank: 2,
      priority_score: 107,
      business_impact_score: 90,
      implementation_difficulty_score: 55,
      variance_from_threshold: 8,
      recommendation_status: "HIGH_PRIORITY",
    });

    expect(result.ranked_proposals[2]).toEqual({
      proposal_id: "PROP_001",
      proposal_type: "OCR_ACCURACY_DEGRADATION",
      priority_rank: 3,
      priority_score: 105.5,
      business_impact_score: 85,
      implementation_difficulty_score: 45,
      variance_from_threshold: 7,
      recommendation_status: "MEDIUM_PRIORITY",
    });

    // 実行可能リソース制約下での段階的実行計画が生成されていること
    expect(result.phased_execution_plan).toBeDefined();
    expect(result.phased_execution_plan.phase_1).toEqual(["PROP_003"]);
    expect(result.phased_execution_plan.phase_2).toEqual(["PROP_002"]);
    expect(result.phased_execution_plan.phase_3).toEqual(["PROP_001"]);
  });
});