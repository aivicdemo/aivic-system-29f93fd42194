import { calculateDiscountedBillingAmount } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-945
  test("割引適用条件が満たされない場合、割引が適用されず基本請求額のみが計算される", () => {
    const contract_id = "contract_001";
    const base_billing_amount = 500000;
    const contract_amount = 500000;
    const contract_duration_months = 6;
    const discount_condition_min_amount = 1000000;
    const discount_condition_min_duration = 12;
    const discount_rate = 0.1;

    const result = calculateDiscountedBillingAmount({
      contract_id: contract_id,
      base_billing_amount: base_billing_amount,
      contract_amount: contract_amount,
      contract_duration_months: contract_duration_months,
      discount_condition_min_amount: discount_condition_min_amount,
      discount_condition_min_duration: discount_condition_min_duration,
      discount_rate: discount_rate,
    });

    expect(result.contract_id).toBe(contract_id);
    expect(result.base_billing_amount).toBe(base_billing_amount);
    expect(result.discount_amount).toBe(0);
    expect(result.discount_rate_applied).toBe(0);
    expect(result.final_billing_amount).toBe(base_billing_amount);
    expect(result.discount_applied).toBe(false);
  });
});