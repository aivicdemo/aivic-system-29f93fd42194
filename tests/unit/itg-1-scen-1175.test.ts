import { describe, test, expect } from "@jest/globals";

describe("レポート数値の正確性合否判定機能", () => {
  test("SCEN-1175: 判定保留が必要な場合を要確認として判定できる", () => {
    // Import the validation logic function
    const { validateReportAccuracyWithThreshold } = require("../../src/logic/it-1781935279444-2-1-1");

    // Test scenario: Report data with values near threshold boundary
    // where judgment is ambiguous and requires confirmation
    const report_data = {
      report_id: "RPT-2024-001",
      customer_id: "CUST-100",
      service_id: "SVC-A",
      report_period: "2024-01",
      data_items: [
        {
          item_name: "appointment_count",
          reported_value: 95,
          source_value: 93,
          unit: "count",
          tolerance_percentage: 3.0,
        },
        {
          item_name: "contract_count",
          reported_value: 48,
          source_value: 50,
          unit: "count",
          tolerance_percentage: 5.0,
        },
        {
          item_name: "customer_satisfaction",
          reported_value: 4.48,
          source_value: 4.5,
          unit: "score",
          tolerance_percentage: 1.0,
        },
      ],
      created_at: new Date("2024-01-31T10:00:00Z"),
      created_by_user_id: "USER-001",
    };

    // Expected validation result: some items pass, some are near boundary (require confirmation)
    const validation_result = validateReportAccuracyWithThreshold(report_data);

    // Verify that result contains validation status
    expect(validation_result).toHaveProperty("overall_judgment_status");
    expect(validation_result).toHaveProperty("judgment_items");
    expect(validation_result).toHaveProperty("requires_confirmation");
    expect(validation_result).toHaveProperty("confirmation_reason");
    expect(validation_result).toHaveProperty("workflow_status");

    // Verify overall judgment is "要確認" (confirmation required)
    expect(validation_result.overall_judgment_status).toBe("要確認");

    // Verify that requires_confirmation flag is set to true
    expect(validation_result.requires_confirmation).toBe(true);

    // Verify judgment items contain detailed validation results
    expect(validation_result.judgment_items).toBeInstanceOf(Array);
    expect(validation_result.judgment_items.length).toBe(3);

    // Verify specific item judgments
    const appointment_item = validation_result.judgment_items.find(
      (item) => item.item_name === "appointment_count"
    );
    expect(appointment_item).toBeDefined();
    expect(appointment_item.variance_percentage).toBe(2.15);
    expect(appointment_item.judgment).toBe("合格");

    const contract_item = validation_result.judgment_items.find(
      (item) => item.item_name === "contract_count"
    );
    expect(contract_item).toBeDefined();
    expect(contract_item.variance_percentage).toBe(4.0);
    expect(contract_item.judgment).toBe("要確認");
    expect(contract_item.reason).toBe("boundary_near_threshold");

    const satisfaction_item = validation_result.judgment_items.find(
      (item) => item.item_name === "customer_satisfaction"
    );
    expect(satisfaction_item).toBeDefined();
    expect(satisfaction_item.variance_percentage).toBe(0.44);
    expect(satisfaction_item.judgment).toBe("要確認");
    expect(satisfaction_item.reason).toBe("boundary_near_threshold");

    // Verify confirmation reason is provided
    expect(validation_result.confirmation_reason).toContain(
      "contract_count"
    );
    expect(validation_result.confirmation_reason).toContain(
      "customer_satisfaction"
    );

    // Verify workflow status is set to "確認待ち" (confirmation pending)
    expect(validation_result.workflow_status).toBe("確認待ち");

    // Verify that confirmation queue information is included
    expect(validation_result).toHaveProperty("queue_info");
    expect(validation_result.queue_info).toHaveProperty("queue_id");
    expect(validation_result.queue_info).toHaveProperty(
      "assigned_reviewer_user_id"
    );
    expect(validation_result.queue_info.queue_status).toBe("pending");

    // Verify validation timestamp is recorded
    expect(validation_result).toHaveProperty("validation_timestamp");
    expect(new Date(validation_result.validation_timestamp).getTime()).toBeGreaterThan(
      0
    );

    // Verify detail information for confirmation is available
    expect(validation_result).toHaveProperty("confirmation_details");
    expect(
      validation_result.confirmation_details.borderline_items_count
    ).toBe(2);
    expect(
      validation_result.confirmation_details.approval_required
    ).toBe(true);

    // Test edge case: all items within tolerance should result in "合格"
    const compliant_report = {
      report_id: "RPT-2024-002",
      customer_id: "CUST-200",
      service_id: "SVC-B",
      report_period: "2024-01",
      data_items: [
        {
          item_name: "appointment_count",
          reported_value: 100,
          source_value: 100,
          unit: "count",
          tolerance_percentage: 3.0,
        },
        {
          item_name: "contract_count",
          reported_value: 50,
          source_value: 50,
          unit: "count",
          tolerance_percentage: 5.0,
        },
      ],
      created_at: new Date("2024-01-31T10:00:00Z"),
      created_by_user_id: "USER-001",
    };

    const compliant_result = validateReportAccuracyWithThreshold(
      compliant_report
    );
    expect(compliant_result.overall_judgment_status).toBe("合格");
    expect(compliant_result.requires_confirmation).toBe(false);
    expect(compliant_result.workflow_status).toBe("承認済み");

    // Test edge case: items exceeding tolerance should result in "不合格"
    const non_compliant_report = {
      report_id: "RPT-2024-003",
      customer_id: "CUST-300",
      service_id: "SVC-C",
      report_period: "2024-01",
      data_items: [
        {
          item_name: "appointment_count",
          reported_value: 80,
          source_value: 100,
          unit: "count",
          tolerance_percentage: 3.0,
        },
      ],
      created_at: new Date("2024-01-31T10:00:00Z"),
      created_by_user_id: "USER-001",
    };

    const non_compliant_result = validateReportAccuracyWithThreshold(
      non_compliant_report
    );
    expect(non_compliant_result.overall_judgment_status).toBe("不合格");
    expect(non_compliant_result.requires_confirmation).toBe(false);
    expect(non_compliant_result.workflow_status).toBe("差戻し");
  });
});