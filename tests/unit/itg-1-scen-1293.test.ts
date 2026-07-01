import { describe, test, expect } from "@jest/globals";
import { calculateBillingAmountByCustomerService } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-1293
  test("顧客ごと・サービスごとの請求額計算機能 - 請求額が負数となる異常なパターンが検出され、計算が中断される", () => {
    const input = {
      customerId: "TEST-CUST-001",
      serviceId: "SVC-A",
      baseFeeAmount: 10000,
      adjustmentAmount: -15000,
    };

    expect(() => calculateBillingAmountByCustomerService(input)).toThrow(
      /負数/
    );
  });

  test("顧客ごと・サービスごとの請求額計算機能 - 正常な請求額計算が行われる", () => {
    const input = {
      customerId: "TEST-CUST-001",
      serviceId: "SVC-A",
      baseFeeAmount: 10000,
      adjustmentAmount: 2000,
    };

    const result = calculateBillingAmountByCustomerService(input);

    expect(result).toEqual({
      customerId: "TEST-CUST-001",
      serviceId: "SVC-A",
      billingAmount: 12000,
    });
  });

  test("顧客ごと・サービスごとの請求額計算機能 - 調整額がゼロの場合は基本料金がそのまま適用される", () => {
    const input = {
      customerId: "TEST-CUST-002",
      serviceId: "SVC-B",
      baseFeeAmount: 20000,
      adjustmentAmount: 0,
    };

    const result = calculateBillingAmountByCustomerService(input);

    expect(result).toEqual({
      customerId: "TEST-CUST-002",
      serviceId: "SVC-B",
      billingAmount: 20000,
    });
  });

  test("顧客ごと・サービスごとの請求額計算機能 - 基本料金と調整額が両方負数の場合、エラーが発生する", () => {
    const input = {
      customerId: "TEST-CUST-003",
      serviceId: "SVC-C",
      baseFeeAmount: -5000,
      adjustmentAmount: -3000,
    };

    expect(() => calculateBillingAmountByCustomerService(input)).toThrow(
      /負数/
    );
  });

  test("顧客ごと・サービスごとの請求額計算機能 - 調整額が基本料金を上回る場合、エラーが発生する", () => {
    const input = {
      customerId: "TEST-CUST-004",
      serviceId: "SVC-D",
      baseFeeAmount: 5000,
      adjustmentAmount: -10000,
    };

    expect(() => calculateBillingAmountByCustomerService(input)).toThrow(
      /負数/
    );
  });
});