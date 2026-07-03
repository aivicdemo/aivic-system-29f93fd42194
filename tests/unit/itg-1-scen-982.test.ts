import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  detectSlaOverdueAndNotify,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

describe("月次請求自動化機能 - SLA期限超過時の自動通知", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-982
  test("SLA期限を超過した請求に対して代表ユーザーに自動通知が送信され、通知には超過日時・対象請求ID・超過時間などの詳細情報が含まれること", () => {
    // 前提: 月次請求自動化機能の設定でSLA期限が設定されており、現在日時より前に設定されている状態
    // SLA期限: 2024年1月10日 09:00:00 UTC
    // 現在日時: 2024年1月15日 14:30:00 UTC
    // 超過時間: 5日間 5時間 30分
    const slaDeadlineTime = new Date("2024-01-10T09:00:00Z").getTime();
    const currentTime = new Date("2024-01-15T14:30:00Z").getTime();
    const invoiceId = "INV-2024-001-ACME";
    const representativeEmail = "representative@company.com";
    const representativeUserId = "USR-REP-001";

    const input = {
      invoiceId: invoiceId,
      slaDeadlineTime: slaDeadlineTime,
      currentTime: currentTime,
      representativeEmail: representativeEmail,
      representativeUserId: representativeUserId,
    };

    // API モック: メール送信成功
    fetchMock.mockResponseOnce(
      JSON.stringify({
        notificationId: "NOTIF-2024-001",
        status: "sent",
        sentAt: "2024-01-15T14:30:00Z",
        recipientEmail: representativeEmail,
      }),
      { status: 200 }
    );

    // 実行
    const result = detectSlaOverdueAndNotify(input);

    // 期待結果の検証
    // 1. SLA期限超過の検出: true
    expect(result.isOverdue).toBe(true);

    // 2. 超過時間の計算（ミリ秒 → 時間に変換）
    // 超過時間 = 現在日時 - SLA期限 = (2024-01-15 14:30) - (2024-01-10 09:00) = 5日 5時間 30分
    // = 432000秒（5日） + 19800秒（5時間 30分） = 451800秒 = 125.5時間
    const expectedOverdueMilliseconds = 451800000;
    expect(result.overdueMilliseconds).toBe(expectedOverdueMilliseconds);

    // 3. 対象請求IDの確認
    expect(result.invoiceId).toBe(invoiceId);

    // 4. 通知ID の確認
    expect(result.notificationId).toBe("NOTIF-2024-001");

    // 5. 通知ステータスの確認
    expect(result.notificationStatus).toBe("sent");

    // 6. 送信先メールアドレスの確認
    expect(result.recipientEmail).toBe(representativeEmail);

    // 7. 通知送信日時の確認
    expect(result.sentAt).toBe("2024-01-15T14:30:00Z");

    // 8. 通知詳細情報の確認
    expect(result.notificationDetails).toEqual({
      invoiceId: invoiceId,
      overdueDateTime: "2024-01-15T14:30:00Z",
      slaDeadlineDateTime: "2024-01-10T09:00:00Z",
      overdueHours: 125.5,
      representativeUserId: representativeUserId,
      recipientEmail: representativeEmail,
    });

    // 9. API 呼び出しの検証
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [callUrl, callOptions] = fetchMock.mock.calls[0];
    expect(callUrl).toMatch(/\/api\/notification\/send-sla-overdue/);
    expect(callOptions.method).toBe("POST");
  });
});