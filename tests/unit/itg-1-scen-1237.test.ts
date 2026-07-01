import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  notifyContractChangeToMultipleRecipients,
} from "../../src/logic/it-1781935279444-2-1-1";

const fetchMock = require("jest-fetch-mock");

describe("契約変更メール送信と受信確認タイムスタンプ記録機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1237: 複数の営業責任者へのメール送信とタイムスタンプ記録
  test("複数営業責任者へメール送信し、全メールアドレスの送信確認タイムスタンプが個別に記録される", async () => {
    const contractChangeData = {
      contractId: "CTR-20240115-001",
      changeType: "納期変更",
      changeContent: "納期を2024-02-28から2024-03-15に変更",
      changedAt: "2024-01-15T09:30:00Z",
      changedBy: "operator-001",
    };

    const recipients = [
      {
        recipientId: "EXE-001",
        name: "営業責任者A",
        email: "manager-a@customer-company.jp",
      },
      {
        recipientId: "EXE-002",
        name: "営業責任者B",
        email: "manager-b@customer-company.jp",
      },
      {
        recipientId: "EXE-003",
        name: "営業責任者C",
        email: "manager-c@customer-company.jp",
      },
    ];

    const mockTimestamp1 = "2024-01-15T09:31:00Z";
    const mockTimestamp2 = "2024-01-15T09:31:01Z";
    const mockTimestamp3 = "2024-01-15T09:31:02Z";

    fetchMock.mockResponseOnce(
      JSON.stringify({
        recipientEmail: recipients[0].email,
        sentAt: mockTimestamp1,
        messageId: "MSG-001",
        status: "sent",
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        recipientEmail: recipients[1].email,
        sentAt: mockTimestamp2,
        messageId: "MSG-002",
        status: "sent",
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        recipientEmail: recipients[2].email,
        sentAt: mockTimestamp3,
        messageId: "MSG-003",
        status: "sent",
      }),
      { status: 200 }
    );

    const result = await notifyContractChangeToMultipleRecipients({
      contractChange: contractChangeData,
      recipients: recipients,
    });

    expect(result.totalRecipients).toBe(3);
    expect(result.successCount).toBe(3);
    expect(result.failureCount).toBe(0);

    expect(result.sendLogs).toHaveLength(3);

    expect(result.sendLogs[0].recipientEmail).toBe(recipients[0].email);
    expect(result.sendLogs[0].sentAt).toBe(mockTimestamp1);
    expect(result.sendLogs[0].status).toBe("sent");

    expect(result.sendLogs[1].recipientEmail).toBe(recipients[1].email);
    expect(result.sendLogs[1].sentAt).toBe(mockTimestamp2);
    expect(result.sendLogs[1].status).toBe("sent");

    expect(result.sendLogs[2].recipientEmail).toBe(recipients[2].email);
    expect(result.sendLogs[2].sentAt).toBe(mockTimestamp3);
    expect(result.sendLogs[2].status).toBe("sent");

    expect(result.sendLogs.every((log) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(log.sentAt))).toBe(true);

    const timestamps = result.sendLogs.map((log) => new Date(log.sentAt).getTime());
    expect(timestamps[0]).toBeLessThan(timestamps[1]);
    expect(timestamps[1]).toBeLessThan(timestamps[2]);

    const uniqueEmails = new Set(result.sendLogs.map((log) => log.recipientEmail));
    expect(uniqueEmails.size).toBe(3);

    expect(fetchMock.calls().length).toBe(3);
    expect(fetchMock.calls()[0][0]).toContain("/send-email");
    expect(fetchMock.calls()[1][0]).toContain("/send-email");
    expect(fetchMock.calls()[2][0]).toContain("/send-email");

    expect(result.allSent).toBe(true);
    expect(result.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});