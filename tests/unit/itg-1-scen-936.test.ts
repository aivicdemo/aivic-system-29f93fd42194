import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { initializeMonthlySchedule } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  let mockDateNow: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (mockDateNow) {
      mockDateNow.mockRestore();
    }
  });

  // SCEN-936
  test("月初5日09:00に月次業務が自動発火され、各ステップに期限日時が正しく割り当てられる", () => {
    // Setup: システムの日時を月初5日08:59に設定
    const beforeTriggerTime = new Date("2024-02-05T08:59:00Z");
    mockDateNow = jest.spyOn(Date, "now").mockReturnValue(beforeTriggerTime.getTime());

    // 月次業務スケジュール管理機能にアクセス（初期状態確認）
    let scheduleState = initializeMonthlySchedule({
      currentDateTime: beforeTriggerTime,
      systemTimezone: "Asia/Tokyo",
    });

    expect(scheduleState.isTriggered).toBe(false);
    expect(scheduleState.steps).toHaveLength(0);

    // システムの日時を月初5日09:00に進める
    const triggerTime = new Date("2024-02-05T09:00:00Z");
    mockDateNow.mockReturnValue(triggerTime.getTime());

    // 月次業務の自動発火トリガーが実行される
    scheduleState = initializeMonthlySchedule({
      currentDateTime: triggerTime,
      systemTimezone: "Asia/Tokyo",
    });

    // 発火されたことを確認
    expect(scheduleState.isTriggered).toBe(true);
    expect(scheduleState.triggeredAt).toEqual(triggerTime);

    // 発火された月次業務のステップ一覧を取得
    expect(scheduleState.steps).toBeDefined();
    expect(scheduleState.steps.length).toBeGreaterThan(0);

    // 第1ステップの期限日時を確認
    const step1 = scheduleState.steps[0];
    expect(step1).toBeDefined();
    expect(step1.stepNumber).toBe(1);
    expect(step1.stepName).toBe("営業データ品質チェック");
    // 期限: 同日23:59（月初5日23:59）
    const step1Deadline = new Date("2024-02-05T23:59:00Z");
    expect(new Date(step1.deadlineAt)).toEqual(step1Deadline);
    expect(step1.notificationScheduled).toBe(true);

    // 第2ステップの期限日時を確認
    const step2 = scheduleState.steps[1];
    expect(step2).toBeDefined();
    expect(step2.stepNumber).toBe(2);
    expect(step2.stepName).toBe("請求ロジック確認");
    // 期限: 翌営業日（月初6日23:59）
    const step2Deadline = new Date("2024-02-06T23:59:00Z");
    expect(new Date(step2.deadlineAt)).toEqual(step2Deadline);
    expect(step2.notificationScheduled).toBe(true);

    // 第3ステップ以降の期限日時を確認
    const step3 = scheduleState.steps[2];
    expect(step3).toBeDefined();
    expect(step3.stepNumber).toBe(3);
    expect(step3.stepName).toBe("請求書作成チェックリスト実行");
    // 期限: 3営業日後（月初7日23:59）
    const step3Deadline = new Date("2024-02-07T23:59:00Z");
    expect(new Date(step3.deadlineAt)).toEqual(step3Deadline);
    expect(step3.notificationScheduled).toBe(true);

    // 各ステップの期限日時が定義されたスケジュール定義と一致していることを検証
    expect(scheduleState.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stepNumber: 1,
          stepName: "営業データ品質チェック",
          deadlineAt: step1Deadline.toISOString(),
          notificationScheduled: true,
        }),
        expect.objectContaining({
          stepNumber: 2,
          stepName: "請求ロジック確認",
          deadlineAt: step2Deadline.toISOString(),
          notificationScheduled: true,
        }),
        expect.objectContaining({
          stepNumber: 3,
          stepName: "請求書作成チェックリスト実行",
          deadlineAt: step3Deadline.toISOString(),
          notificationScheduled: true,
        }),
      ])
    );

    // 期限通知機能が各ステップの期限日時に基づいて正しく設定されていることを確認
    scheduleState.steps.forEach((step) => {
      expect(step.notificationScheduled).toBe(true);
      expect(step.notificationRules).toBeDefined();
      expect(step.notificationRules.notifyAtDeadline).toBe(true);
      expect(step.notificationRules.notifyDayBefore).toBe(true);
      expect(step.notificationRules.notifyHourBefore).toBe(2);
      expect(typeof step.notificationRules.reminderIntervalMinutes).toBe("number");
      expect(step.notificationRules.reminderIntervalMinutes).toBeGreaterThan(0);
    });

    // 全体の検証: 月次業務スケジュール管理が完全に初期化されたことを確認
    expect(scheduleState.monthlyJobId).toBeDefined();
    expect(scheduleState.monthlyJobId.length).toBeGreaterThan(0);
    expect(scheduleState.status).toBe("INITIALIZED");
    expect(scheduleState.createdAt).toEqual(triggerTime);
  });
});