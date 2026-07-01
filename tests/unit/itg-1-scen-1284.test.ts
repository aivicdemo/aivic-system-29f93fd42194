import { calculateBillingAmountWithDiscountValidation } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-1284
  test("[normal] 契約内容・割引基準との照合機能 - 抽出された請求情報が契約内容と完全に一致し、適用対象外の割引が正確に判定される", () => {
    // 契約マスタデータの準備
    const contractData = {
      contractId: "CTR-2024-001",
      customerId: "CUST-A",
      serviceType: "premium",
      baseAmount: 50000,
      contractStartDate: new Date("2024-01-01T00:00:00Z"),
      contractEndDate: new Date("2024-12-31T23:59:59Z"),
      applicableDiscountTypes: ["early_payment_discount"],
      discountExclusionRules: [
        {
          ruleId: "DISC-EX-001",
          discountType: "seasonal_campaign",
          exclusionReason: "customer_segment_mismatch",
          targetCustomerSegments: ["startup"],
        },
        {
          ruleId: "DISC-EX-002",
          discountType: "volume_discount",
          exclusionReason: "service_type_mismatch",
          targetServiceTypes: ["basic"],
        },
        {
          ruleId: "DISC-EX-003",
          discountType: "loyalty_discount",
          exclusionReason: "contract_period_outside_promotion",
          promotionStartDate: new Date("2025-01-01T00:00:00Z"),
          promotionEndDate: new Date("2025-12-31T23:59:59Z"),
        },
      ],
    };

    // 請求情報抽出（営業データから抽出された請求対象項目）
    const extractedBillingInfo = {
      contractId: "CTR-2024-001",
      customerId: "CUST-A",
      serviceType: "premium",
      billingAmount: 50000,
      billingPeriodStart: new Date("2024-01-01T00:00:00Z"),
      billingPeriodEnd: new Date("2024-12-31T23:59:59Z"),
      requestedDiscounts: [
        { discountType: "early_payment_discount", discountRate: 0.05 },
        { discountType: "seasonal_campaign", discountRate: 0.1 },
        { discountType: "volume_discount", discountRate: 0.08 },
        { discountType: "loyalty_discount", discountRate: 0.03 },
      ],
    };

    // 割引基準マスタの準備
    const discountRules = {
      early_payment_discount: {
        baseDiscountRate: 0.05,
        applicable: true,
        applicableCustomerSegments: ["all"],
        applicableServiceTypes: ["all"],
      },
      seasonal_campaign: {
        baseDiscountRate: 0.1,
        applicable: true,
        applicableCustomerSegments: ["enterprise", "mid_market"],
        applicableServiceTypes: ["all"],
      },
      volume_discount: {
        baseDiscountRate: 0.08,
        applicable: true,
        applicableCustomerSegments: ["all"],
        applicableServiceTypes: ["premium", "standard"],
      },
      loyalty_discount: {
        baseDiscountRate: 0.03,
        applicable: true,
        applicableCustomerSegments: ["all"],
        applicableServiceTypes: ["all"],
        promotionStartDate: new Date("2025-01-01T00:00:00Z"),
        promotionEndDate: new Date("2025-12-31T23:59:59Z"),
      },
    };

    // 割引基準照合機能を実行
    const result = calculateBillingAmountWithDiscountValidation(
      extractedBillingInfo,
      contractData,
      discountRules
    );

    // 1. 抽出された請求情報がすべての契約内容項目と完全に一致することを検証
    expect(result.contractValidation.contractIdMatch).toBe(true);
    expect(result.contractValidation.billingAmountMatch).toBe(true);
    expect(result.contractValidation.billingPeriodMatch).toBe(true);

    // 2. 適用対象外の割引がすべて正確に判定・除外されることを検証
    // 期待される結果：
    // - early_payment_discount: 適用可能（顧客・サービス・期間すべて合致）
    // - seasonal_campaign: 不適用（顧客区分がstartupではなくenterpriseが必要だが、CUST-Aは指定されていない）
    // - volume_discount: 不適用（サービス種別がbasicに限定されているが、extractedはpremium）
    // - loyalty_discount: 不適用（プロモーション期間が2025年のため、現在の契約期間2024年外）

    // 適用対象外の割引の判定結果を確認
    expect(result.discountValidationResults).toHaveLength(4);

    const seasonalCampaignResult = result.discountValidationResults.find(
      (d) => d.discountType === "seasonal_campaign"
    );
    expect(seasonalCampaignResult?.isApplicable).toBe(false);
    expect(seasonalCampaignResult?.exclusionReason).toBe(
      "customer_segment_mismatch"
    );

    const volumeDiscountResult = result.discountValidationResults.find(
      (d) => d.discountType === "volume_discount"
    );
    expect(volumeDiscountResult?.isApplicable).toBe(false);
    expect(volumeDiscountResult?.exclusionReason).toBe("service_type_mismatch");

    const loyaltyDiscountResult = result.discountValidationResults.find(
      (d) => d.discountType === "loyalty_discount"
    );
    expect(loyaltyDiscountResult?.isApplicable).toBe(false);
    expect(loyaltyDiscountResult?.exclusionReason).toBe(
      "contract_period_outside_promotion"
    );

    const earlyPaymentResult = result.discountValidationResults.find(
      (d) => d.discountType === "early_payment_discount"
    );
    expect(earlyPaymentResult?.isApplicable).toBe(true);
    expect(earlyPaymentResult?.appliedDiscountRate).toBe(0.05);

    // 3. 適用対象外の割引が請求金額計算に反映されていないことを検証
    // 基本金額 50000 × 適用割引（early_payment_discount 5%）= 50000 × 0.95 = 47500
    const expectedFinalAmount = 50000 * (1 - 0.05);
    expect(result.finalBillingAmount).toBe(expectedFinalAmount);
    expect(result.finalBillingAmount).toBe(47500);

    // 4. 複数の割引ルールが混在する場合、各々が正確に判定されることを確認
    expect(result.discountValidationResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          discountType: "early_payment_discount",
          isApplicable: true,
        }),
        expect.objectContaining({
          discountType: "seasonal_campaign",
          isApplicable: false,
        }),
        expect.objectContaining({
          discountType: "volume_discount",
          isApplicable: false,
        }),
        expect.objectContaining({
          discountType: "loyalty_discount",
          isApplicable: false,
        }),
      ])
    );

    // 5. 統計情報の検証
    expect(result.discountValidationResults.filter((d) => d.isApplicable)).toHaveLength(1);
    expect(result.discountValidationResults.filter((d) => !d.isApplicable)).toHaveLength(3);
    expect(result.totalDiscountAmount).toBe(2500); // 50000 × 0.05
    expect(result.appliedDiscountRate).toBe(0.05);
  });
});