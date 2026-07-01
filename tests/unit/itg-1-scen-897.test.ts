import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  identifyApplicableBillingRule,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 割引率0%の請求ルール識別", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-897: [edge] 適用請求ルール・割引基準の明確化 - 割引率がちょうど0%の場合、割引なし請求ルールが正しく識別される
  test("割引率が0%に設定された顧客について、割引なし請求ルールが正しく適用される", () => {
    const customer_id = "CUST-001";
    const service_type = "recruitment_service";
    const discount_rate_percent = 0;
    const base_billing_amount = 100000;
    const billing_period = "2024-01-01";

    const result = identifyApplicableBillingRule({
      customer_id,
      service_type,
      discount_rate_percent,
      base_billing_amount,
      billing_period,
    });

    expect(result.is_discount_applied).toBe(false);
    expect(result.discount_rate_percent).toBe(0);
    expect(result.applicable_billing_rule).toBe("no_discount");
    expect(result.final_billing_amount).toBe(100000);
    expect(result.discount_amount).toBe(0);
    expect(result.system_log_entry).toMatch(/割引率0%/);
    expect(result.system_log_entry).toMatch(/割引なし請求ルール/);
  });
});