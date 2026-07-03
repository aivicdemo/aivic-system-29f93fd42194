import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateReportAnomalies,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("Report Anomaly Detection and Distribution Block", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1128
  test("should detect threshold excess and logical contradictions in report data, block distribution, and notify stakeholders", () => {
    // Prepare test report data with intentional anomalies
    const report_data = {
      report_id: "RPT-2024-01-001",
      customer_id: "CUST-A001",
      service_id: "SVC-BASIC",
      period: "2024-01",
      items: [
        {
          item_id: "LINE-001",
          unit_price: 100,
          quantity: 5,
          total_amount: 500, // Correct: 100 * 5 = 500
        },
        {
          item_id: "LINE-002",
          unit_price: -50, // Anomaly: negative unit price
          quantity: 3,
          total_amount: -150,
        },
        {
          item_id: "LINE-003",
          unit_price: 200,
          quantity: 10,
          total_amount: 1500, // Anomaly: logical contradiction (200 * 10 = 2000, not 1500)
        },
        {
          item_id: "LINE-004",
          unit_price: 5000,
          quantity: 50,
          total_amount: 250000, // Anomaly: threshold excess (exceeds max allowed amount)
        },
      ],
      summary_total: 251850,
    };

    const threshold_config = {
      max_unit_price: 1000,
      max_total_amount: 100000,
      max_line_quantity: 20,
      allowed_negative_prices: false,
    };

    // Execute validation
    const validation_result = validateReportAnomalies(
      report_data,
      threshold_config
    );

    // Verify anomaly detection: threshold excess
    expect(validation_result.has_threshold_excess).toBe(true);
    expect(validation_result.threshold_excess_items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          item_id: "LINE-004",
          violation_type: "total_amount_exceeds_max",
          detected_value: 250000,
          threshold_value: 100000,
        }),
      ])
    );

    // Verify anomaly detection: negative values
    expect(validation_result.has_negative_values).toBe(true);
    expect(validation_result.negative_value_items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          item_id: "LINE-002",
          field_name: "unit_price",
          detected_value: -50,
        }),
      ])
    );

    // Verify logical contradiction detection: calculation mismatch
    expect(validation_result.has_calculation_contradiction).toBe(true);
    expect(validation_result.contradiction_items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          item_id: "LINE-003",
          expected_total: 2000,
          recorded_total: 1500,
          difference: 500,
        }),
      ])
    );

    // Verify distribution block flag is set
    expect(validation_result.can_distribute).toBe(false);
    expect(validation_result.distribution_block_reason).toEqual(
      expect.stringMatching(/anomaly|contradiction|threshold/)
    );

    // Verify detailed anomaly log is recorded
    expect(validation_result.anomaly_log).toBeDefined();
    expect(validation_result.anomaly_log.length).toBeGreaterThan(0);
    expect(validation_result.anomaly_log).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          log_id: expect.any(String),
          timestamp: expect.any(String),
          anomaly_type: expect.stringMatching(/threshold|negative|contradiction/),
          item_id: expect.any(String),
          severity: expect.stringMatching(/critical|warning/),
          details: expect.any(String),
        }),
      ])
    );

    // Verify error notification is generated
    expect(validation_result.error_notification).toBeDefined();
    expect(validation_result.error_notification.notification_id).toBeDefined();
    expect(validation_result.error_notification.recipients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recipient_type: expect.stringMatching(/representative|admin/),
          recipient_id: expect.any(String),
          notification_method: expect.stringMatching(/email|system/),
        }),
      ])
    );
    expect(validation_result.error_notification.message).toEqual(
      expect.stringMatching(/anomaly|distribution|blocked/)
    );

    // Verify report metadata reflects blocked status
    expect(validation_result.report_metadata.status).toBe("blocked_from_distribution");
    expect(validation_result.report_metadata.blocked_at).toBeDefined();
    expect(validation_result.report_metadata.block_reason_summary).toEqual(
      expect.stringMatching(/異常値|矛盾|閾値/) ||
        expect.stringMatching(/anomaly|contradiction|threshold/)
    );

    // Verify audit trail records validation execution
    expect(validation_result.audit_trail).toBeDefined();
    expect(validation_result.audit_trail.validation_executed_at).toBeDefined();
    expect(validation_result.audit_trail.anomaly_count).toBe(4);
    expect(validation_result.audit_trail.contradiction_count).toBe(1);
  });
});