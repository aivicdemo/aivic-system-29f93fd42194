import { monitorResourceDocumentReleaseSLA } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  test("SCEN-782: 資料リリース通知から確認完了までのSLA監視機能 - 通知から確認完了までの経過時間が設定SLA以内の場合、処理を続行する", () => {
    // テストシナリオの初期化：資料リリース通知SLAを60分に設定
    const slaMinutes = 60;

    // 資料リリース通知を送信し、通知送信時刻をタイムスタンプとして記録
    const notificationSentAt = new Date("2024-01-15T10:00:00Z");

    // ユーザーが資料を確認し、確認完了アクションを実行
    // 確認完了時刻をタイムスタンプとして取得（通知から30分後）
    const confirmationCompletedAt = new Date("2024-01-15T10:30:00Z");

    // 通知送信時刻から確認完了時刻までの経過時間を計算
    const elapsedMinutes =
      (confirmationCompletedAt.getTime() - notificationSentAt.getTime()) /
      (1000 * 60);

    // モニタリング対象のデータ
    const input = {
      slaMinutes: slaMinutes,
      notificationSentAt: notificationSentAt,
      confirmationCompletedAt: confirmationCompletedAt,
    };

    // SLA監視機能を実行
    const result = monitorResourceDocumentReleaseSLA(input);

    // 計算した経過時間がSLA設定値（60分）以下であることを検証
    expect(elapsedMinutes).toBeLessThanOrEqual(slaMinutes);

    // SLA内の場合、処理ステータスが「進行中」または「完了」となることを確認
    expect(result.withinSLA).toBe(true);

    // 次のプロセス（請求データ処理など）が中断されることなく継続実行されることを確認
    expect(result.processCanContinue).toBe(true);

    // SLA監視ログに『SLA OK』または『Within SLA』の記録が残ること
    expect(result.slaStatus).toMatch(/SLA\s+OK|Within\s+SLA/);

    // 経過時間の記録確認
    expect(result.elapsedMinutes).toBe(30);

    // ステータスが正常系であることを確認
    expect(result.status).toBe("進行中");
  });
});