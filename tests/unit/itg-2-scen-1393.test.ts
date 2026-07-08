import { recordValidationProcessSkip } from "../../src/logic/it-6-2-2-1";

describe("検証プロセス履歴の一元管理・監査記録機能", () => {
  // SCEN-1393
  test("検証プロセスがスキップされた場合、スキップ理由と承認者情報が記録される", () => {
    const skip_reason = "緊急対応が必要";
    const skip_reason_detail = "納期短縮のため、追加検証を省略";
    const approver_id = "USR-00542";
    const approver_name = "山田太郎";
    const approver_division = "査定品質管理部";
    const skip_execution_datetime = new Date("2024-12-15T14:30:00Z");

    const result = recordValidationProcessSkip({
      skip_reason,
      skip_reason_detail,
      approver_id,
      approver_name,
      approver_division,
      skip_execution_datetime,
    });

    expect(result.audit_log_recorded).toBe(true);
    expect(result.skip_reason_recorded).toBe(skip_reason);
    expect(result.skip_reason_detail_recorded).toBe(skip_reason_detail);
    expect(result.approver_id_recorded).toBe(approver_id);
    expect(result.approver_name_recorded).toBe(approver_name);
    expect(result.approver_division_recorded).toBe(approver_division);
    expect(result.skip_execution_datetime_recorded).toEqual(skip_execution_datetime);
    expect(result.traceability_confirmed).toBe(true);
    expect(result.history_list_display).toBe(true);
    expect(result.detail_information_accessible).toBe(true);
    expect(result.all_information_accurate).toBe(true);
  });
});