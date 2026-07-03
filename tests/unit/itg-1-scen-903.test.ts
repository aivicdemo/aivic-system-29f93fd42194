import { verifyContractBillingConsistency } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-903: 契約内容と請求額の整合性検証 - 完全一致時は真を返す", () => {
    const contractData = {
      contract_id: "CTR-20240115-001",
      customer_id: "CUS-001",
      service_id: "SRV-001",
      billing_target_items: ["appointment_count", "deal_count"],
      unit_price_per_appointment: 5000,
      unit_price_per_deal: 50000,
      discount_rate: 0,
      minimum_billing_amount: 0,
      maximum_billing_amount: 1000000,
      billing_period_start: new Date("2024-01-01"),
      billing_period_end: new Date("2024-01-31"),
      delivery_date: new Date("2024-02-05"),
    };

    const billingData = {
      customer_id: "CUS-001",
      service_id: "SRV-001",
      appointment_count: 10,
      deal_count: 2,
      calculated_amount: 5000 * 10 + 50000 * 2,
      discount_amount: 0,
      final_billing_amount: 5000 * 10 + 50000 * 2,
      billing_period_start: new Date("2024-01-01"),
      billing_period_end: new Date("2024-01-31"),
      delivery_date: new Date("2024-02-05"),
    };

    const result = verifyContractBillingConsistency(contractData, billingData);

    expect(result).toBe(true);
    expect(billingData.calculated_amount).toBe(150000);
    expect(billingData.final_billing_amount).toBe(150000);
    expect(contractData.billing_target_items).toContain("appointment_count");
    expect(contractData.billing_target_items).toContain("deal_count");
    expect(billingData.delivery_date).toEqual(contractData.delivery_date);
    expect(billingData.billing_period_start).toEqual(
      contractData.billing_period_start
    );
    expect(billingData.billing_period_end).toEqual(contractData.billing_period_end);
  });
});