import {
  mergeConflictingImprovementProposals,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("ドキュメント更新ライフサイクル管理機能 - 改善提案の競合統合", () => {
  // SCEN-1089
  test("複数の改善提案が競合する場合に優先度付けルールに基づいて統合される", () => {
    const document_id = "doc_001";
    const document_content = "既存のドキュメント内容";
    const document_updated_at = "2024-01-15T10:00:00Z";
    const document_update_history = [];

    const proposal_high = {
      proposal_id: "prop_001",
      document_id: document_id,
      priority_level: "high",
      priority_score: 3,
      improvement_content: "セクション1を完全に書き直す内容",
      target_section: "section_1",
      conflict_type: "content_overlap",
      created_at: "2024-01-15T10:10:00Z",
      created_by: "user_001",
    };

    const proposal_medium_1 = {
      proposal_id: "prop_002",
      document_id: document_id,
      priority_level: "medium",
      priority_score: 2,
      improvement_content: "セクション1を部分的に修正する内容",
      target_section: "section_1",
      conflict_type: "content_overlap",
      created_at: "2024-01-15T10:15:00Z",
      created_by: "user_002",
    };

    const proposal_medium_2 = {
      proposal_id: "prop_003",
      document_id: document_id,
      priority_level: "medium",
      priority_score: 2,
      improvement_content: "セクション1に補足情報を追加する内容",
      target_section: "section_1",
      conflict_type: "content_overlap",
      created_at: "2024-01-15T10:20:00Z",
      created_by: "user_003",
    };

    const proposal_low = {
      proposal_id: "prop_004",
      document_id: document_id,
      priority_level: "low",
      priority_score: 1,
      improvement_content: "セクション1をマイナー編集する内容",
      target_section: "section_1",
      conflict_type: "content_overlap",
      created_at: "2024-01-15T10:25:00Z",
      created_by: "user_004",
    };

    const proposals = [
      proposal_high,
      proposal_medium_1,
      proposal_medium_2,
      proposal_low,
    ];

    const merge_result = mergeConflictingImprovementProposals({
      document_id: document_id,
      document_content: document_content,
      document_updated_at: document_updated_at,
      proposals: proposals,
      priority_rule: "max_score_first",
      conflict_resolution_strategy: "exclude_lower_priority",
    });

    expect(merge_result.merged_successfully).toBe(true);
    expect(merge_result.selected_proposal_id).toBe("prop_001");
    expect(merge_result.selected_priority_score).toBe(3);
    expect(merge_result.excluded_proposal_ids).toContain("prop_002");
    expect(merge_result.excluded_proposal_ids).toContain("prop_003");
    expect(merge_result.excluded_proposal_ids).toContain("prop_004");
    expect(merge_result.excluded_proposal_ids.length).toBe(3);

    expect(merge_result.final_content).toBe(
      "既存のドキュメント内容" +
        "\n[MERGED] Proposal prop_001 (priority: high, score: 3)" +
        "\n" +
        proposal_high.improvement_content
    );

    expect(merge_result.conflict_detection.total_proposals).toBe(4);
    expect(merge_result.conflict_detection.overlapping_section_count).toBe(4);
    expect(merge_result.conflict_detection.conflict_sections).toContain(
      "section_1"
    );

    expect(merge_result.update_history_entry.operation_type).toBe(
      "merge_proposals"
    );
    expect(merge_result.update_history_entry.merged_proposal_count).toBe(4);
    expect(merge_result.update_history_entry.priority_rule_applied).toBe(
      "max_score_first"
    );
    expect(merge_result.update_history_entry.winning_proposal_id).toBe(
      "prop_001"
    );
    expect(merge_result.update_history_entry.excluded_count).toBe(3);
    expect(merge_result.update_history_entry.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
    expect(merge_result.update_history_entry.operation_status).toBe("success");

    expect(merge_result.priority_application_details.rule_name).toBe(
      "max_score_first"
    );
    expect(merge_result.priority_application_details.proposals_ranked).toEqual([
      {
        proposal_id: "prop_001",
        priority_score: 3,
        priority_level: "high",
        rank: 1,
      },
      {
        proposal_id: "prop_002",
        priority_score: 2,
        priority_level: "medium",
        rank: 2,
      },
      {
        proposal_id: "prop_003",
        priority_score: 2,
        priority_level: "medium",
        rank: 3,
      },
      {
        proposal_id: "prop_004",
        priority_score: 1,
        priority_level: "low",
        rank: 4,
      },
    ]);

    expect(merge_result.content_integrity_check.is_consistent).toBe(true);
    expect(merge_result.content_integrity_check.validation_passed).toBe(true);
    expect(merge_result.content_integrity_check.error_count).toBe(0);

    expect(merge_result.integration_audit_log.document_id).toBe(document_id);
    expect(merge_result.integration_audit_log.integration_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
    expect(merge_result.integration_audit_log.executed_by).toBeDefined();
    expect(merge_result.integration_audit_log.total_proposals_processed).toBe(4);
    expect(
      merge_result.integration_audit_log.priority_ranking_applied
    ).toEqual(true);
    expect(merge_result.integration_audit_log.selected_proposal_details).toBe(
      "prop_001"
    );
  });
});