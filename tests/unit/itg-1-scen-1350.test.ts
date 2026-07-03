import { determineMappingImpact } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-1350: 計算ロジック変更時に影響範囲が自動判定され、関連するレポートマッピングが特定される", () => {
    // 既存の計算ロジックを持つメタデータ項目
    const metadata_item_id = "meta_item_001";
    const original_calculation_logic = "SUM(appt_count, contract_count)";
    const original_item_name = "total_activity_score";
    const original_data_type = "number";
    const original_unit = "count";

    // 計算ロジック変更：新しい計算式に修正
    const new_calculation_logic = "SUM(appt_count, contract_count, feedback_score)";

    // 変更前に関連するレポートマッピングが存在する
    const related_report_mappings = [
      {
        report_mapping_id: "mapping_001",
        report_template_id: "rpt_001",
        report_name: "Monthly Sales Performance Report",
        metadata_item_id: metadata_item_id,
        mapped_field_name: "total_activity_score",
        last_updated_at: new Date("2024-01-15T10:00:00Z"),
      },
      {
        report_mapping_id: "mapping_002",
        report_template_id: "rpt_002",
        report_name: "Customer Engagement Summary",
        metadata_item_id: metadata_item_id,
        mapped_field_name: "total_activity_score",
        last_updated_at: new Date("2024-01-14T14:30:00Z"),
      },
      {
        report_mapping_id: "mapping_003",
        report_template_id: "rpt_003",
        report_name: "Weekly Scorecard",
        metadata_item_id: "meta_item_002",
        mapped_field_name: "other_metric",
        last_updated_at: new Date("2024-01-13T09:00:00Z"),
      },
    ];

    // 影響範囲自動判定機能を実行
    const impact_determination_input = {
      metadata_item_id: metadata_item_id,
      old_calculation_logic: original_calculation_logic,
      new_calculation_logic: new_calculation_logic,
      item_name: original_item_name,
      data_type: original_data_type,
      unit: original_unit,
      all_report_mappings: related_report_mappings,
    };

    const impact_result = determineMappingImpact(impact_determination_input);

    // 判定結果の検証：関連するレポートマッピング一覧が正確に特定されること
    expect(impact_result).toBeDefined();
    expect(impact_result.metadata_item_id).toBe(metadata_item_id);
    expect(impact_result.change_detected).toBe(true);

    // 影響を受けるレポートマッピング（metadata_item_id が一致するもの）
    expect(impact_result.affected_report_mappings).toHaveLength(2);

    const affected_mapping_ids = impact_result.affected_report_mappings.map(
      (m: any) => m.report_mapping_id
    );
    expect(affected_mapping_ids).toContain("mapping_001");
    expect(affected_mapping_ids).toContain("mapping_002");
    expect(affected_mapping_ids).not.toContain("mapping_003");

    // 影響を受けるレポートマッピングの詳細情報を検証
    const first_affected = impact_result.affected_report_mappings.find(
      (m: any) => m.report_mapping_id === "mapping_001"
    );
    expect(first_affected).toBeDefined();
    expect(first_affected.report_name).toBe("Monthly Sales Performance Report");
    expect(first_affected.mapped_field_name).toBe("total_activity_score");
    expect(first_affected.last_updated_at).toEqual(
      new Date("2024-01-15T10:00:00Z")
    );

    const second_affected = impact_result.affected_report_mappings.find(
      (m: any) => m.report_mapping_id === "mapping_002"
    );
    expect(second_affected).toBeDefined();
    expect(second_affected.report_name).toBe("Customer Engagement Summary");
    expect(second_affected.mapped_field_name).toBe("total_activity_score");
    expect(second_affected.last_updated_at).toEqual(
      new Date("2024-01-14T14:30:00Z")
    );

    // 変更内容を保存した場合の関連レポート更新ステータス
    expect(impact_result.update_status).toBe("pending_review");
    expect(impact_result.requires_manual_review).toBe(true);
    expect(impact_result.affected_report_count).toBe(2);

    // 計算ロジック変更内容が記録されること
    expect(impact_result.calculation_logic_change).toBeDefined();
    expect(impact_result.calculation_logic_change.old_logic).toBe(
      original_calculation_logic
    );
    expect(impact_result.calculation_logic_change.new_logic).toBe(
      new_calculation_logic
    );
    expect(impact_result.calculation_logic_change.change_description).toBe(
      "Added feedback_score to calculation formula"
    );
  });
});