import { validateBillingData } from "../../src/logic/it-1781935279444-2-2-1";

describe("請求データ妥当性自動検証", () => {
  // SCEN-810: [edge] 請求データ妥当性自動検証機能 - 請求額が契約金額と完全に一致する境界値の場合に検証を通過する
  test("請求額が契約金額と完全に一致する場合は検証を通過する", () => {
    const contract_amount = 100000;
    const billing_amount = 100000;

    const input = {
      contract_id: "C001",
      contract_amount: contract_amount,
      billing_amount: billing_amount,
      billing_date: "2024-01-15",
      customer_id: "CUST001",
    };

    const result = validateBillingData(input);

    expect(result.is_valid).toBe(true);
    expect(result.error_message).toBe("");
    expect(result.billing_amount).toBe(100000);
  });
});