import { jest } from "@jest/globals";
import { checkAndSendContractChangeReminders } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1219: [edge] 契約変更確認催促通知機能 - 設定超過時間に到達した時点で催促通知が送信される（境界値）
  test("契約変更確認催促通知が設定超過時間24時間の境界値で正確に1件送信される", () => {
    // テスト環境初期化
    const REMINDER_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24時間
    const contractChangeCreatedAt = new Date("2024-01-15T10:00:00Z");
    const contractChangeId = "contract_change_001";
    const contractId = "contract_123";
    const customerId = "customer_456";
    const customerEmail = "representative@customer.com";

    // テスト用の未確認契約変更レコード
    const unconfirmedContractChange = {
      id: contractChangeId,
      contractId: contractId,
      customerId: customerId,
      customerRepresentativeEmail: customerEmail,
      changeType: "納期変更",
      changeContent: "成果物納期を2024年2月15日から2月20日に変更",
      createdAt: contractChangeCreatedAt,
      confirmationStatus: "pending" as const,
      reminderSentAt: null as Date | null,
    };

    // ケース1: 超過時間-1秒（23時間59分59秒後）
    const checkTimeBeforeBoundary = new Date(
      contractChangeCreatedAt.getTime() + REMINDER_THRESHOLD_MS - 1000
    ); // 2024-01-16T09:59:59Z

    const resultBeforeBoundary = checkAndSendContractChangeReminders(
      [unconfirmedContractChange],
      checkTimeBeforeBoundary
    );

    // 超過時間-1秒では通知が送信されないことを確認
    expect(resultBeforeBoundary.reminders).toHaveLength(0);
    expect(resultBeforeBoundary.remindersSent).toBe(false);

    // ケース2: 超過時間に到達（24時間後）
    const checkTimeAtBoundary = new Date(
      contractChangeCreatedAt.getTime() + REMINDER_THRESHOLD_MS
    ); // 2024-01-16T10:00:00Z

    const resultAtBoundary = checkAndSendContractChangeReminders(
      [unconfirmedContractChange],
      checkTimeAtBoundary
    );

    // 超過時間に到達した時点で正確に1件の催促通知が送信されることを確認
    expect(resultAtBoundary.reminders).toHaveLength(1);
    expect(resultAtBoundary.remindersSent).toBe(true);

    const sentReminder = resultAtBoundary.reminders[0];

    // 通知内容の正確性を検証
    expect(sentReminder.targetContractChangeId).toBe(contractChangeId);
    expect(sentReminder.targetContractId).toBe(contractId);
    expect(sentReminder.recipientEmail).toBe(customerEmail);
    expect(sentReminder.reminderMessage).toContain("未確認");
    expect(sentReminder.reminderMessage).toContain("催促");

    // 通知内容に正しい契約情報が含まれていることを検証
    expect(sentReminder.contractChangeDetails.changeType).toBe("納期変更");
    expect(sentReminder.contractChangeDetails.changeContent).toContain(
      "2024年2月"
    );

    // 通知タイムスタンプの正確性を検証
    expect(sentReminder.sentAt).toEqual(checkTimeAtBoundary);

    // ケース3: 重複送信防止機構の検証
    // 同じレコードで再度チェック実行（通知既送信状態）
    const updatedContractChange = {
      ...unconfirmedContractChange,
      reminderSentAt: sentReminder.sentAt,
    };

    const resultSecondCheck = checkAndSendContractChangeReminders(
      [updatedContractChange],
      checkTimeAtBoundary
    );

    // 再度チェック処理を実行しても追加通知が送信されないことを確認
    expect(resultSecondCheck.reminders).toHaveLength(0);
    expect(resultSecondCheck.remindersSent).toBe(false);

    // ケース4: 超過時間+1秒後でも正確に追加通知が送信されないことを確認
    const checkTimeAfterBoundary = new Date(
      contractChangeCreatedAt.getTime() + REMINDER_THRESHOLD_MS + 1000
    ); // 2024-01-16T10:00:01Z

    const unconfirmedAgain = {
      ...unconfirmedContractChange,
      reminderSentAt: null,
    };

    const resultAfterBoundary = checkAndSendContractChangeReminders(
      [unconfirmedAgain],
      checkTimeAfterBoundary
    );

    // 超過時間を超過した状態でも通知は送信されることを確認（1回限り）
    expect(resultAfterBoundary.reminders).toHaveLength(1);
    expect(resultAfterBoundary.remindersSent).toBe(true);
    expect(resultAfterBoundary.reminders[0].sentAt).toEqual(checkTimeAfterBoundary);
  });
});