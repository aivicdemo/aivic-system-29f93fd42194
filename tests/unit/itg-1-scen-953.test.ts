import {
  identifyContractForBilling,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  // SCEN-953: [edge] 請求対象契約確認・割引基準識別機能 - 有効期限の開始日と終了日が同一日である契約が正しく判定される
  test("開始日と終了日が同一日である契約は有効と判定され、割引基準が正確に識別される", () => {
    const contract_id = "CNT-001";
    const customer_id = "CUST-A001";
    const start_date = "2024-01-15";
    const end_date = "2024-01-15";
    const discount_rate = 10;
    const service_type = "BASIC";
    const status = "ACTIVE";

    const result = identifyContractForBilling({
      contract_id,
      customer_id,
      start_date,
      end_date,
      discount_rate,
      service_type,
      status,
    });

    expect(result).toEqual({
      contract_id: "CNT-001",
      customer_id: "CUST-A001",
      is_valid: true,
      is_billing_target: true,
      discount_rate: 10,
      discount_applicable: true,
      service_type: "BASIC",
      contract_status: "ACTIVE",
      start_date: "2024-01-15",
      end_date: "2024-01-15",
      billing_period_days: 1,
    });

    expect(result.is_valid).toBe(true);
    expect(result.is_billing_target).toBe(true);
    expect(result.discount_applicable).toBe(true);
    expect(result.discount_rate).toBe(10);
    expect(result.billing_period_days).toBe(1);
  });
});