import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { determineReportDeliveryStatus } from "../../src/logic/it-1-1-1";

const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

describe("Report Delivery Status Determination - Success Case", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1138: [normal] レポート配信完了判定機能 - 配信成功時に成功ステータスが正しく判定される
  test("should correctly determine SUCCESS status when all report deliveries complete successfully", async () => {
    // Prepare test data: Report with sales data and billing information
    const report_id = "RPT-2024-01-001";
    const delivery_batch_id = "BATCH-2024-01-15-0900";
    const customer_ids = ["CUST-001", "CUST-002", "CUST-003"];
    const delivery_timestamp = new Date("2024-01-15T09:30:00Z").toISOString();

    const delivery_requests = [
      {
        report_id,
        customer_id: "CUST-001",
        delivery_queue_id: "QUEUE-001",
        recipient_email: "user1@customer1.jp",
        report_type: "SALES_ACHIEVEMENT",
        queued_at: new Date("2024-01-15T09:00:00Z").toISOString(),
        expected_send_time: new Date("2024-01-15T09:15:00Z").toISOString(),
      },
      {
        report_id,
        customer_id: "CUST-002",
        delivery_queue_id: "QUEUE-002",
        recipient_email: "user2@customer2.jp",
        report_type: "SALES_ACHIEVEMENT",
        queued_at: new Date("2024-01-15T09:00:00Z").toISOString(),
        expected_send_time: new Date("2024-01-15T09:15:00Z").toISOString(),
      },
      {
        report_id,
        customer_id: "CUST-003",
        delivery_queue_id: "QUEUE-003",
        recipient_email: "user3@customer3.jp",
        report_type: "SALES_ACHIEVEMENT",
        queued_at: new Date("2024-01-15T09:00:00Z").toISOString(),
        expected_send_time: new Date("2024-01-15T09:15:00Z").toISOString(),
      },
    ];

    // Mock API responses for each delivery request
    // Step 1: Queuing success
    fetchMock.mockResponseOnce(
      JSON.stringify({
        queue_id: "QUEUE-001",
        status: "QUEUED",
        timestamp: new Date("2024-01-15T09:00:15Z").toISOString(),
      }),
      { status: 200 }
    );

    // Step 2: Send execution success for first recipient
    fetchMock.mockResponseOnce(
      JSON.stringify({
        queue_id: "QUEUE-001",
        send_timestamp: new Date("2024-01-15T09:15:30Z").toISOString(),
        send_status: "SENT",
        smtp_response_code: 250,
      }),
      { status: 200 }
    );

    // Step 3: Delivery confirmation success for first recipient
    fetchMock.mockResponseOnce(
      JSON.stringify({
        delivery_id: "DELIV-001",
        queue_id: "QUEUE-001",
        customer_id: "CUST-001",
        delivery_confirmed_at: new Date("2024-01-15T09:16:00Z").toISOString(),
        delivery_status: "CONFIRMED",
        recipient_email: "user1@customer1.jp",
      }),
      { status: 200 }
    );

    // Repeat for second recipient
    fetchMock.mockResponseOnce(
      JSON.stringify({
        queue_id: "QUEUE-002",
        status: "QUEUED",
        timestamp: new Date("2024-01-15T09:00:15Z").toISOString(),
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        queue_id: "QUEUE-002",
        send_timestamp: new Date("2024-01-15T09:15:32Z").toISOString(),
        send_status: "SENT",
        smtp_response_code: 250,
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        delivery_id: "DELIV-002",
        queue_id: "QUEUE-002",
        customer_id: "CUST-002",
        delivery_confirmed_at: new Date("2024-01-15T09:16:02Z").toISOString(),
        delivery_status: "CONFIRMED",
        recipient_email: "user2@customer2.jp",
      }),
      { status: 200 }
    );

    // Repeat for third recipient
    fetchMock.mockResponseOnce(
      JSON.stringify({
        queue_id: "QUEUE-003",
        status: "QUEUED",
        timestamp: new Date("2024-01-15T09:00:15Z").toISOString(),
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        queue_id: "QUEUE-003",
        send_timestamp: new Date("2024-01-15T09:15:34Z").toISOString(),
        send_status: "SENT",
        smtp_response_code: 250,
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        delivery_id: "DELIV-003",
        queue_id: "QUEUE-003",
        customer_id: "CUST-003",
        delivery_confirmed_at: new Date("2024-01-15T09:16:04Z").toISOString(),
        delivery_status: "CONFIRMED",
        recipient_email: "user3@customer3.jp",
      }),
      { status: 200 }
    );

    // Call delivery status determination function
    const delivery_status_result = await determineReportDeliveryStatus({
      report_id,
      delivery_batch_id,
      delivery_requests,
      batch_execution_timestamp: delivery_timestamp,
    });

    // Verify delivery status is determined as SUCCESS
    expect(delivery_status_result.status).toBe("SUCCESS");
    expect(delivery_status_result.delivery_batch_id).toBe(delivery_batch_id);
    expect(delivery_status_result.report_id).toBe(report_id);

    // Verify delivery completion timestamp is accurately recorded
    expect(delivery_status_result.delivery_completed_at).toBeTruthy();
    const completion_time = new Date(
      delivery_status_result.delivery_completed_at
    );
    expect(completion_time.getTime()).toBeGreaterThanOrEqual(
      new Date("2024-01-15T09:16:00Z").getTime()
    );
    expect(completion_time.getTime()).toBeLessThanOrEqual(
      new Date("2024-01-15T09:17:00Z").getTime()
    );

    // Verify delivery count matches expected number
    expect(delivery_status_result.total_delivery_count).toBe(3);
    expect(delivery_status_result.successful_delivery_count).toBe(3);
    expect(delivery_status_result.failed_delivery_count).toBe(0);

    // Verify delivery success rate is 100%
    expect(delivery_status_result.delivery_success_rate).toBe(1.0);

    // Verify delivery log contains success records
    expect(delivery_status_result.delivery_logs).toBeDefined();
    expect(delivery_status_result.delivery_logs.length).toBe(3);

    const log_entry_1 = delivery_status_result.delivery_logs.find(
      (log: { customer_id: string; delivery_id: string }) =>
        log.customer_id === "CUST-001"
    );
    expect(log_entry_1).toBeDefined();
    expect(log_entry_1.delivery_id).toBe("DELIV-001");
    expect(log_entry_1.delivery_status).toBe("CONFIRMED");
    expect(log_entry_1.recipient_email).toBe("user1@customer1.jp");

    const log_entry_2 = delivery_status_result.delivery_logs.find(
      (log: { customer_id: string; delivery_id: string }) =>
        log.customer_id === "CUST-002"
    );
    expect(log_entry_2).toBeDefined();
    expect(log_entry_2.delivery_id).toBe("DELIV-002");
    expect(log_entry_2.delivery_status).toBe("CONFIRMED");
    expect(log_entry_2.recipient_email).toBe("user2@customer2.jp");

    const log_entry_3 = delivery_status_result.delivery_logs.find(
      (log: { customer_id: string; delivery_id: string }) =>
        log.customer_id === "CUST-003"
    );
    expect(log_entry_3).toBeDefined();
    expect(log_entry_3.delivery_id).toBe("DELIV-003");
    expect(log_entry_3.delivery_status).toBe("CONFIRMED");
    expect(log_entry_3.recipient_email).toBe("user3@customer3.jp");

    // Verify each log entry contains delivery completion timestamp
    delivery_status_result.delivery_logs.forEach(
      (log: { delivery_confirmed_at: string }) => {
        expect(log.delivery_confirmed_at).toBeTruthy();
        const log_completion_time = new Date(log.delivery_confirmed_at);
        expect(log_completion_time.getTime()).toBeGreaterThanOrEqual(
          new Date("2024-01-15T09:16:00Z").getTime()
        );
        expect(log_completion_time.getTime()).toBeLessThanOrEqual(
          new Date("2024-01-15T09:17:00Z").getTime()
        );
      }
    );

    // Verify no errors in delivery process
    expect(delivery_status_result.error_summary).toBeUndefined();
    expect(delivery_status_result.has_errors).toBe(false);

    // Verify created_at timestamp for delivery log entry
    expect(delivery_status_result.created_at).toBeTruthy();
  });
});