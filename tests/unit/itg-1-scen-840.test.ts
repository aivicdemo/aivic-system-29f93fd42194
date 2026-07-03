import { describe, test, expect } from "@jest/globals";
import { compareContractChanges } from "../../src/logic/it-1781935279444-2-1-1";

describe("Contract Change Comparison and Diff Visualization", () => {
  test("SCEN-840: Contract conditions with zero change (0 yen) should clearly display no change status", () => {
    // Pre-condition: Existing contract record with specific numeric values
    const before_contract = {
      contract_id: "C-12345",
      customer_id: "CUST-001",
      service_name: "Standard Service",
      monthly_fee_yen: 50000,
      discount_amount_yen: 5000,
      setup_fee_yen: 10000,
      cancellation_fee_yen: 0,
      min_term_months: 12,
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
    };

    // Trigger: User updates numeric fields with same values (0 yen remains 0 yen)
    const after_contract = {
      contract_id: "C-12345",
      customer_id: "CUST-001",
      service_name: "Standard Service",
      monthly_fee_yen: 50000,
      discount_amount_yen: 5000,
      setup_fee_yen: 10000,
      cancellation_fee_yen: 0,
      min_term_months: 12,
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
    };

    // Execute comparison
    const diff_result = compareContractChanges({
      before: before_contract,
      after: after_contract,
    });

    // Outcome: Verify no-change items are clearly marked and visually distinguished
    expect(diff_result).toEqual({
      contract_id: "C-12345",
      changed_items: [],
      unchanged_items: [
        {
          field_name: "monthly_fee_yen",
          before_value: 50000,
          after_value: 50000,
          change_status: "no_change",
          display_label: "変更なし",
          visual_indicator: "—",
        },
        {
          field_name: "discount_amount_yen",
          before_value: 5000,
          after_value: 5000,
          change_status: "no_change",
          display_label: "変更なし",
          visual_indicator: "—",
        },
        {
          field_name: "setup_fee_yen",
          before_value: 10000,
          after_value: 10000,
          change_status: "no_change",
          display_label: "変更なし",
          visual_indicator: "—",
        },
        {
          field_name: "cancellation_fee_yen",
          before_value: 0,
          after_value: 0,
          change_status: "no_change",
          display_label: "変更なし",
          visual_indicator: "—",
        },
        {
          field_name: "min_term_months",
          before_value: 12,
          after_value: 12,
          change_status: "no_change",
          display_label: "変更なし",
          visual_indicator: "—",
        },
        {
          field_name: "contract_start_date",
          before_value: "2024-01-01",
          after_value: "2024-01-01",
          change_status: "no_change",
          display_label: "変更なし",
          visual_indicator: "—",
        },
        {
          field_name: "contract_end_date",
          before_value: "2024-12-31",
          after_value: "2024-12-31",
          change_status: "no_change",
          display_label: "変更なし",
          visual_indicator: "—",
        },
      ],
      has_changes: false,
      diff_list_excludes_unchanged: true,
      visual_distinction_applied: true,
      user_recognition_clear: true,
    });

    // Verify no-change items are excluded from diff list
    expect(diff_result.changed_items.length).toBe(0);

    // Verify unchanged items are present and properly labeled
    expect(diff_result.unchanged_items.length).toBe(7);
    expect(
      diff_result.unchanged_items.every(
        (item) => item.change_status === "no_change"
      )
    ).toBe(true);

    // Verify visual indicators are set for no-change items
    expect(
      diff_result.unchanged_items.every(
        (item) => item.visual_indicator === "—"
      )
    ).toBe(true);

    // Verify display labels clearly indicate no change
    expect(
      diff_result.unchanged_items.every(
        (item) => item.display_label === "変更なし"
      )
    ).toBe(true);

    // Verify overall diff result indicates no changes
    expect(diff_result.has_changes).toBe(false);

    // Verify that unchanged items are excluded from change list
    expect(diff_result.diff_list_excludes_unchanged).toBe(true);

    // Verify visual distinction is applied
    expect(diff_result.visual_distinction_applied).toBe(true);

    // Verify user can clearly recognize no change
    expect(diff_result.user_recognition_clear).toBe(true);
  });
});