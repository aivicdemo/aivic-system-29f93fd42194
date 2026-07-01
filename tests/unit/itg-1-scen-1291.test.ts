import { describe, test, expect } from "@jest/globals";
import { calculateBillingAmountWithMultipleDiscounts } from "../../src/logic/it-1-2-1";

describe("顧客ごと・サービスごとの請求額計算機能", () => {
  test("SCEN-1291: 複数割引の累積により請求額が上限を超える場合に、上限額が確定額として選択される", () => {
    // テストデータ: 複数割引が適用される顧客・サービス
    const customerId = "CUST001";
    const serviceId = "SVC001";
    const baseBillingAmount = 100000; // 基本請求額: 100,000円
    const billingCeilingAmount = 70000; // 請求額上限: 70,000円

    // 割引情報
    const discounts = [
      {
        discount_id: "DISC001",
        discount_rate: 0.1, // 第1割引: 10%
        discount_type: "percentage" as const,
      },
      {
        discount_id: "DISC002",
        discount_rate: 0.15, // 第2割引: 15%
        discount_type: "percentage" as const,
      },
      {
        discount_id: "DISC003",
        discount_rate: 0.2, // 第3割引: 20%
        discount_type: "percentage" as const,
      },
    ];

    // 関数実行
    const result = calculateBillingAmountWithMultipleDiscounts({
      customer_id: customerId,
      service_id: serviceId,
      base_billing_amount: baseBillingAmount,
      discounts,
      billing_ceiling_amount: billingCeilingAmount,
    });

    // 期待値計算:
    // 基本請求額: 100,000円
    // 第1割引適用: 100,000 × (1 - 0.1) = 90,000円
    // 第2割引適用: 90,000 × (1 - 0.15) = 76,500円
    // 第3割引適用: 76,500 × (1 - 0.2) = 61,200円
    // 上限値チェック: 61,200円 < 70,000円（上限）→ 61,200円が確定額
    const expectedFinalAmount = 61200;

    // アサーション: 複数割引が正しく累積適用されたか
    expect(result.calculated_amount).toBe(expectedFinalAmount);

    // アサーション: 確定額が上限値以下であるか
    expect(result.final_confirmed_amount).toBe(expectedFinalAmount);
    expect(result.final_confirmed_amount).toBeLessThanOrEqual(
      billingCeilingAmount
    );

    // アサーション: 上限値適用フラグの確認
    expect(result.ceiling_applied).toBe(false);

    // アサーション: 割引内訳の検証
    expect(result.discount_breakdown).toEqual([
      {
        discount_id: "DISC001",
        applied_rate: 0.1,
        amount_after_discount: 90000,
      },
      {
        discount_id: "DISC002",
        applied_rate: 0.15,
        amount_after_discount: 76500,
      },
      {
        discount_id: "DISC003",
        applied_rate: 0.2,
        amount_after_discount: 61200,
      },
    ]);

    // アサーション: 顧客・サービス ID が正しく記録されているか
    expect(result.customer_id).toBe(customerId);
    expect(result.service_id).toBe(serviceId);
  });

  test("SCEN-1291-boundary: 複数割引の累積で上限値を超える場合、上限額が確定額として選択される", () => {
    // テストデータ: より大きな割引で上限を超えるシナリオ
    const customerId = "CUST002";
    const serviceId = "SVC002";
    const baseBillingAmount = 100000; // 基本請求額: 100,000円
    const billingCeilingAmount = 50000; // 請求額上限: 50,000円（より低い上限）

    const discounts = [
      {
        discount_id: "DISC001",
        discount_rate: 0.1,
        discount_type: "percentage" as const,
      },
      {
        discount_id: "DISC002",
        discount_rate: 0.15,
        discount_type: "percentage" as const,
      },
      {
        discount_id: "DISC003",
        discount_rate: 0.2,
        discount_type: "percentage" as const,
      },
    ];

    const result = calculateBillingAmountWithMultipleDiscounts({
      customer_id: customerId,
      service_id: serviceId,
      base_billing_amount: baseBillingAmount,
      discounts,
      billing_ceiling_amount: billingCeilingAmount,
    });

    // 期待値: 複数割引後は 61,200円だが、上限が 50,000円のため上限値が確定額
    const expectedCalculatedAmount = 61200;
    const expectedFinalAmount = 50000; // 上限値が適用される

    // アサーション: 計算結果は61,200円
    expect(result.calculated_amount).toBe(expectedCalculatedAmount);

    // アサーション: 確定額は上限値50,000円
    expect(result.final_confirmed_amount).toBe(expectedFinalAmount);
    expect(result.final_confirmed_amount).toBeLessThanOrEqual(
      billingCeilingAmount
    );

    // アサーション: 上限値適用フラグが true であるか
    expect(result.ceiling_applied).toBe(true);

    // アサーション: 上限超過額が正しく計算されているか
    expect(result.excess_amount_over_ceiling).toBe(
      expectedCalculatedAmount - expectedFinalAmount
    );
  });

  test("SCEN-1291-error: 無効な割引率が指定された場合、エラーが発生する", () => {
    const customerId = "CUST003";
    const serviceId = "SVC003";
    const baseBillingAmount = 100000;
    const billingCeilingAmount = 70000;

    // 無効な割引率（負数）
    const invalidDiscounts = [
      {
        discount_id: "DISC001",
        discount_rate: -0.1, // 負数は無効
        discount_type: "percentage" as const,
      },
    ];

    expect(() =>
      calculateBillingAmountWithMultipleDiscounts({
        customer_id: customerId,
        service_id: serviceId,
        base_billing_amount: baseBillingAmount,
        discounts: invalidDiscounts,
        billing_ceiling_amount: billingCeilingAmount,
      })
    ).toThrow(/割引率/);
  });

  test("SCEN-1291-error: 基本請求額が負数の場合、エラーが発生する", () => {
    const customerId = "CUST004";
    const serviceId = "SVC004";
    const baseBillingAmount = -100000; // 負数は無効
    const billingCeilingAmount = 70000;

    const discounts = [
      {
        discount_id: "DISC001",
        discount_rate: 0.1,
        discount_type: "percentage" as const,
      },
    ];

    expect(() =>
      calculateBillingAmountWithMultipleDiscounts({
        customer_id: customerId,
        service_id: serviceId,
        base_billing_amount: baseBillingAmount,
        discounts,
        billing_ceiling_amount: billingCeilingAmount,
      })
    ).toThrow(/基本請求額/);
  });

  test("SCEN-1291-error: 上限値が基本請求額より大きい場合、警告なく処理される（上限を超過しないため）", () => {
    const customerId = "CUST005";
    const serviceId = "SVC005";
    const baseBillingAmount = 100000;
    const billingCeilingAmount = 150000; // 上限が基本請求額より大きい

    const discounts = [
      {
        discount_id: "DISC001",
        discount_rate: 0.1,
        discount_type: "percentage" as const,
      },
    ];

    const result = calculateBillingAmountWithMultipleDiscounts({
      customer_id: customerId,
      service_id: serviceId,
      base_billing_amount: baseBillingAmount,
      discounts,
      billing_ceiling_amount: billingCeilingAmount,
    });

    // 期待値: 100,000 × (1 - 0.1) = 90,000円（上限を超えないため上限値は適用されない）
    expect(result.calculated_amount).toBe(90000);
    expect(result.final_confirmed_amount).toBe(90000);
    expect(result.ceiling_applied).toBe(false);
  });
});