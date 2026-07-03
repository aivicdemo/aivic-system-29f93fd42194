import { recordResponseToPortal } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-820
  test("対応結果のポータル記録・監査ログ機能 - 代表が対応結果をポータルに入力・送信した際に、送信日時・送信者・対応内容・対応ステータスが監査ログに自動記録される", async () => {
    const representative_user_id = "USR-REP-001";
    const representative_name = "山田太郎";
    const case_id = "CASE-2024-001";
    const response_content = "顧客企業との納期延長について合意しました。修正請求書を3営業日以内に送付予定。";
    const response_status = "resolved";
    const submit_timestamp = new Date("2024-02-15T14:30:00Z");

    const audit_log_record = await recordResponseToPortal({
      representative_user_id,
      representative_name,
      case_id,
      response_content,
      response_status,
      submit_timestamp,
    });

    expect(audit_log_record).toEqual({
      audit_log_id: expect.any(String),
      case_id: "CASE-2024-001",
      submitted_at: new Date("2024-02-15T14:30:00Z"),
      submitted_by_user_id: "USR-REP-001",
      submitted_by_name: "山田太郎",
      response_content: "顧客企業との納期延長について合意しました。修正請求書を3営業日以内に送付予定。",
      response_status: "resolved",
      recorded_at: expect.any(Date),
      action_type: "RESPONSE_SUBMITTED",
    });

    expect(audit_log_record.submitted_at).toEqual(new Date("2024-02-15T14:30:00Z"));
    expect(audit_log_record.submitted_by_user_id).toBe("USR-REP-001");
    expect(audit_log_record.submitted_by_name).toBe("山田太郎");
    expect(audit_log_record.response_content).toBe(
      "顧客企業との納期延長について合意しました。修正請求書を3営業日以内に送付予定。"
    );
    expect(audit_log_record.response_status).toBe("resolved");
    expect(audit_log_record.action_type).toBe("RESPONSE_SUBMITTED");
  });
});