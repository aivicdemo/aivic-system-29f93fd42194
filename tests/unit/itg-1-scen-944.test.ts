import { calculateDiscountedBillingAmount } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-944: [error] 契約別割引基準の確認機能 - 割引ルールがマスタに存在しない場合、該当割引は適用されずエラーが記録される
  test("割引ルールがマスタに存在しない場合、該当割引は適用されずエラーが記録される", () => {
    const contract_id = "CONTRACT-001";
    const customer_id = "CUST-A";
    const service_id = "SRV-001";
    const base_billing_amount = 100000;
    const discount_rule_id = "DISCOUNT-NONEXISTENT-999";
    const discount_master_data = [
      {
        discount_rule_id: "DISCOUNT-001",
        discount_name: "Early Bird Discount",
        discount_rate: 0.1,
      },
      {
        discount_rule_id: "DISCOUNT-002",
        discount_name: "Volume Discount",
        discount_rate: 0.05,
      },
    ];

    const input_params = {
      contract_id: contract_id,
      customer_id: customer_id,
      service_id: service_id,
      base_billing_amount: base_billing_amount,
      discount_rule_id: discount_rule_id,
      discount_master_data: discount_master_data,
    };

    const result = calculateDiscountedBillingAmount(input_params);

    expect(result.billing_amount).toBe(100000);
    expect(result.discount_applied).toBe(false);
    expect(result.error_occurred).toBe(true);
    expect(result.error_code).toBe("DISCOUNT_RULE_NOT_FOUND");
    expect(result.error_message).toMatch(/割引/);
    expect(result.error_log).toBeDefined();
    expect(result.error_log.contract_id).toBe(contract_id);
    expect(result.error_log.discount_rule_id).toBe(discount_rule_id);
    expect(result.error_log.error_reason).toMatch(/マスタ/);
  });
});