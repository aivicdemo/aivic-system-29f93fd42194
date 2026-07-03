import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  detectSLAExceeded,
  type ContractChangeRequest,
  type SLACheckResult,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("契約変更SLA自動管理機能", () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = require("jest-fetch-mock");
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-1232
  test("顧客確認処理が実施されない場合、SLA時間超過検知が正常に動作する", async () => {
    // Arrange: テストデータとして契約変更申請を作成し、顧客確認待ち状態に設定
    const contractChangeId = "CC-20250115-001";
    const customerId = "CUST-001";
    const slaTresholdMinutes = 60;
    const currentTime = new Date("2025-01-15T12:00:00Z");
    const requestCreatedTime = new Date("2025-01-15T10:50:00Z"); // 70分前
    const elapsedMinutes = 70;

    const contractChangeRequest: ContractChangeRequest = {
      id: contractChangeId,
      customerId,
      status: "awaiting_customer_confirmation",
      createdAt: requestCreatedTime.toISOString(),
      changedContent: "契約期間を12ヶ月から24ヶ月に延長",
      appliedFromDate: "2025-02-01",
      lastUpdatedAt: requestCreatedTime.toISOString(),
      customerConfirmedAt: null,
      slaThresholdMinutes: slaTresholdMinutes,
    };

    // API呼び出しのモック: 通知ログ記録エンドポイント
    fetchMock.mockResponseOnce(
      JSON.stringify({
        logId: "LOG-20250115-SLA-001",
        status: "recorded",
        timestamp: currentTime.toISOString(),
      }),
      { status: 200 }
    );

    // Act: SLA時間超過検知機能を実行
    const result: SLACheckResult = await detectSLAExceeded(
      contractChangeRequest,
      currentTime
    );

    // Assert: 超過検知結果がエラーハンドリング可能な状態で返される
    expect(result).toHaveProperty("isExceeded");
    expect(result).toHaveProperty("exceededMinutes");
    expect(result).toHaveProperty("alertLogId");
    expect(result).toHaveProperty("notificationStatus");

    // Assert: SLA超過が正確に検知される（実経過70分 > 閾値60分）
    expect(result.isExceeded).toBe(true);
    expect(result.exceededMinutes).toBe(10);

    // Assert: アラート/通知ログが正常に記録される
    expect(result.alertLogId).toBe("LOG-20250115-SLA-001");
    expect(result.notificationStatus).toBe("recorded");

    // Assert: 超過フラグがtrueに設定される
    expect(result.slaExceededFlag).toBe(true);

    // Assert: API呼び出しが正確に実行された
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/notifications/sla-alert"),
      expect.objectContaining({
        method: "POST",
      })
    );

    // Assert: 管理者への通知準備完了ステータス
    expect(result).toHaveProperty("adminNotificationReady");
    expect(result.adminNotificationReady).toBe(true);

    // Assert: 顧客未確認の状態が維持される
    expect(result.customerConfirmationStatus).toBe("not_confirmed");
  });
});