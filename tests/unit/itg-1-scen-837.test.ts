import { describe, test, expect, beforeEach } from "@jest/globals";
import { compareContractVersions } from "../../src/logic/it-1781935279444-2-1-1";

describe("Contract Change Comparison and Diff Visualization", () => {
  test("SCEN-837: Contract change before/after conditions are extracted and compared chronologically with diffs visualized", () => {
    // Precondition: Contract change notification received, initial contract conditions confirmed
    const beforeContractData = {
      contract_id: "CNT-001",
      customer_id: "CUST-A001",
      service_type: "standard_plan",
      monthly_fee: 50000,
      unit_price_apo: 1000,
      unit_price_deal: 5000,
      discount_rate: 0.1,
      billing_start_date: "2024-01-01",
      billing_end_date: "2024-12-31",
      payment_terms_days: 30,
      contract_status: "active"
    };

    const afterContractData = {
      contract_id: "CNT-001",
      customer_id: "CUST-A001",
      service_type: "premium_plan",
      monthly_fee: 75000,
      unit_price_apo: 1200,
      unit_price_deal: 6000,
      discount_rate: 0.15,
      billing_start_date: "2024-01-01",
      billing_end_date: "2024-12-31",
      payment_terms_days: 45,
      contract_status: "active"
    };

    const changeMetadata = {
      change_timestamp: "2024-06-15T10:30:00Z",
      changed_by: "OP-001",
      change_reason: "Customer request upgrade"
    };

    // Action: Execute contract change comparison function
    const result = compareContractVersions(
      beforeContractData,
      afterContractData,
      changeMetadata
    );

    // Assertion 1: Result structure contains all required fields
    expect(result).toHaveProperty("contract_id");
    expect(result).toHaveProperty("comparison_result");
    expect(result).toHaveProperty("diff_items");
    expect(result).toHaveProperty("change_metadata");

    // Assertion 2: Contract ID matches
    expect(result.contract_id).toBe("CNT-001");

    // Assertion 3: Diff items count - 6 fields changed (service_type, monthly_fee, unit_price_apo, unit_price_deal, discount_rate, payment_terms_days)
    expect(result.diff_items).toHaveLength(6);

    // Assertion 4: service_type diff is captured correctly
    const service_type_diff = result.diff_items.find(
      (item: any) => item.field_name === "service_type"
    );
    expect(service_type_diff).toBeDefined();
    expect(service_type_diff.before_value).toBe("standard_plan");
    expect(service_type_diff.after_value).toBe("premium_plan");
    expect(service_type_diff.change_type).toBe("modified");

    // Assertion 5: monthly_fee diff with numeric values
    const monthly_fee_diff = result.diff_items.find(
      (item: any) => item.field_name === "monthly_fee"
    );
    expect(monthly_fee_diff).toBeDefined();
    expect(monthly_fee_diff.before_value).toBe(50000);
    expect(monthly_fee_diff.after_value).toBe(75000);
    expect(monthly_fee_diff.numeric_change).toBe(25000);
    expect(monthly_fee_diff.percent_change).toBe(50);

    // Assertion 6: unit_price_apo diff
    const unit_price_apo_diff = result.diff_items.find(
      (item: any) => item.field_name === "unit_price_apo"
    );
    expect(unit_price_apo_diff).toBeDefined();
    expect(unit_price_apo_diff.before_value).toBe(1000);
    expect(unit_price_apo_diff.after_value).toBe(1200);
    expect(unit_price_apo_diff.numeric_change).toBe(200);

    // Assertion 7: unit_price_deal diff
    const unit_price_deal_diff = result.diff_items.find(
      (item: any) => item.field_name === "unit_price_deal"
    );
    expect(unit_price_deal_diff).toBeDefined();
    expect(unit_price_deal_diff.before_value).toBe(5000);
    expect(unit_price_deal_diff.after_value).toBe(6000);

    // Assertion 8: discount_rate diff
    const discount_rate_diff = result.diff_items.find(
      (item: any) => item.field_name === "discount_rate"
    );
    expect(discount_rate_diff).toBeDefined();
    expect(discount_rate_diff.before_value).toBe(0.1);
    expect(discount_rate_diff.after_value).toBe(0.15);
    expect(discount_rate_diff.numeric_change).toBe(0.05);

    // Assertion 9: payment_terms_days diff
    const payment_terms_days_diff = result.diff_items.find(
      (item: any) => item.field_name === "payment_terms_days"
    );
    expect(payment_terms_days_diff).toBeDefined();
    expect(payment_terms_days_diff.before_value).toBe(30);
    expect(payment_terms_days_diff.after_value).toBe(45);
    expect(payment_terms_days_diff.numeric_change).toBe(15);

    // Assertion 10: No change fields (billing dates and contract status)
    const unchanged_fields = result.diff_items.filter(
      (item: any) => item.change_type === "unchanged"
    );
    expect(unchanged_fields.length).toBe(0);

    // Assertion 11: Change metadata is preserved with correct timestamp
    expect(result.change_metadata.change_timestamp).toBe("2024-06-15T10:30:00Z");
    expect(result.change_metadata.changed_by).toBe("OP-001");
    expect(result.change_metadata.change_reason).toBe("Customer request upgrade");

    // Assertion 12: Comparison result includes summary
    expect(result.comparison_result).toHaveProperty("total_fields_compared");
    expect(result.comparison_result.total_fields_compared).toBe(10);

    expect(result.comparison_result).toHaveProperty("total_fields_changed");
    expect(result.comparison_result.total_fields_changed).toBe(6);

    expect(result.comparison_result).toHaveProperty("total_fields_unchanged");
    expect(result.comparison_result.total_fields_unchanged).toBe(4);

    // Assertion 13: Visualization indicators are present
    expect(result.diff_items[0]).toHaveProperty("visualization_highlight");
    expect(result.diff_items[0].visualization_highlight).toBe(true);

    // Assertion 14: All changed items have visualization flag set to true
    result.diff_items.forEach((item: any) => {
      if (item.change_type === "modified") {
        expect(item.visualization_highlight).toBe(true);
      }
    });

    // Assertion 15: Chronological ordering - change timestamp is recorded
    expect(result).toHaveProperty("extracted_timestamp");
    expect(result.extracted_timestamp).toBeDefined();

    // Assertion 16: Complete visualization data structure
    expect(result).toHaveProperty("visual_format");
    expect(result.visual_format).toBe("side_by_side_with_highlighting");

    // Assertion 17: All required metadata fields present
    expect(result.change_metadata).toHaveProperty("change_timestamp");
    expect(result.change_metadata).toHaveProperty("changed_by");
    expect(result.change_metadata).toHaveProperty("change_reason");

    // Assertion 18: Error detection for critical fields
    expect(result).toHaveProperty("has_critical_changes");
    expect(result.has_critical_changes).toBe(true);

    // Assertion 19: Diff accuracy validation - ensure no data loss
    const modified_count = result.diff_items.filter(
      (item: any) => item.change_type === "modified"
    ).length;
    expect(modified_count).toBe(6);

    // Assertion 20: Ensure comparison is bidirectional and complete
    expect(result.diff_items).toContainEqual(
      expect.objectContaining({
        field_name: "service_type",
        before_value: "standard_plan",
        after_value: "premium_plan"
      })
    );
  });
});