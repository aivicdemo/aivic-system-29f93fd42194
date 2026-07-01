import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  generateContractChangeNotifications,
  sendContractChangeEmails,
} from "../../src/logic/it-1-2-1";

// Mock email sending module
jest.mock("../../src/logic/emailService", () => ({
  sendEmail: jest.fn(),
}));

describe("Contract Change Notification - Multiple Simultaneous Changes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-626
  test("should send individual email notifications for multiple simultaneous contract changes with correct details and order", async () => {
    // Setup: Create test data for three contracts of the same customer
    const customerId = "CUST-001";
    const contractChangeTime = new Date("2024-01-15T10:30:00Z");

    const contractAChanges = {
      contractId: "CONTRACT-A",
      customerId: customerId,
      changeType: "PRICE_CHANGE",
      changedAt: contractChangeTime,
      changeDetails: {
        fieldName: "monthlyPrice",
        previousValue: 100000,
        newValue: 120000,
        effectiveDate: "2024-02-01",
      },
      contactEmail: "manager-a@customer.com",
      contactName: "田中 太郎",
    };

    const contractBChanges = {
      contractId: "CONTRACT-B",
      customerId: customerId,
      changeType: "USAGE_PERIOD_EXTENSION",
      changedAt: contractChangeTime,
      changeDetails: {
        fieldName: "contractEndDate",
        previousValue: "2024-12-31",
        newValue: "2025-12-31",
        extensionDays: 365,
      },
      contactEmail: "manager-b@customer.com",
      contactName: "鈴木 花子",
    };

    const contractCChanges = {
      contractId: "CONTRACT-C",
      customerId: customerId,
      changeType: "OPTION_ADDITION",
      changedAt: contractChangeTime,
      changeDetails: {
        fieldName: "optionCode",
        previousValue: "OPT-BASIC",
        newValue: "OPT-BASIC,OPT-PREMIUM",
        addedOptions: ["OPT-PREMIUM"],
      },
      contactEmail: "manager-c@customer.com",
      contactName: "佐藤 次郎",
    };

    const contractChanges = [
      contractAChanges,
      contractBChanges,
      contractCChanges,
    ];

    // Execute: Generate notifications for all contract changes in same transaction
    const notifications = generateContractChangeNotifications(contractChanges);

    // Verify: Number of notifications generated
    expect(notifications).toHaveLength(3);

    // Verify: Email addresses are correct
    expect(notifications[0].recipientEmail).toBe("manager-a@customer.com");
    expect(notifications[1].recipientEmail).toBe("manager-b@customer.com");
    expect(notifications[2].recipientEmail).toBe("manager-c@customer.com");

    // Verify: Email subjects reflect correct contract change content
    expect(notifications[0].subject).toMatch(/契約A/);
    expect(notifications[0].subject).toMatch(/料金変更/);

    expect(notifications[1].subject).toMatch(/契約B/);
    expect(notifications[1].subject).toMatch(/利用期間延長/);

    expect(notifications[2].subject).toMatch(/契約C/);
    expect(notifications[2].subject).toMatch(/オプション追加/);

    // Verify: Email bodies contain correct change details
    expect(notifications[0].body).toContain("100000");
    expect(notifications[0].body).toContain("120000");
    expect(notifications[0].body).toContain("2024-02-01");

    expect(notifications[1].body).toContain("2024-12-31");
    expect(notifications[1].body).toContain("2025-12-31");
    expect(notifications[1].body).toContain("365");

    expect(notifications[2].body).toContain("OPT-BASIC");
    expect(notifications[2].body).toContain("OPT-PREMIUM");
    expect(notifications[2].body).toContain("佐藤 次郎");

    // Verify: Notification order matches contract change order
    expect(notifications[0].contractId).toBe("CONTRACT-A");
    expect(notifications[1].contractId).toBe("CONTRACT-B");
    expect(notifications[2].contractId).toBe("CONTRACT-C");

    // Verify: All notifications have correct timestamp
    expect(notifications[0].createdAt).toEqual(contractChangeTime);
    expect(notifications[1].createdAt).toEqual(contractChangeTime);
    expect(notifications[2].createdAt).toEqual(contractChangeTime);

    // Verify: Contact names in email body are correct
    expect(notifications[0].body).toContain("田中 太郎");
    expect(notifications[1].body).toContain("鈴木 花子");
    expect(notifications[2].body).toContain("佐藤 次郎");

    // Execute: Send emails
    const sendResult = await sendContractChangeEmails(notifications);

    // Verify: All emails sent successfully
    expect(sendResult.successCount).toBe(3);
    expect(sendResult.failureCount).toBe(0);

    // Verify: Email sending log contains all three records
    expect(sendResult.mailLogs).toHaveLength(3);

    // Verify: Each mail log has correct content
    expect(sendResult.mailLogs[0].contractId).toBe("CONTRACT-A");
    expect(sendResult.mailLogs[0].recipientEmail).toBe("manager-a@customer.com");
    expect(sendResult.mailLogs[0].mailType).toBe("PRICE_CHANGE");
    expect(sendResult.mailLogs[0].status).toBe("SENT");

    expect(sendResult.mailLogs[1].contractId).toBe("CONTRACT-B");
    expect(sendResult.mailLogs[1].recipientEmail).toBe("manager-b@customer.com");
    expect(sendResult.mailLogs[1].mailType).toBe("USAGE_PERIOD_EXTENSION");
    expect(sendResult.mailLogs[1].status).toBe("SENT");

    expect(sendResult.mailLogs[2].contractId).toBe("CONTRACT-C");
    expect(sendResult.mailLogs[2].recipientEmail).toBe("manager-c@customer.com");
    expect(sendResult.mailLogs[2].mailType).toBe("OPTION_ADDITION");
    expect(sendResult.mailLogs[2].status).toBe("SENT");

    // Verify: No duplicate or mixed content in emails
    const subjectSet = new Set(sendResult.mailLogs.map((log) => log.subject));
    expect(subjectSet.size).toBe(3);

    // Verify: Sending order matches generation order
    expect(sendResult.mailLogs[0].sentAt).toBeLessThanOrEqual(
      sendResult.mailLogs[1].sentAt
    );
    expect(sendResult.mailLogs[1].sentAt).toBeLessThanOrEqual(
      sendResult.mailLogs[2].sentAt
    );

    // Verify: No timing delays between email sendings (all within 1 second)
    const timeDiff1 =
      sendResult.mailLogs[1].sentAt.getTime() -
      sendResult.mailLogs[0].sentAt.getTime();
    const timeDiff2 =
      sendResult.mailLogs[2].sentAt.getTime() -
      sendResult.mailLogs[1].sentAt.getTime();

    expect(timeDiff1).toBeLessThan(1000);
    expect(timeDiff2).toBeLessThan(1000);

    // Verify: Email content is distinct for each change
    expect(sendResult.mailLogs[0].body).not.toContain(
      sendResult.mailLogs[1].body
    );
    expect(sendResult.mailLogs[1].body).not.toContain(
      sendResult.mailLogs[2].body
    );
    expect(sendResult.mailLogs[0].body).not.toContain(
      sendResult.mailLogs[2].body
    );
  });
});