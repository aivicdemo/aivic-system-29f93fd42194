import { calculateApprovalEligibility } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1425: [edge] 修正内容承認基準判定機能 - 査定時間短縮が承認基準の境界値丁度の場合に承認可能と判定される
  test("査定時間短縮が承認基準の境界値と正確に一致する場合、修正内容は承認可能と判定される", () => {
    // 修正前 査定時間（分）
    const assessment_time_before_minutes = 45;

    // 修正後 査定時間（分）
    const assessment_time_after_minutes = 36;

    // 査定時間短縮率（%）= ((修正前 - 修正後) / 修正前) × 100
    // = ((45 - 36) / 45) × 100
    // = (9 / 45) × 100
    // = 20.0%
    const assessment_time_reduction_rate_percent = 20.0;

    // 承認基準：査定時間短縮率が 20% 以上であること
    const approval_threshold_reduction_rate_percent = 20.0;

    // 修正内容の承認判定入力
    const modification_input = {
      assessment_time_before_minutes: assessment_time_before_minutes,
      assessment_time_after_minutes: assessment_time_after_minutes,
      assessment_time_reduction_rate_percent: assessment_time_reduction_rate_percent,
      approval_threshold_reduction_rate_percent: approval_threshold_reduction_rate_percent,
      modification_description: "OCR読取精度の向上により査定時間を削減",
      modified_by_assessor_id: "ASS-001",
      modification_timestamp: new Date("2024-12-15T14:30:00Z"),
    };

    // 修正内容承認判定機能の実行
    const approval_result = calculateApprovalEligibility(modification_input);

    // 期待結果：承認ステータスが「承認可能」であること
    expect(approval_result.approval_status).toBe("承認可能");

    // 期待結果：承認判定ロジックが「査定時間短縮が承認基準を満たす」と判定していること
    expect(approval_result.approval_reason).toBe("査定時間短縮が承認基準を満たす");

    // 期待結果：判定実行日時が正しく記録されていること
    expect(approval_result.approval_judgment_timestamp).toEqual(new Date("2024-12-15T14:30:00Z"));

    // 期待結果：修正前後の査定時間短縮率が正確に記録されていること
    expect(approval_result.recorded_reduction_rate_percent).toBe(20.0);

    // 期待結果：承認判定の実行者情報が正しく記録されていること
    expect(approval_result.approved_by_assessor_id).toBe("ASS-001");

    // 期待結果：監査証跡に判定履歴が正しく保存されていること
    expect(approval_result.audit_log_recorded).toBe(true);

    // 期待結果：判定履歴オブジェクトが以下の情報を含むこと
    expect(approval_result.judgment_history).toEqual({
      approval_status: "承認可能",
      approval_reason: "査定時間短縮が承認基準を満たす",
      assessment_time_reduction_rate_percent: 20.0,
      approval_threshold_reduction_rate_percent: 20.0,
      judgment_timestamp: new Date("2024-12-15T14:30:00Z"),
      judged_by_assessor_id: "ASS-001",
      modification_description: "OCR読取精度の向上により査定時間を削減",
    });

    // 期待結果：判定ステータスのシステム更新が成功していること
    expect(approval_result.system_update_success).toBe(true);
  });
});