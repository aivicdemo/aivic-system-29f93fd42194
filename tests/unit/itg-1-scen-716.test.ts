import { validateSalesDataCompleteness } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-716: [edge] 修正期限管理・催促機能 - 修正期限が本日または翌日の境界値の場合、催促通知の判定が正確に動作する
  test("修正期限が本日、翌日、昨日の各パターンで催促通知判定が正確に動作する", () => {
    // システム現在時刻を固定値に設定
    const now = new Date("2024-01-15T09:00:00Z");
    const todayDate = "2024-01-15";
    const tomorrowDate = "2024-01-16";
    const yesterdayDate = "2024-01-14";

    // テストデータ: 修正期限が本日のレコード
    const recordTodayDeadline = {
      id: "correction_001",
      salesDataId: "sales_data_001",
      status: "pending_correction",
      correctionDeadline: todayDate,
      notificationSent: false,
      createdAt: "2024-01-10T08:00:00Z",
    };

    // テストデータ: 修正期限が翌日のレコード
    const recordTomorrowDeadline = {
      id: "correction_002",
      salesDataId: "sales_data_002",
      status: "pending_correction",
      correctionDeadline: tomorrowDate,
      notificationSent: false,
      createdAt: "2024-01-10T08:00:00Z",
    };

    // テストデータ: 修正期限が昨日のレコード
    const recordYesterdayDeadline = {
      id: "correction_003",
      salesDataId: "sales_data_003",
      status: "pending_correction",
      correctionDeadline: yesterdayDate,
      notificationSent: false,
      createdAt: "2024-01-10T08:00:00Z",
    };

    // 催促通知判定ロジックを実行: 本日期限レコード
    const resultToday = validateSalesDataCompleteness({
      records: [recordTodayDeadline],
      currentDate: todayDate,
      currentTime: now,
    });

    // 本日期限のレコードに対する判定結果を検証
    expect(resultToday.reminders).toHaveLength(1);
    expect(resultToday.reminders[0]).toEqual({
      correctionId: "correction_001",
      notificationType: "reminder",
      message: "修正期限が本日です。お早めにご対応ください。",
      priority: "high",
      shouldSend: true,
    });
    expect(resultToday.reminders[0].shouldSend).toBe(true);

    // 催促通知判定ロジックを実行: 翌日期限レコード
    const resultTomorrow = validateSalesDataCompleteness({
      records: [recordTomorrowDeadline],
      currentDate: todayDate,
      currentTime: now,
    });

    // 翌日期限のレコードに対する判定結果を検証
    expect(resultTomorrow.reminders).toHaveLength(0);

    // 催促通知判定ロジックを実行: 昨日期限レコード
    const resultYesterday = validateSalesDataCompleteness({
      records: [recordYesterdayDeadline],
      currentDate: todayDate,
      currentTime: now,
    });

    // 昨日期限のレコードに対する判定結果を検証
    expect(resultYesterday.overdueAlerts).toHaveLength(1);
    expect(resultYesterday.overdueAlerts[0]).toEqual({
      correctionId: "correction_003",
      alertType: "deadline_exceeded",
      message: "修正期限を超過しています。至急対応が必要です。",
      priority: "urgent",
      daysOverdue: 1,
      shouldSend: true,
    });
    expect(resultYesterday.overdueAlerts[0].shouldSend).toBe(true);

    // 本日期限のレコードについて、催促通知が送信されることを確認
    expect(resultToday.hasRemindersToSend).toBe(true);
    expect(resultToday.reminders[0].notificationType).toBe("reminder");

    // 翌日期限のレコードについて、催促通知が送信されないことを確認
    expect(resultTomorrow.hasRemindersToSend).toBe(false);
    expect(resultTomorrow.reminders).toEqual([]);

    // 昨日期限のレコードについて、期限切れ警告通知が送信されることを確認
    expect(resultYesterday.hasOverdueAlertsToSend).toBe(true);
    expect(resultYesterday.overdueAlerts[0].alertType).toBe("deadline_exceeded");

    // システムの現在時刻を基準に、各パターンで正確な判定が行われていることをログで検証
    expect(resultToday.processingLog).toContain("todayDate");
    expect(resultToday.processingLog).toContain("2024-01-15");
    expect(resultYesterday.processingLog).toContain("overdueDate");
    expect(resultYesterday.processingLog).toContain("daysOverdue:1");
    expect(resultTomorrow.processingLog).toContain("futureDate");

    // 複数レコードを混合した場合の全体動作検証
    const resultMixed = validateSalesDataCompleteness({
      records: [
        recordTodayDeadline,
        recordTomorrowDeadline,
        recordYesterdayDeadline,
      ],
      currentDate: todayDate,
      currentTime: now,
    });

    expect(resultMixed.reminders).toHaveLength(1);
    expect(resultMixed.reminders[0].correctionId).toBe("correction_001");
    expect(resultMixed.overdueAlerts).toHaveLength(1);
    expect(resultMixed.overdueAlerts[0].correctionId).toBe("correction_003");
    expect(resultMixed.totalRecordsProcessed).toBe(3);
    expect(resultMixed.hasRemindersToSend).toBe(true);
    expect(resultMixed.hasOverdueAlertsToSend).toBe(true);
  });
});