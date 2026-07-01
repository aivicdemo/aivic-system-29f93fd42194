import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

describe("営業データ品質検証・異常検出機能 - 修正内容と判断基準の記録と手順書反映", () => {
  // SCEN-943: [normal] 営業データ品質検証・異常検出機能 - 修正内容と判断基準が記録され、手順書改善に反映可能な状態になる
  it("should record correction details and judgment criteria, then enable handbook improvement reflection", async () => {
    const {
      recordCorrectionAndJudgmentCriteria,
      retrieveCorrectionHistoryForHandbookImprovement,
      filterAndSearchHandbookImprovementCandidates,
      verifyHandbookReflectionCapability,
    } = await import("../../src/logic/it-1781935279444-2-2-1");

    // ========== Phase 1: 異常データ選択と修正内容・判断基準の記録 ==========
    const anomalyDetectionResult = {
      anomaly_id: "ANM-001",
      data_item: "sales_amount",
      anomaly_type: "out_of_range",
      detected_value: -5000,
      expected_range: { min: 0, max: 999999 },
      detection_timestamp: "2024-01-15T10:30:00Z",
    };

    const correctionInput = {
      anomaly_id: "ANM-001",
      correction_content: "販売額が負数で入力されていたため、正の値に修正",
      correction_value: 50000,
      judgment_criteria: "契約で定義された営業データ項目メタデータに基づき、sales_amount は0以上999999以下の範囲が必須。負数は不正入力として判定",
      judgment_reason:
        "営業系システムから自動抽出されたデータで、入力時の形式検証が不足していた。今後は入力フォーム段階で数値範囲チェックを実施するルールを追加",
      corrected_by: "operator_001",
      correction_timestamp: "2024-01-15T11:00:00Z",
    };

    // 修正内容と判断基準を記録
    const correctionRecordResult = await recordCorrectionAndJudgmentCriteria(
      correctionInput
    );

    // 記録結果の検証
    expect(correctionRecordResult).toEqual({
      success: true,
      correction_record_id: "COR-REC-20240115-001",
      anomaly_id: "ANM-001",
      correction_content: "販売額が負数で入力されていたため、正の値に修正",
      correction_value: 50000,
      judgment_criteria:
        "契約で定義された営業データ項目メタデータに基づき、sales_amount は0以上999999以下の範囲が必須。負数は不正入力として判定",
      judgment_reason:
        "営業系システムから自動抽出されたデータで、入力時の形式検証が不足していた。今後は入力フォーム段階で数値範囲チェックを実施するルールを追加",
      corrected_by: "operator_001",
      record_created_at: "2024-01-15T11:00:00Z",
      record_status: "saved",
    });

    // ========== Phase 2: 修正履歴画面で記録内容を確認 ==========
    const correctionHistoryRetrievalResult =
      await retrieveCorrectionHistoryForHandbookImprovement({
        anomaly_id: "ANM-001",
        from_date: "2024-01-01T00:00:00Z",
        to_date: "2024-01-31T23:59:59Z",
      });

    expect(correctionHistoryRetrievalResult).toEqual({
      total_records: 1,
      records: [
        {
          correction_record_id: "COR-REC-20240115-001",
          anomaly_id: "ANM-001",
          data_item: "sales_amount",
          anomaly_type: "out_of_range",
          correction_content:
            "販売額が負数で入力されていたため、正の値に修正",
          correction_value: 50000,
          judgment_criteria:
            "契約で定義された営業データ項目メタデータに基づき、sales_amount は0以上999999以下の範囲が必須。負数は不正入力として判定",
          judgment_reason:
            "営業系システムから自動抽出されたデータで、入力時の形式検証が不足していた。今後は入力フォーム段階で数値範囲チェックを実施するルールを追加",
          corrected_by: "operator_001",
          record_created_at: "2024-01-15T11:00:00Z",
          linked_to_handbook_improvement: true,
        },
      ],
      retrieval_status: "success",
    });

    // ========== Phase 3: 手順書改善候補の検索・フィルタリング ==========
    const filterCriteria = {
      anomaly_type: "out_of_range",
      data_item: "sales_amount",
      priority: "high",
      from_date: "2024-01-01T00:00:00Z",
      to_date: "2024-01-31T23:59:59Z",
      correction_status: "saved",
    };

    const filterResult = await filterAndSearchHandbookImprovementCandidates(
      filterCriteria
    );

    expect(filterResult).toEqual({
      total_candidates: 1,
      candidates: [
        {
          candidate_id: "HBI-20240115-001",
          correction_record_id: "COR-REC-20240115-001",
          anomaly_type: "out_of_range",
          data_item: "sales_amount",
          judgment_criteria:
            "契約で定義された営業データ項目メタデータに基づき、sales_amount は0以上999999以下の範囲が必須。負数は不正入力として判定",
          judgment_reason:
            "営業系システムから自動抽出されたデータで、入力時の形式検証が不足していた。今後は入力フォーム段階で数値範囲チェックを実施するルールを追加",
          priority_level: "high",
          occurrence_frequency: 3,
          last_occurrence: "2024-01-15T11:00:00Z",
          handbook_reference: "handbook_section_5_2_1",
          is_extractable: true,
          filter_match_score: 1.0,
        },
      ],
      filter_status: "applied",
      extraction_enabled: true,
    });

    // ========== Phase 4: 手順書反映機能の検証 ==========
    const handbookReflectionCapabilityResult =
      await verifyHandbookReflectionCapability({
        candidate_id: "HBI-20240115-001",
        correction_record_id: "COR-REC-20240115-001",
        target_handbook_section: "handbook_section_5_2_1",
      });

    expect(handbookReflectionCapabilityResult).toEqual({
      capability_verified: true,
      candidate_id: "HBI-20240115-001",
      correction_record_id: "COR-REC-20240115-001",
      target_handbook_section: "handbook_section_5_2_1",
      reflection_enabled: true,
      reflection_method: "automatic_rule_update",
      proposed_handbook_update:
        "入力フォーム段階で sales_amount の数値範囲チェック（0以上999999以下）を実施する検証ルールを追加。不正値検出時は警告メッセージを表示し、修正を促す",
      estimated_impact: "prevents_out_of_range_anomalies",
      implementation_priority: "high",
      approval_status: "pending_review",
      reflection_capability_timestamp: "2024-01-15T11:30:00Z",
    });

    // ========== Phase 5: 統合検証 ==========
    // 記録された修正内容が手順書改善候補として正確に表示されていることを確認
    expect(filterResult.candidates[0].judgment_criteria).toBe(
      correctionRecordResult.judgment_criteria
    );
    expect(filterResult.candidates[0].judgment_reason).toBe(
      correctionRecordResult.judgment_reason
    );

    // 修正履歴と手順書改善候補の連携確認
    expect(correctionHistoryRetrievalResult.records[0].linked_to_handbook_improvement).toBe(true);
    expect(handbookReflectionCapabilityResult.reflection_enabled).toBe(true);

    // 改善候補から手順書への反映機能が有効であることを確認
    expect(handbookReflectionCapabilityResult.reflection_capability_timestamp).toBe(
      "2024-01-15T11:30:00Z"
    );
    expect(handbookReflectionCapabilityResult.approval_status).toBe(
      "pending_review"
    );
  });
});