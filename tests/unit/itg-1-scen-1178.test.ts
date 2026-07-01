import { describeMonthlySummaryTemplate } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-1178: レポート生成・配信期限管理 - 期限切れ直前のタイムスタンプでレポート完了判定が正確に行われる", () => {
    // Setup: レポート生成タスクを作成し、期限を現在時刻から24時間後に設定
    const baseTime = new Date("2025-01-15T10:00:00Z");
    const deadlineTime = new Date("2025-01-16T10:00:00Z"); // 24時間後
    const deadlineTimeMs = deadlineTime.getTime();

    // Test Case 1: 期限まで23時間59分59秒の時点でレポート完了判定
    const almostDeadlineTs = new Date("2025-01-16T09:59:59Z");
    const almostDeadlineTsMs = almostDeadlineTs.getTime();

    const result_almost = describeMonthlySummaryTemplate({
      task_id: "task_001",
      generated_at: almostDeadlineTs.toISOString(),
      deadline: deadlineTime.toISOString(),
      is_completed: true,
    });

    expect(result_almost.is_deadline_exceeded).toBe(false);
    expect(result_almost.status).toBe("completed");
    expect(deadlineTimeMs - almostDeadlineTsMs).toBeGreaterThanOrEqual(1000);

    // Test Case 2: 期限まで残り1秒の時点で完了判定
    const oneSecondBeforeDeadline = new Date("2025-01-16T09:59:59.999Z");
    const oneSecondBeforeDeadlineMs = oneSecondBeforeDeadline.getTime();

    const result_one_sec = describeMonthlySummaryTemplate({
      task_id: "task_002",
      generated_at: oneSecondBeforeDeadline.toISOString(),
      deadline: deadlineTime.toISOString(),
      is_completed: true,
    });

    expect(result_one_sec.is_deadline_exceeded).toBe(false);
    expect(result_one_sec.status).toBe("completed");
    expect(deadlineTimeMs - oneSecondBeforeDeadlineMs).toBeGreaterThan(0);

    // Test Case 3: 期限を1秒超過したタイムスタンプでレポート完了判定
    const oneSecondAfterDeadline = new Date("2025-01-16T10:00:01Z");
    const oneSecondAfterDeadlineMs = oneSecondAfterDeadline.getTime();

    const result_exceeded = describeMonthlySummaryTemplate({
      task_id: "task_003",
      generated_at: oneSecondAfterDeadline.toISOString(),
      deadline: deadlineTime.toISOString(),
      is_completed: true,
    });

    expect(result_exceeded.is_deadline_exceeded).toBe(true);
    expect(result_exceeded.status).toBe("deadline_exceeded");
    expect(oneSecondAfterDeadlineMs - deadlineTimeMs).toBe(1000);

    // Test Case 4: 期限を大きく超過したタイムスタンプでレポート完了判定
    const significantlyAfterDeadline = new Date("2025-01-16T11:30:00Z");
    const significantlyAfterDeadlineMs = significantlyAfterDeadline.getTime();

    const result_significantly_exceeded = describeMonthlySummaryTemplate({
      task_id: "task_004",
      generated_at: significantlyAfterDeadline.toISOString(),
      deadline: deadlineTime.toISOString(),
      is_completed: true,
    });

    expect(result_significantly_exceeded.is_deadline_exceeded).toBe(true);
    expect(result_significantly_exceeded.status).toBe("deadline_exceeded");
    expect(significantlyAfterDeadlineMs - deadlineTimeMs).toBe(5400000); // 90分 = 5400000ms

    // Test Case 5: 期限と同一時刻のタイムスタンプでレポート完了判定
    const exactDeadlineTime = new Date("2025-01-16T10:00:00Z");

    const result_exact = describeMonthlySummaryTemplate({
      task_id: "task_005",
      generated_at: exactDeadlineTime.toISOString(),
      deadline: deadlineTime.toISOString(),
      is_completed: true,
    });

    expect(result_exact.is_deadline_exceeded).toBe(false);
    expect(result_exact.status).toBe("completed");

    // Test Case 6: ミリ秒単位の境界値検証 - 期限の999ミリ秒前
    const millisBeforeDeadline = new Date("2025-01-16T09:59:59.001Z");

    const result_millis_before = describeMonthlySummaryTemplate({
      task_id: "task_006",
      generated_at: millisBeforeDeadline.toISOString(),
      deadline: deadlineTime.toISOString(),
      is_completed: true,
    });

    expect(result_millis_before.is_deadline_exceeded).toBe(false);
    expect(result_millis_before.status).toBe("completed");

    // Test Case 7: ミリ秒単位の境界値検証 - 期限の1ミリ秒後
    const millisAfterDeadline = new Date("2025-01-16T10:00:00.001Z");

    const result_millis_after = describeMonthlySummaryTemplate({
      task_id: "task_007",
      generated_at: millisAfterDeadline.toISOString(),
      deadline: deadlineTime.toISOString(),
      is_completed: true,
    });

    expect(result_millis_after.is_deadline_exceeded).toBe(true);
    expect(result_millis_after.status).toBe("deadline_exceeded");
  });
});