import { calculateSLAStatus } from "../../src/logic/it-1-br-2-2-2-1";

describe("SLA監視・警告機能 - 査定時間監視ダッシュボード", () => {
  test("SCEN-791: 見積書受付から査定完了までの経過時間が30分以内の場合、警告が発火しない", () => {
    // 前提条件: 見積書受付時刻と査定完了時刻を固定値で設定
    const received_at = new Date("2024-06-15T09:00:00Z");
    const completed_at = new Date("2024-06-15T09:25:00Z"); // 25分後
    const sla_threshold_minutes = 30;

    // テスト入力: 経過時間が25分（SLA閾値30分以内）
    const result = calculateSLAStatus({
      received_timestamp: received_at,
      completed_timestamp: completed_at,
      sla_limit_minutes: sla_threshold_minutes,
    });

    // 期待結果: 警告フラグが false（正常ステータス）
    expect(result.warning_triggered).toBe(false);
    expect(result.elapsed_minutes).toBe(25);
    expect(result.status).toBe("normal");
    expect(result.alert_message).toBe("");
  });
});