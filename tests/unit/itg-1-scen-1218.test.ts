import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { checkContractChangeConfirmationAndNotify } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1218
  test("should not send reminder notification when confirmation is completed within set overtime limit", () => {
    // 契約変更レコード作成
    const contractChangeId = "CC-001";
    const contractId = "C-001";
    const customerId = "CUST-001";
    const changeContent = "納期を2024-02-15から2024-02-28に変更";
    const changeDate = new Date("2024-01-15T10:00:00Z");
    
    // 設定超過時間: 60分
    const overtimeLimitMinutes = 60;
    
    // 確認期限: 現在時刻から60分後
    const confirmationDeadline = new Date("2024-01-15T11:00:00Z");
    
    // 確認処理完了時刻: 現在時刻から30分経過時点
    const confirmationCompletedAt = new Date("2024-01-15T10:30:00Z");
    
    // 催促通知送信ロジック実行時刻（確認後に催促ロジックをトリガー）
    const reminderCheckTime = new Date("2024-01-15T10:35:00Z");
    
    const contractChangeData = {
      contractChangeId: contractChangeId,
      contractId: contractId,
      customerId: customerId,
      changeContent: changeContent,
      changeDate: changeDate,
      confirmationDeadline: confirmationDeadline,
      confirmationStatus: "pending" as const,
      createdAt: changeDate,
    };

    // 確認処理実行
    const confirmationResult = {
      contractChangeId: contractChangeId,
      confirmedAt: confirmationCompletedAt,
      confirmationStatus: "confirmed" as const,
    };

    // 催促通知送信ロジックを実行
    const reminderNotificationResult = checkContractChangeConfirmationAndNotify({
      contractChangeId: contractChangeId,
      confirmationDeadline: confirmationDeadline,
      confirmationStatus: "confirmed",
      confirmationCompletedAt: confirmationCompletedAt,
      overtimeLimitMinutes: overtimeLimitMinutes,
      currentCheckTime: reminderCheckTime,
    });

    // 期待結果: 催促通知が送信されていないこと
    expect(reminderNotificationResult.shouldSendReminder).toBe(false);
    expect(reminderNotificationResult.reminderSent).toBe(false);
    expect(reminderNotificationResult.notificationLogs).toEqual([]);
    expect(reminderNotificationResult.reasonNotSent).toBe(
      "confirmation_completed_within_limit"
    );
  });
});