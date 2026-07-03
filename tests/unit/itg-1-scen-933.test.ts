import { describe, test, expect } from "@jest/globals";
import { distributeReportToMultipleRecipients } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-933
  test("複数の配信先メールアドレスが設定されている場合、全宛先への配信が完了し、配信履歴が記録される", () => {
    const recipients = [
      { email: "manager1@customer-a.com", recipientId: "REC-001", recipientName: "営業責任者A" },
      { email: "manager2@customer-a.com", recipientId: "REC-002", recipientName: "営業責任者B" },
      { email: "finance@customer-a.com", recipientId: "REC-003", recipientName: "経理担当者C" },
    ];

    const reportData = {
      reportId: "RPT-2024-01-001",
      customerId: "CUST-A",
      reportTitle: "2024年1月営業成果レポート",
      reportContent: "アポ数: 50, 成約数: 12, サービス売上: ¥1,500,000",
      generatedAt: new Date("2024-01-31T18:00:00Z"),
      distributionList: recipients,
    };

    const result = distributeReportToMultipleRecipients(reportData);

    expect(result.totalRecipients).toBe(3);
    expect(result.successfulDistributions).toBe(3);
    expect(result.failedDistributions).toBe(0);
    expect(result.distributionStatus).toBe("completed");

    expect(result.distributionHistories).toHaveLength(3);

    expect(result.distributionHistories[0]).toEqual({
      distributionHistoryId: expect.any(String),
      reportId: "RPT-2024-01-001",
      recipientId: "REC-001",
      recipientEmail: "manager1@customer-a.com",
      recipientName: "営業責任者A",
      distributedAt: expect.any(String),
      deliveryStatus: "success",
      attemptCount: 1,
    });

    expect(result.distributionHistories[1]).toEqual({
      distributionHistoryId: expect.any(String),
      reportId: "RPT-2024-01-001",
      recipientId: "REC-002",
      recipientEmail: "manager2@customer-a.com",
      recipientName: "営業責任者B",
      distributedAt: expect.any(String),
      deliveryStatus: "success",
      attemptCount: 1,
    });

    expect(result.distributionHistories[2]).toEqual({
      distributionHistoryId: expect.any(String),
      reportId: "RPT-2024-01-001",
      recipientId: "REC-003",
      recipientEmail: "finance@customer-a.com",
      recipientName: "経理担当者C",
      distributedAt: expect.any(String),
      deliveryStatus: "success",
      attemptCount: 1,
    });

    const distributedEmails = result.distributionHistories.map((h) => h.recipientEmail);
    expect(distributedEmails).toContain("manager1@customer-a.com");
    expect(distributedEmails).toContain("manager2@customer-a.com");
    expect(distributedEmails).toContain("finance@customer-a.com");

    result.distributionHistories.forEach((history) => {
      expect(history.deliveryStatus).toBe("success");
      expect(history.reportId).toBe("RPT-2024-01-001");
      expect(history.distributedAt).toBeDefined();
      expect(typeof history.distributedAt).toBe("string");
      expect(history.attemptCount).toBe(1);
    });

    const completionRate = (result.successfulDistributions / result.totalRecipients) * 100;
    expect(completionRate).toBe(100);
  });
});