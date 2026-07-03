import { validateSLACompliance } from "../../src/logic/it-1781935279444-2-2-1";

describe("問い合わせ対応のSLA管理機能 - SLA違反検知", () => {
  test("SCEN-1188: 問い合わせ受領から回答が営業日ベースで1営業日を超過した場合、SLA違反として検知される", () => {
    // テストデータ: 問い合わせレコード作成
    // 受領日時: 2024-01-15 (月曜日 09:00 JST) - 営業日
    // 回答期限: 2024-01-16 (火曜日 17:00 JST) - 営業日ベースで翌営業日
    // 現在時刻: 2024-01-17 (水曜日 10:00 JST) - 回答期限の翌営業日の営業時間内

    const inquiry = {
      inquiry_id: "INQ-001",
      received_at: new Date("2024-01-15T09:00:00+09:00"),
      response_deadline: new Date("2024-01-16T17:00:00+09:00"),
      business_days_sla: 1, // SLA: 営業日ベースで1営業日以内に回答
      status: "pending",
      sla_violation_flag: false,
      alert_logged: false,
    };

    const current_time = new Date("2024-01-17T10:00:00+09:00");

    // SLA管理機能の違反判定ロジック実行
    const result = validateSLACompliance(inquiry, current_time);

    // 検証1: システムが受領日時と現在時刻の営業日差を計算
    // 2024-01-15 (月) から 2024-01-17 (水) = 営業日差 2日 (月火間、火水間の2営業日経過)
    // SLA期限は営業日ベース1日 = 2024-01-16 17:00 までに回答が必要
    // 現在時刻 2024-01-17 10:00 は期限超過
    expect(result.business_days_elapsed).toBe(2);

    // 検証2: 営業日差が SLA 期限を超過しているか検証
    expect(result.business_days_elapsed).toBeGreaterThan(inquiry.business_days_sla);

    // 検証3: 違反フラグが SLA違反として設定されたことを確認
    expect(result.sla_violation_flag).toBe(true);

    // 検証4: 違反ステータスが「SLA違反」として記録されたことを確認
    expect(result.status).toBe("SLA違反");

    // 検証5: アラートが記録されたことを確認
    expect(result.alert_logged).toBe(true);

    // 検証6: アラート内容が適切に構造化されていることを確認
    expect(result.alert_message).toMatch(/問い合わせID/);
    expect(result.alert_message).toContain("INQ-001");

    // 検証7: ログレコードが生成され、タイムスタンプが記録されたことを確認
    expect(result.log_timestamp).toBeDefined();
    expect(new Date(result.log_timestamp).getTime()).toBeGreaterThanOrEqual(
      current_time.getTime()
    );

    // 検証8: SLA違反の根拠となる計算詳細が記録されたことを確認
    expect(result.violation_reason).toMatch(/営業日/);
    expect(result.days_overdue).toBe(1); // 営業日ベースで1営業日超過
  });
});