import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  calculateDiscountedBillingAmount,
  validateContractDiscountRate,
} from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-943: [edge] 契約別割引基準の確認機能 - 割引率が0%の場合、割引なしとして正確に識別される
  test("should identify zero discount rate as no discount and calculate billing without reduction", () => {
    // Arrange: テスト用の契約データを作成
    const contractId = "CONTRACT_001";
    const baseBillingAmount = 100000;
    const discountRate = 0;
    const serviceName = "standard_service";

    // Act 1: 割引基準の検証ロジックを実行
    const discountValidation = validateContractDiscountRate({
      contract_id: contractId,
      discount_rate: discountRate,
      service_name: serviceName,
    });

    // Assert 1: 割引率0%が有効であること、割引なし区分として識別されること
    expect(discountValidation.is_valid).toBe(true);
    expect(discountValidation.discount_classification).toBe("no_discount");
    expect(discountValidation.discount_rate_percentage).toBe(0);

    // Act 2: 割引率0%が適用された請求額計算を実行
    const billingResult = calculateDiscountedBillingAmount({
      contract_id: contractId,
      base_amount: baseBillingAmount,
      discount_rate: discountRate,
      service_name: serviceName,
    });

    // Assert 2: 割引が適用されず、元の金額のままで請求されること
    expect(billingResult.discount_applied_flag).toBe(false);
    expect(billingResult.discount_amount).toBe(0);
    expect(billingResult.final_billing_amount).toBe(100000);
    expect(billingResult.discount_classification).toBe("no_discount");

    // Assert 3: 割引計算結果が数学的に正確であること
    // 期待値: 割引額 = 100000 * 0 / 100 = 0
    expect(billingResult.calculation_formula).toBe(
      "100000 * 0 / 100 = 0"
    );
    expect(billingResult.final_billing_amount).toBe(
      baseBillingAmount - billingResult.discount_amount
    );

    // Assert 4: 割引基準確認画面表示用の情報が正確に構成されていること
    expect(billingResult.display_discount_label).toBe("割引なし");
    expect(billingResult.display_discount_rate_text).toBe("0%割引");
  });
});