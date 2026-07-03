import { describe, test, expect } from "@jest/globals";
import { validateSalesDataCompleteness } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証機能 - 必須項目不足時の不合格判定と詳細指摘", () => {
  // SCEN-593
  test("必須項目が不足している営業データが不合格判定され詳細指摘内容が表示される", () => {
    const testData = [
      {
        row_number: 1,
        customer_name: "顧客A",
        transaction_amount: 150000,
        transaction_date: "2024-01-15",
        service_type: "サービスX",
        appointment_status: "確定"
      },
      {
        row_number: 2,
        customer_name: "",
        transaction_amount: 200000,
        transaction_date: "2024-01-16",
        service_type: "サービスY",
        appointment_status: "確定"
      },
      {
        row_number: 3,
        customer_name: "顧客C",
        transaction_amount: null,
        transaction_date: "2024-01-17",
        service_type: "",
        appointment_status: "確定"
      },
      {
        row_number: 4,
        customer_name: "顧客D",
        transaction_amount: 120000,
        transaction_date: "",
        service_type: "サービスZ",
        appointment_status: "確定"
      }
    ];

    const result = validateSalesDataCompleteness(testData);

    expect(result.validation_status).toBe("不合格");
    expect(result.overall_message).toBe("データ検証失敗");
    expect(result.error_details).toBeDefined();
    expect(Array.isArray(result.error_details)).toBe(true);

    expect(result.error_details.length).toBe(4);

    const error_1 = result.error_details.find(
      (e: any) => e.row_number === 2 && e.missing_field === "customer_name"
    );
    expect(error_1).toBeDefined();
    expect(error_1.error_message).toMatch(/顧客名/);
    expect(error_1.recommendation).toMatch(/顧客名/);

    const error_2 = result.error_details.find(
      (e: any) => e.row_number === 3 && e.missing_field === "transaction_amount"
    );
    expect(error_2).toBeDefined();
    expect(error_2.error_message).toMatch(/取引金額/);

    const error_3 = result.error_details.find(
      (e: any) => e.row_number === 3 && e.missing_field === "service_type"
    );
    expect(error_3).toBeDefined();
    expect(error_3.error_message).toMatch(/サービス種別/);

    const error_4 = result.error_details.find(
      (e: any) => e.row_number === 4 && e.missing_field === "transaction_date"
    );
    expect(error_4).toBeDefined();
    expect(error_4.error_message).toMatch(/取引日/);

    expect(result.summary).toBeDefined();
    expect(result.summary.total_rows).toBe(4);
    expect(result.summary.failed_rows).toBe(3);
    expect(result.summary.passed_rows).toBe(1);
    expect(result.summary.failure_rate).toBe(0.75);

    expect(result.error_details[0]).toHaveProperty("row_number");
    expect(result.error_details[0]).toHaveProperty("missing_field");
    expect(result.error_details[0]).toHaveProperty("error_message");
    expect(result.error_details[0]).toHaveProperty("recommendation");
  });
});