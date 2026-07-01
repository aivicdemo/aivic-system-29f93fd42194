import { reconcileContractAndDiscounts } from "../../src/logic/it-1-2-1";

describe("Contract and Discount Reconciliation with Conflict Resolution", () => {
  test("SCEN-1287: [edge] Multiple competing discounts are correctly prioritized and only highest-priority discount is applied", () => {
    // Setup: Multiple discount rules with different conditions and priorities
    const discountRules = [
      {
        discount_rule_id: "DR001",
        rule_name: "Customer Grade Discount",
        discount_type: "percentage",
        discount_rate: 10,
        applicable_customer_grade: "A",
        priority: 2,
        conflict_resolution_order: 2,
      },
      {
        discount_rule_id: "DR002",
        rule_name: "New Customer Discount",
        discount_type: "percentage",
        discount_rate: 15,
        applicable_customer_type: "new",
        priority: 1,
        conflict_resolution_order: 1,
      },
      {
        discount_rule_id: "DR003",
        rule_name: "Volume Discount",
        discount_type: "percentage",
        discount_rate: 8,
        applicable_min_transaction_amount: 100000,
        priority: 3,
        conflict_resolution_order: 3,
      },
    ];

    // Contract data that qualifies for multiple discount rules
    const contractData = {
      contract_id: "CT001",
      customer_id: "CUST001",
      customer_grade: "A",
      customer_type: "new",
      service_id: "SRV001",
      base_sales_amount: 150000,
      contract_status: "active",
      applicable_start_date: "2024-01-01",
      applicable_end_date: "2024-12-31",
    };

    // Execute reconciliation
    const reconciliationResult = reconcileContractAndDiscounts({
      contractData,
      discountRules,
      evaluationDate: "2024-06-15",
    });

    // Verify all competing discount rules are recognized
    expect(reconciliationResult.identified_applicable_discounts).toHaveLength(2);
    expect(reconciliationResult.identified_applicable_discounts).toContainEqual(
      expect.objectContaining({
        discount_rule_id: "DR001",
        rule_name: "Customer Grade Discount",
        discount_rate: 10,
      })
    );
    expect(reconciliationResult.identified_applicable_discounts).toContainEqual(
      expect.objectContaining({
        discount_rule_id: "DR002",
        rule_name: "New Customer Discount",
        discount_rate: 15,
      })
    );

    // Verify conflict detection occurred
    expect(reconciliationResult.conflict_detected).toBe(true);
    expect(reconciliationResult.competing_rules_count).toBe(2);

    // Verify the highest-priority discount (DR002: 15%) is selected based on priority=1
    expect(reconciliationResult.selected_discount_rule_id).toBe("DR002");
    expect(reconciliationResult.selected_discount_rate).toBe(15);
    expect(reconciliationResult.selection_rationale).toMatch(/優先度/);

    // Verify conflicting rules are excluded
    expect(reconciliationResult.excluded_discount_rules).toContainEqual(
      expect.objectContaining({
        discount_rule_id: "DR001",
        exclusion_reason: "競合",
      })
    );

    // Verify reconciliation status
    expect(reconciliationResult.reconciliation_status).toBe("success");

    // Verify conflict resolution history is recorded with traceability
    expect(reconciliationResult.conflict_resolution_history).toBeDefined();
    expect(reconciliationResult.conflict_resolution_history.length).toBeGreaterThan(
      0
    );
    expect(
      reconciliationResult.conflict_resolution_history[0]
    ).toMatchObject({
      detected_competing_rules: expect.arrayContaining([
        "DR001",
        "DR002",
      ]),
      resolution_method: "priority_based",
      selected_rule_id: "DR002",
      resolution_timestamp: expect.any(String),
    });

    // Verify no unintended discount duplication
    expect(reconciliationResult.total_discount_count).toBe(1);

    // Verify final billing amount calculation with selected discount applied
    const expected_billing_amount = 150000 * (1 - 15 / 100); // 127,500
    expect(reconciliationResult.calculated_billing_amount).toBe(127500);
  });
});