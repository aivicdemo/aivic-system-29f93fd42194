import { describe, test, expect } from "@jest/globals";
import { validateSalesDataCompleteness } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性自動検証", () => {
  // SCEN-1051
  test("営業データの値が許容範囲の下限値ちょうどの場合、検証OK と判定される", () => {
    const test_data = {
      appointment_count: 0,
      contract_count: 5,
      customer_response_score: 0,
      service_type: "standard",
      contact_date: "2024-01-15",
      customer_id: "CUST001",
    };

    const result = validateSalesDataCompleteness(test_data);

    expect(result.is_valid).toBe(true);
    expect(result.error_message).toBe("");
    expect(result.validation_status).toBe("OK");
  });
});