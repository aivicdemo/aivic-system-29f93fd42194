import { describe, test, expect, beforeEach } from "@jest/globals";
import { extractBillingDataForMonthlyInvoice } from "../../src/logic/it-1-2-1";

describe("月次請求書生成用データ出力 - 請求対象データが存在しない顧客の除外", () => {
  // SCEN-749
  test("請求対象データが存在しない顧客は出力から除外され、除外処理がログに記録される", () => {
    const input_data = [
      {
        customer_id: "CUST001",
        customer_name: "顧客A",
        service_id: "SRV001",
        service_name: "営業支援",
        billing_target_count: 5,
        unit_price: 10000,
      },
      {
        customer_id: "CUST002",
        customer_name: "顧客B",
        service_id: "SRV002",
        service_name: "マーケティング支援",
        billing_target_count: 0,
        unit_price: 8000,
      },
      {
        customer_id: "CUST003",
        customer_name: "顧客C",
        service_id: "SRV001",
        service_name: "営業支援",
        billing_target_count: 3,
        unit_price: 10000,
      },
      {
        customer_id: "CUST004",
        customer_name: "顧客D",
        service_id: "SRV003",
        service_name: "コンサルティング",
        billing_target_count: 0,
        unit_price: 15000,
      },
    ];

    const result = extractBillingDataForMonthlyInvoice({
      billing_records: input_data,
      period_start_date: "2024-01-01",
      period_end_date: "2024-01-31",
    });

    expect(result.output_data).toBeDefined();
    expect(result.output_data.length).toBe(2);

    const output_customer_ids = result.output_data.map(
      (item) => item.customer_id
    );
    expect(output_customer_ids).toContain("CUST001");
    expect(output_customer_ids).toContain("CUST003");
    expect(output_customer_ids).not.toContain("CUST002");
    expect(output_customer_ids).not.toContain("CUST004");

    expect(result.output_data[0].customer_id).toBe("CUST001");
    expect(result.output_data[0].billing_amount).toBe(50000);
    expect(result.output_data[1].customer_id).toBe("CUST003");
    expect(result.output_data[1].billing_amount).toBe(30000);

    expect(result.excluded_customers).toBeDefined();
    expect(result.excluded_customers.length).toBe(2);
    expect(result.excluded_customers).toContainEqual({
      customer_id: "CUST002",
      customer_name: "顧客B",
      reason: "請求対象データなし",
    });
    expect(result.excluded_customers).toContainEqual({
      customer_id: "CUST004",
      customer_name: "顧客D",
      reason: "請求対象データなし",
    });

    expect(result.audit_log).toBeDefined();
    expect(result.audit_log.total_input_customers).toBe(4);
    expect(result.audit_log.total_output_customers).toBe(2);
    expect(result.audit_log.excluded_count).toBe(2);
    expect(result.audit_log.processing_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
    expect(result.audit_log.status).toBe("success");
  });
});