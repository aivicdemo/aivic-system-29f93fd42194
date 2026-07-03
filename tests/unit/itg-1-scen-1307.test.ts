import { describe, test, expect, beforeEach } from "@jest/globals";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1307: [normal] 処理エラーハンドリング・通知機能 - 営業データ検証エラー発生時に、エラー内容が記録され代表に通知される
  test("SCEN-1307: 営業データ検証エラー発生時にエラー内容が記録され代表に通知される", async () => {
    // Import the validation function
    const { validateSalesData } = await import("../../src/logic/it-1-1-1");

    // Test Case 1: Missing required field (顧客名 missing)
    const invalidData_missingCustomer = {
      contact_date: "2024-01-15",
      deal_type: "新規商談",
      appoint_count: 1,
      contract_count: 0,
      service_category: "営業支援",
    };

    const result_missingCustomer = validateSalesData(
      invalidData_missingCustomer
    );
    expect(result_missingCustomer.is_valid).toBe(false);
    expect(result_missingCustomer.error_code).toBe("REQUIRED_FIELD_MISSING");
    expect(result_missingCustomer.error_message).toMatch(/顧客名/);
    expect(result_missingCustomer.error_timestamp).toBeDefined();
    expect(typeof result_missingCustomer.error_timestamp).toBe("string");
    expect(result_missingCustomer.failed_field).toBe("customer_name");
    expect(result_missingCustomer.validation_rule_applied).toMatch(
      /必須項目/
    );

    // Test Case 2: Data type mismatch (appoint_count should be number, not string)
    const invalidData_typeError = {
      customer_name: "ABC株式会社",
      contact_date: "2024-01-15",
      deal_type: "新規商談",
      appoint_count: "1", // Invalid: should be number
      contract_count: 0,
      service_category: "営業支援",
    };

    const result_typeError = validateSalesData(invalidData_typeError);
    expect(result_typeError.is_valid).toBe(false);
    expect(result_typeError.error_code).toBe("DATA_TYPE_MISMATCH");
    expect(result_typeError.error_message).toMatch(/データ型/);
    expect(result_typeError.failed_field).toBe("appoint_count");
    expect(result_typeError.error_details).toContain("number");

    // Test Case 3: Value out of range (appoint_count = -5, should be >= 0)
    const invalidData_rangeError = {
      customer_name: "XYZ株式会社",
      contact_date: "2024-01-15",
      deal_type: "新規商談",
      appoint_count: -5, // Invalid: must be non-negative
      contract_count: 0,
      service_category: "営業支援",
    };

    const result_rangeError = validateSalesData(invalidData_rangeError);
    expect(result_rangeError.is_valid).toBe(false);
    expect(result_rangeError.error_code).toBe("VALUE_OUT_OF_RANGE");
    expect(result_rangeError.error_message).toMatch(/範囲外/);
    expect(result_rangeError.failed_field).toBe("appoint_count");
    expect(result_rangeError.min_value).toBe(0);

    // Test Case 4: Invalid date format (contact_date should be ISO format)
    const invalidData_dateFormat = {
      customer_name: "DEF株式会社",
      contact_date: "2024/01/15", // Invalid: should be YYYY-MM-DD or ISO
      deal_type: "新規商談",
      appoint_count: 1,
      contract_count: 0,
      service_category: "営業支援",
    };

    const result_dateFormat = validateSalesData(invalidData_dateFormat);
    expect(result_dateFormat.is_valid).toBe(false);
    expect(result_dateFormat.error_code).toBe("INVALID_DATE_FORMAT");
    expect(result_dateFormat.error_message).toMatch(/日付形式/);
    expect(result_dateFormat.failed_field).toBe("contact_date");

    // Test Case 5: Valid data - should pass validation
    const validData = {
      customer_name: "正規株式会社",
      contact_date: "2024-01-15",
      deal_type: "新規商談",
      appoint_count: 2,
      contract_count: 1,
      service_category: "営業支援",
    };

    const result_valid = validateSalesData(validData);
    expect(result_valid.is_valid).toBe(true);
    expect(result_valid.error_code).toBeNull();
    expect(result_valid.error_message).toBeNull();
    expect(result_valid.validation_passed_at).toBeDefined();

    // Test Case 6: Error notification structure - verify notification object structure
    const result_notif = validateSalesData(invalidData_missingCustomer);
    expect(result_notif.should_notify_admin).toBe(true);
    expect(result_notif.notification_recipient).toBe("admin");
    expect(result_notif.notification_email).toMatch(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    );
    expect(result_notif.error_severity).toBe("high");
    expect(result_notif.notification_subject).toMatch(/営業データ検証エラー/);

    // Test Case 7: Error details included in notification
    const notif_details = result_notif.notification_body;
    expect(notif_details).toMatch(/エラーコード/);
    expect(notif_details).toMatch(/REQUIRED_FIELD_MISSING/);
    expect(notif_details).toMatch(/顧客名/);
    expect(notif_details).toMatch(result_notif.error_timestamp);

    // Test Case 8: Error log entry - verify logging structure
    expect(result_notif.error_log_entry).toBeDefined();
    expect(result_notif.error_log_entry.log_id).toBeDefined();
    expect(result_notif.error_log_entry.severity_level).toBe("ERROR");
    expect(result_notif.error_log_entry.error_code).toBe(
      "REQUIRED_FIELD_MISSING"
    );
    expect(result_notif.error_log_entry.recorded_at).toBeDefined();
    expect(result_notif.error_log_entry.source_system).toBe("sales_data_validator");

    // Test Case 9: Logical inconsistency detection (contract_count > appoint_count)
    const invalidData_inconsistency = {
      customer_name: "論理矛盾株式会社",
      contact_date: "2024-01-15",
      deal_type: "新規商談",
      appoint_count: 1,
      contract_count: 5, // Invalid: cannot have more contracts than appointments
      service_category: "営業支援",
    };

    const result_inconsistency = validateSalesData(
      invalidData_inconsistency
    );
    expect(result_inconsistency.is_valid).toBe(false);
    expect(result_inconsistency.error_code).toBe("LOGICAL_INCONSISTENCY");
    expect(result_inconsistency.error_message).toMatch(/矛盾/);

    // Test Case 10: Multiple validation errors - system should report first critical error
    const invalidData_multiple = {
      // Missing customer_name (critical)
      contact_date: "invalid-date", // Also invalid
      deal_type: "新規商談",
      appoint_count: -10, // Also invalid
      contract_count: 0,
      service_category: "営業支援",
    };

    const result_multiple = validateSalesData(invalidData_multiple);
    expect(result_multiple.is_valid).toBe(false);
    // System prioritizes required field errors
    expect(result_multiple.error_code).toBe("REQUIRED_FIELD_MISSING");
    expect(result_multiple.should_notify_admin).toBe(true);
    expect(result_multiple.notification_subject).toMatch(/営業データ検証エラー/);
  });
});