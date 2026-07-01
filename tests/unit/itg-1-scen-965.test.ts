import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの品質検証 - データ型不整合検出", () => {
  // SCEN-965: [normal] 営業データ品質検証機能 - 営業データのデータ型不整合（文字列が数値フィールドなど）を検出できる
  test("should detect data type mismatches in numeric fields and return detailed error report with row number, field name, expected type and actual value", () => {
    const salesDataWithTypeMismatch = [
      {
        recordId: 1,
        customerId: "CUST001",
        appointmentCount: "15", // Expected: number, Actual: string
        contractCount: 3,
        revenue: "120000.50", // Expected: number, Actual: string
        serviceType: "TypeA",
        contactDate: "2024-01-15"
      },
      {
        recordId: 2,
        customerId: "CUST002",
        appointmentCount: 8,
        contractCount: "invalid", // Expected: number, Actual: string
        revenue: 85000,
        serviceType: "TypeB",
        contactDate: "2024-01-16"
      },
      {
        recordId: 3,
        customerId: "CUST003",
        appointmentCount: 12,
        contractCount: 5,
        revenue: 95500.75,
        serviceType: "TypeC",
        contactDate: "2024-01-17"
      },
      {
        recordId: 4,
        customerId: "CUST004",
        appointmentCount: "abc", // Expected: number, Actual: string
        contractCount: 2,
        revenue: "not_a_number", // Expected: number, Actual: string
        serviceType: "TypeA",
        contactDate: "2024-01-18"
      }
    ];

    const validSalesData = [
      {
        recordId: 1,
        customerId: "CUST001",
        appointmentCount: 15,
        contractCount: 3,
        revenue: 120000.50,
        serviceType: "TypeA",
        contactDate: "2024-01-15"
      },
      {
        recordId: 2,
        customerId: "CUST002",
        appointmentCount: 8,
        contractCount: 2,
        revenue: 85000,
        serviceType: "TypeB",
        contactDate: "2024-01-16"
      }
    ];

    // Test 1: Multiple type mismatches detected with complete error details
    const validationResult = validateSalesData(salesDataWithTypeMismatch);

    expect(validationResult.isValid).toBe(false);
    expect(validationResult.errors).toBeDefined();
    expect(validationResult.errors.length).toBe(4);

    // Error 1: appointmentCount type mismatch in record 1
    expect(validationResult.errors[0]).toEqual({
      recordNumber: 1,
      fieldName: "appointmentCount",
      expectedType: "number",
      actualValue: "15",
      actualType: "string",
      severity: "error"
    });

    // Error 2: revenue type mismatch in record 1
    expect(validationResult.errors[1]).toEqual({
      recordNumber: 1,
      fieldName: "revenue",
      expectedType: "number",
      actualValue: "120000.50",
      actualType: "string",
      severity: "error"
    });

    // Error 3: contractCount type mismatch in record 2
    expect(validationResult.errors[2]).toEqual({
      recordNumber: 2,
      fieldName: "contractCount",
      expectedType: "number",
      actualValue: "invalid",
      actualType: "string",
      severity: "error"
    });

    // Error 4: appointmentCount and revenue mismatches in record 4
    expect(validationResult.errors[3]).toEqual({
      recordNumber: 4,
      fieldName: "appointmentCount",
      expectedType: "number",
      actualValue: "abc",
      actualType: "string",
      severity: "error"
    });

    // Additional error for record 4 revenue
    expect(validationResult.errors.length).toBeGreaterThanOrEqual(4);
    const revenueError = validationResult.errors.find(
      (e) => e.recordNumber === 4 && e.fieldName === "revenue"
    );
    expect(revenueError).toBeDefined();
    expect(revenueError?.expectedType).toBe("number");
    expect(revenueError?.actualValue).toBe("not_a_number");
    expect(revenueError?.actualType).toBe("string");

    // Test 2: Valid data should pass validation with no errors
    const validationResultForGoodData = validateSalesData(validSalesData);

    expect(validationResultForGoodData.isValid).toBe(true);
    expect(validationResultForGoodData.errors.length).toBe(0);

    // Test 3: Validate error report structure completeness
    expect(validationResult.errorSummary).toBeDefined();
    expect(validationResult.errorSummary.totalRecords).toBe(4);
    expect(validationResult.errorSummary.recordsWithErrors).toBe(3);
    expect(validationResult.errorSummary.totalErrorCount).toBeGreaterThanOrEqual(4);
  });
});