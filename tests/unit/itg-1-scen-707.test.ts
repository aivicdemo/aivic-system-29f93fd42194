import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  validateSalesDataWithPriority,
} from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ自動検証ルール実行機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-707
  test("日付が未来日で金額が負数の場合、エラー優先度に基づいて検出順序が決定される", () => {
    const currentDate = new Date("2024-01-15T10:00:00Z");
    const futureDate = new Date("2024-02-14T10:00:00Z");

    const salesDataRecord = {
      id: "sales_001",
      customer_id: "cust_123",
      service_type: "service_A",
      activity_date: futureDate.toISOString(),
      amount: -50000,
      appointment_status: "confirmed",
      contact_type: "phone",
    };

    const validationRules = [
      {
        rule_id: "rule_date_check",
        rule_name: "日付チェック",
        error_priority: 1,
        check_field: "activity_date",
        rule_condition: "must_not_be_future_date",
        current_date: currentDate,
      },
      {
        rule_id: "rule_amount_check",
        rule_name: "金額チェック",
        error_priority: 2,
        check_field: "amount",
        rule_condition: "must_be_positive",
      },
    ];

    const result = validateSalesDataWithPriority(
      salesDataRecord,
      validationRules,
      currentDate
    );

    expect(result).toBeDefined();
    expect(result.is_valid).toBe(false);
    expect(result.validation_errors).toBeDefined();
    expect(Array.isArray(result.validation_errors)).toBe(true);
    expect(result.validation_errors.length).toBe(2);

    expect(result.validation_errors[0].error_priority).toBe(1);
    expect(result.validation_errors[0].rule_id).toBe("rule_date_check");
    expect(result.validation_errors[0].check_field).toBe("activity_date");
    expect(result.validation_errors[0].detected_value).toBe(
      futureDate.toISOString()
    );

    expect(result.validation_errors[1].error_priority).toBe(2);
    expect(result.validation_errors[1].rule_id).toBe("rule_amount_check");
    expect(result.validation_errors[1].check_field).toBe("amount");
    expect(result.validation_errors[1].detected_value).toBe(-50000);

    const priorities = result.validation_errors.map((err) => err.error_priority);
    expect(priorities).toEqual([1, 2]);

    expect(result.validation_errors[0].error_message).toMatch(/未来日/);
    expect(result.validation_errors[1].error_message).toMatch(/負数/);

    expect(result.sorted_by_priority).toBe(true);
  });
});