import { evaluateReportApprovalCriteria } from "../../src/logic/it-1781935279444-2-1-1";

describe("レポート内容承認基準判定機能", () => {
  // SCEN-651
  test("すべてのチェック項目が合格基準を満たす場合に承認可と判定される", () => {
    const report_data = {
      report_id: "RPT-20240115-001",
      report_month: "2024-01",
      total_apo_count: 45,
      total_contract_count: 12,
      total_revenue: 1500000,
      checklist_items: [
        {
          item_id: "CHK-001",
          item_name: "必須項目完全性",
          required_fields: ["report_month", "total_apo_count", "total_contract_count"],
          present_fields: ["report_month", "total_apo_count", "total_contract_count"],
          pass_criteria: "all_present",
          is_pass: true,
        },
        {
          item_id: "CHK-002",
          item_name: "データ型整合性",
          validations: [
            { field: "total_apo_count", expected_type: "number", actual_type: "number", is_valid: true },
            { field: "total_contract_count", expected_type: "number", actual_type: "number", is_valid: true },
            { field: "total_revenue", expected_type: "number", actual_type: "number", is_valid: true },
          ],
          pass_criteria: "all_valid",
          is_pass: true,
        },
        {
          item_id: "CHK-003",
          item_name: "値の範囲妥当性",
          range_checks: [
            { field: "total_apo_count", min: 0, max: 500, value: 45, in_range: true },
            { field: "total_contract_count", min: 0, max: 100, value: 12, in_range: true },
            { field: "total_revenue", min: 0, max: 5000000, value: 1500000, in_range: true },
          ],
          pass_criteria: "all_in_range",
          is_pass: true,
        },
        {
          item_id: "CHK-004",
          item_name: "異常値判定",
          anomaly_checks: [
            { field: "contract_rate", formula: "total_contract_count / total_apo_count", calculated_value: 0.267, threshold: 0.05, exceeds_threshold: false, is_normal: true },
            { field: "average_deal_size", formula: "total_revenue / total_contract_count", calculated_value: 125000, threshold: 10000, exceeds_threshold: false, is_normal: true },
          ],
          pass_criteria: "all_normal",
          is_pass: true,
        },
      ],
      generated_at: "2024-01-15T11:00:00Z",
    };

    const result = evaluateReportApprovalCriteria(report_data);

    expect(result.approval_status).toBe("承認可");
    expect(result.approval_decision).toBe(true);
    expect(result.checklist_results.length).toBe(4);
    expect(result.checklist_results[0].item_id).toBe("CHK-001");
    expect(result.checklist_results[0].status).toBe("合格");
    expect(result.checklist_results[0].is_pass).toBe(true);
    expect(result.checklist_results[1].item_id).toBe("CHK-002");
    expect(result.checklist_results[1].status).toBe("合格");
    expect(result.checklist_results[1].is_pass).toBe(true);
    expect(result.checklist_results[2].item_id).toBe("CHK-003");
    expect(result.checklist_results[2].status).toBe("合格");
    expect(result.checklist_results[2].is_pass).toBe(true);
    expect(result.checklist_results[3].item_id).toBe("CHK-004");
    expect(result.checklist_results[3].status).toBe("合格");
    expect(result.checklist_results[3].is_pass).toBe(true);
    expect(result.all_items_pass).toBe(true);
    expect(result.pass_count).toBe(4);
    expect(result.fail_count).toBe(0);
    expect(result.judgment_timestamp).toBeDefined();
  });
});