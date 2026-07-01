import { validateSalesDataIntegrity } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性自動検証", () => {
  // SCEN-1122
  test("必須項目がすべて存在する場合、検証が完了し異常値なしで判定される", () => {
    const sales_data = {
      sales_id: "SLS-20240115-001",
      customer_id: "CUST-001",
      sales_person_id: "SALES-001",
      transaction_amount: 150000,
      transaction_date: "2024-01-15",
      service_type: "basic_plan",
      status: "completed",
    };

    const billing_data = {
      billing_id: "BIL-20240115-001",
      billing_amount: 150000,
      billing_date: "2024-01-20",
      billing_target: "CUST-001",
      status: "issued",
    };

    const contract_info = {
      contract_id: "CTR-001",
      contract_holder: "Acme Corp",
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
      contract_amount: 1800000,
      status: "active",
    };

    const result = validateSalesDataIntegrity({
      sales_data,
      billing_data,
      contract_info,
    });

    expect(result.validation_status).toBe("completed");
    expect(result.has_error).toBe(false);
    expect(result.missing_required_fields).toEqual([]);
    expect(result.anomaly_count).toBe(0);
    expect(result.warning_count).toBe(0);
    expect(result.validation_result).toBe("pass");
  });
});