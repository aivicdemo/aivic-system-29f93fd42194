import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  searchAndFilterEmailHistory,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ管理 - メール履歴検索・フィルタリング", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-808
  test("メール履歴が古い順にソートされて返却される", () => {
    const email_history_data = [
      {
        email_history_id: "EH-003",
        customer_id: "CUST-001",
        sender_email: "customer@example.com",
        recipient_email: "sales@company.com",
        subject: "Re: Contract Update",
        sent_at: new Date("2024-01-20T15:30:00Z"),
        received_at: new Date("2024-01-20T15:35:00Z"),
        body: "Confirmed the contract change",
      },
      {
        email_history_id: "EH-001",
        customer_id: "CUST-001",
        sender_email: "sales@company.com",
        recipient_email: "customer@example.com",
        subject: "Initial Proposal",
        sent_at: new Date("2024-01-10T09:00:00Z"),
        received_at: new Date("2024-01-10T09:15:00Z"),
        body: "Please review the attached proposal",
      },
      {
        email_history_id: "EH-002",
        customer_id: "CUST-001",
        sender_email: "customer@example.com",
        recipient_email: "sales@company.com",
        subject: "Questions about Terms",
        sent_at: new Date("2024-01-15T11:45:00Z"),
        received_at: new Date("2024-01-15T12:00:00Z"),
        body: "Do you offer volume discounts?",
      },
    ];

    const search_criteria = {
      customer_id: "CUST-001",
      date_range_start: new Date("2024-01-01T00:00:00Z"),
      date_range_end: new Date("2024-01-31T23:59:59Z"),
      sort_order: "ascending",
    };

    const result = searchAndFilterEmailHistory(
      email_history_data,
      search_criteria
    );

    expect(result).toEqual([
      {
        email_history_id: "EH-001",
        customer_id: "CUST-001",
        sender_email: "sales@company.com",
        recipient_email: "customer@example.com",
        subject: "Initial Proposal",
        sent_at: new Date("2024-01-10T09:00:00Z"),
        received_at: new Date("2024-01-10T09:15:00Z"),
        body: "Please review the attached proposal",
      },
      {
        email_history_id: "EH-002",
        customer_id: "CUST-001",
        sender_email: "customer@example.com",
        recipient_email: "sales@company.com",
        subject: "Questions about Terms",
        sent_at: new Date("2024-01-15T11:45:00Z"),
        received_at: new Date("2024-01-15T12:00:00Z"),
        body: "Do you offer volume discounts?",
      },
      {
        email_history_id: "EH-003",
        customer_id: "CUST-001",
        sender_email: "customer@example.com",
        recipient_email: "sales@company.com",
        subject: "Re: Contract Update",
        sent_at: new Date("2024-01-20T15:30:00Z"),
        received_at: new Date("2024-01-20T15:35:00Z"),
        body: "Confirmed the contract change",
      },
    ]);

    expect(result.length).toBe(3);
    expect(result[0].sent_at.getTime()).toBeLessThan(
      result[1].sent_at.getTime()
    );
    expect(result[1].sent_at.getTime()).toBeLessThan(
      result[2].sent_at.getTime()
    );
  });
});