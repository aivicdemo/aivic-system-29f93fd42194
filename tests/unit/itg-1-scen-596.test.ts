import { describe, test, expect } from "@jest/globals";
import { calculateBillingAmount } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-596
  test("割引率が100%（全額割引）の場合、請求額が0円と計算される", () => {
    const base_amount = 10000;
    const discount_rate = 100;

    const result = calculateBillingAmount({
      base_amount: base_amount,
      discount_rate: discount_rate,
    });

    expect(result.billing_amount).toBe(0);
    expect(result.status).toMatch(/無料|割引適用/);
    expect(result.tax_amount).toBe(0);
    expect(result.fee_amount).toBe(0);
    expect(result.total_amount).toBe(0);
  });
});