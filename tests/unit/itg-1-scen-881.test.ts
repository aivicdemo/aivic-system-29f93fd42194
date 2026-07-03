import { calculateBillingAmount } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-881: [normal] 請求ルール適用ロジック機能 - 顧客・サービスに紐付く請求ルールが正しく適用される
  test("請求ルール適用ロジック機能を実行し、顧客・サービスの組み合わせで請求データを生成し、複数ルールの優先度順序と計算結果が正確であること", () => {
    // テスト用顧客データ
    const customerData = {
      customerId: "CUST001",
      customerName: "営業テスト顧客",
      contractServices: ["SERVICE_A", "SERVICE_B"],
    };

    // 顧客マスタの請求ルール（顧客ID に紐付く）
    const customerBillingRules = {
      CUST001: {
        billingCycle: "monthly",
        baseBillingAmount: 50000,
        taxRate: 0.1,
        discountConditions: [
          { type: "fixed", amount: 5000, priority: 1 },
          { type: "percentage", rate: 0.05, priority: 2 },
        ],
      },
    };

    // サービスマスタの請求ルール（サービスID に紐付く）
    const serviceBillingRules = {
      SERVICE_A: {
        baseFee: 30000,
        usageChargeRule: { unitPrice: 100, unitName: "count" },
        optionFees: [{ optionName: "premium", fee: 5000 }],
      },
      SERVICE_B: {
        baseFee: 20000,
        usageChargeRule: { unitPrice: 50, unitName: "count" },
        optionFees: [],
      },
    };

    // 営業成果データ（アポ数、成約数など）
    const salesPerformanceData = {
      customerId: "CUST001",
      serviceId: "SERVICE_A",
      appointmentCount: 10,
      contractCount: 5,
      customerFeedback: "positive",
      usageCount: 100,
      appliedOptions: ["premium"],
    };

    // 期待計算値
    // SERVICE_A: baseFee 30000 + usageCharge (100 * 100) 10000 + optionFee 5000 = 45000
    // SERVICE_B (for reference only in this flow): baseFee 20000
    // 顧客統合: 45000 + customerBase 50000 = 95000
    // 割引優先度: 固定割引 5000 を優先適用
    // 割引後: 95000 - 5000 = 90000
    // 税金計算: 90000 * 0.1 = 9000
    // 最終請求額: 90000 + 9000 = 99000

    const result = calculateBillingAmount({
      customerData,
      customerBillingRules,
      serviceBillingRules,
      salesPerformanceData,
    });

    // 生成された請求データが顧客マスタの請求ルールを反映していることを確認
    expect(result.billingCycle).toBe("monthly");
    expect(result.baseBillingAmount).toBe(50000);
    expect(result.taxRate).toBe(0.1);

    // 生成された請求データがサービスマスタの請求ルールを反映していることを確認
    expect(result.serviceFee).toBe(45000); // 30000 + 10000 + 5000

    // 複数の請求ルールが競合する場合の優先度順序が正しく適用されていることを確認
    expect(result.appliedDiscount).toBe(5000); // 固定割引が優先適用（priority: 1）
    expect(result.discountType).toBe("fixed");

    // 請求ルール適用後の計算結果（合計金額、税金、割引額）が正確であることを検証
    expect(result.subtotalBeforeTax).toBe(90000); // (50000 + 45000) - 5000
    expect(result.taxAmount).toBe(9000); // 90000 * 0.1
    expect(result.finalBillingAmount).toBe(99000); // 90000 + 9000

    // 請求対象項目が正しく抽出されていることを確認
    expect(result.billingItems).toEqual([
      {
        itemName: "基本料金",
        amount: 50000,
        category: "base",
      },
      {
        itemName: "SERVICE_A 基本料金",
        amount: 30000,
        category: "service_base",
      },
      {
        itemName: "SERVICE_A 従量課金",
        amount: 10000,
        category: "usage",
      },
      {
        itemName: "SERVICE_A premium オプション",
        amount: 5000,
        category: "option",
      },
    ]);

    // エッジケース確認：複数割引ルールが存在する場合、優先度の低い割引（percentage）は適用されないこと
    expect(result.appliedDiscountRules).toEqual([
      { type: "fixed", amount: 5000, priority: 1 },
    ]);

    // 顧客とサービスの組み合わせが請求データに正しく紐付いていることを確認
    expect(result.customerId).toBe("CUST001");
    expect(result.serviceId).toBe("SERVICE_A");
    expect(result.contractId).toBeDefined();
  });
});