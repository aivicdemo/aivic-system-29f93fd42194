import { validateCompletedRecordLogicEdit } from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  // SCEN-1040: [error] 査定根拠妥当性検証・改ざん防止機能 - 記録完了後に過去の判定ロジックを変更しようとした場合、操作は拒否されエラーが返される
  test("記録完了後の判定ロジック変更は拒否される", () => {
    const completed_assessment_record = {
      assessment_id: "ASS-2024-001",
      assessment_status: "completed",
      completion_timestamp: "2024-12-15T14:30:00Z",
      judgment_logic_version: "v2.1",
      judgment_logic_applied: {
        assessment_criteria_lower: 1000000,
        assessment_criteria_upper: 5000000,
        evaluation_rule: "market_deviation_rate_within_15_percent",
        correction_coefficient: 1.05,
      },
      recorded_by: "assessor_001",
      recorded_timestamp: "2024-12-15T14:30:00Z",
    };

    const attempted_modification = {
      assessment_criteria_lower: 1200000,
      assessment_criteria_upper: 4800000,
      evaluation_rule: "market_deviation_rate_within_20_percent",
      correction_coefficient: 1.08,
    };

    expect(() =>
      validateCompletedRecordLogicEdit(
        completed_assessment_record,
        attempted_modification
      )
    ).toThrow(/記録完了後の判定ロジック変更/);
  });
});