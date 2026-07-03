import { describe, test, expect } from "@jest/globals";
import { validateSalesDataCompleteness } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性自動検証", () => {
  // SCEN-1048
  test("営業データに不足データ・誤りが無い場合、検証OK と判定される", () => {
    const complete_sales_data = {
      customer_name: "株式会社テスト商事",
      amount: 150000,
      transaction_date: "2024-01-15",
      sales_staff_name: "田中太郎",
      service_type: "営業代行",
      appointment_count: 5,
      contract_count: 2,
      customer_response: "positive",
      status: "confirmed",
    };

    const validation_result = validateSalesDataCompleteness(
      complete_sales_data
    );

    expect(validation_result.validation_status).toBe("OK");
    expect(validation_result.is_complete).toBe(true);
    expect(validation_result.has_errors).toBe(false);
    expect(validation_result.missing_fields.length).toBe(0);
    expect(validation_result.error_fields.length).toBe(0);
    expect(validation_result.validated_fields_count).toBe(9);
    expect(validation_result.validation_log).toContain("completed");
  });
});