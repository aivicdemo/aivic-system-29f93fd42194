import { calculateSLAComplianceStatus } from "../../src/logic/it-1-br-2-2-2-1";

describe("SLA監視・警告機能 - 見積書受付から査定完了までの経過時間監視", () => {
  // SCEN-793
  test("経過時間が30分の境界値で警告判定が正確に実行される", () => {
    const sla_threshold_minutes = 30;
    const receipt_time = new Date("2024-01-15T10:00:00Z");

    // テストケース1: 経過時間が29分59秒（警告なし）
    const assessment_completion_time_29m59s = new Date(
      "2024-01-15T10:29:59Z"
    );
    const elapsed_seconds_29m59s = Math.floor(
      (assessment_completion_time_29m59s.getTime() - receipt_time.getTime()) /
        1000
    );
    const result_29m59s = calculateSLAComplianceStatus({
      receipt_timestamp: receipt_time,
      assessment_completion_timestamp: assessment_completion_time_29m59s,
      sla_threshold_seconds: sla_threshold_minutes * 60,
    });
    expect(result_29m59s.elapsed_seconds).toBe(1799);
    expect(result_29m59s.is_sla_exceeded).toBe(false);
    expect(result_29m59s.alert_triggered).toBe(false);

    // テストケース2: 経過時間が正確に30分（警告あり）
    const assessment_completion_time_30m = new Date("2024-01-15T10:30:00Z");
    const elapsed_seconds_30m = Math.floor(
      (assessment_completion_time_30m.getTime() - receipt_time.getTime()) / 1000
    );
    const result_30m = calculateSLAComplianceStatus({
      receipt_timestamp: receipt_time,
      assessment_completion_timestamp: assessment_completion_time_30m,
      sla_threshold_seconds: sla_threshold_minutes * 60,
    });
    expect(result_30m.elapsed_seconds).toBe(1800);
    expect(result_30m.is_sla_exceeded).toBe(true);
    expect(result_30m.alert_triggered).toBe(true);

    // テストケース3: 経過時間が30分01秒（警告あり）
    const assessment_completion_time_30m01s = new Date(
      "2024-01-15T10:30:01Z"
    );
    const elapsed_seconds_30m01s = Math.floor(
      (assessment_completion_time_30m01s.getTime() - receipt_time.getTime()) /
        1000
    );
    const result_30m01s = calculateSLAComplianceStatus({
      receipt_timestamp: receipt_time,
      assessment_completion_timestamp: assessment_completion_time_30m01s,
      sla_threshold_seconds: sla_threshold_minutes * 60,
    });
    expect(result_30m01s.elapsed_seconds).toBe(1801);
    expect(result_30m01s.is_sla_exceeded).toBe(true);
    expect(result_30m01s.alert_triggered).toBe(true);

    // テストケース4: 警告ログの記録確認
    expect(result_30m.warning_log).toBeDefined();
    expect(result_30m.warning_log?.severity_level).toBe("HIGH");
    expect(result_30m.warning_log?.message).toMatch(/SLA/);
    expect(result_30m.warning_log?.message).toMatch(/30/);

    // テストケース5: 警告なしの場合はログなし
    expect(result_29m59s.warning_log).toBeUndefined();
  });
});