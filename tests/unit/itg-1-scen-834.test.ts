import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import fetchMock from "jest-fetch-mock";
import { notifyContractDeadlineChange } from "../../src/logic/it-1-2-1";

fetchMock.enableMocks();

describe("契約納期変更自動通知機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-834
  test("契約内容が変更されたとき、変更内容と新合意事項を含むメールが自動生成・送信される", async () => {
    // Arrange: テスト用の契約データを準備
    const contractId = "CONTRACT-20240115-001";
    const customerId = "CUST-12345";
    const customerEmail = "sales-manager@customer-example.jp";
    const customerName = "顧客企業営業責任者";
    const originalDeadline = new Date("2024-02-28T23:59:59Z");
    const newDeadline = new Date("2024-03-15T23:59:59Z");
    const changeReason = "顧客要望による納期延長";
    const agreementNote = "顧客と電話確認済み、変更承認了承";
    const notificationSentTime = new Date("2024-01-15T11:30:00Z");

    const contractChangeInput = {
      contractId: contractId,
      customerId: customerId,
      customerEmail: customerEmail,
      customerName: customerName,
      originalDeadline: originalDeadline,
      newDeadline: newDeadline,
      changeReason: changeReason,
      agreementNote: agreementNote,
      changedAt: notificationSentTime,
    };

    // メール送信API レスポンスをモック
    fetchMock.mockResponseOnce(
      JSON.stringify({
        messageId: "MSG-20240115-001",
        recipient: customerEmail,
        subject: `契約納期変更通知: ${contractId}`,
        sentAt: notificationSentTime.toISOString(),
        status: "sent",
      }),
      { status: 200 }
    );

    // Act: 契約納期変更通知機能を実行
    const result = await notifyContractDeadlineChange(contractChangeInput);

    // Assert: メール生成・送信の検証
    expect(result).toBeDefined();
    expect(result.messageId).toBe("MSG-20240115-001");
    expect(result.recipient).toBe(customerEmail);
    expect(result.status).toBe("sent");

    // Assert: メール送信ログの確認
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toContain("/notifications/contract-deadline");

    // Assert: メール本文に変更前の納期が記載されていることを検証
    const sentEmailPayload = JSON.parse(callArgs[1]?.body as string);
    expect(sentEmailPayload.emailBody).toContain("2024-02-28");

    // Assert: メール本文に変更後の新しい納期が記載されていることを検証
    expect(sentEmailPayload.emailBody).toContain("2024-03-15");

    // Assert: メール本文に変更理由が記載されていることを検証
    expect(sentEmailPayload.emailBody).toContain(changeReason);

    // Assert: メール本文に新合意事項が記載されていることを検証
    expect(sentEmailPayload.emailBody).toContain(agreementNote);

    // Assert: 宛先が正しい顧客メールアドレスであることを確認
    expect(sentEmailPayload.recipient).toBe(customerEmail);

    // Assert: メール送信のタイミングが契約確定直後（1分以内）であることを確認
    const sentTimestamp = new Date(result.sentAt);
    const timeDiffSeconds =
      (sentTimestamp.getTime() - notificationSentTime.getTime()) / 1000;
    expect(Math.abs(timeDiffSeconds)).toBeLessThanOrEqual(60);
  });
});