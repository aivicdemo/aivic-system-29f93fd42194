import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateContractChangeIntegrity,
  ContractChangeInput,
  ContractChangeResult,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("Contract Change Integrity Validation", () => {
  // SCEN-852: [normal] 契約変更前後の整合性検証機能 - 契約変更前後の条件差分と請求額が整合的に判定される
  test("should validate contract change integrity with condition delta and billing amount consistency", () => {
    // 前提条件: 契約変更前の契約条件を設定
    const beforeContractCondition = {
      customerId: "CUST-001",
      serviceType: "premium",
      pricingPlan: "monthly_base",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      monthlyBaseAmount: 100000,
      discountRate: 0.0,
    };

    // 契約変更前の条件に基づいて請求額を計算し、初期請求額として保存
    const beforeBillingAmount = 100000;

    // 契約変更後の条件を入力
    const afterContractCondition = {
      customerId: "CUST-001",
      serviceType: "premium",
      pricingPlan: "monthly_plus",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      monthlyBaseAmount: 150000,
      discountRate: 0.1,
    };

    // 契約変更後の新しい請求額を計算
    const afterBillingAmount = 150000 * (1 - 0.1); // = 135000

    // 契約変更機能を実行し、差分を抽出
    const input: ContractChangeInput = {
      customerId: "CUST-001",
      beforeCondition: beforeContractCondition,
      afterCondition: afterContractCondition,
      changeEffectiveDate: "2024-06-01",
      beforeBillingAmount,
      afterBillingAmount,
    };

    const result: ContractChangeResult =
      validateContractChangeIntegrity(input);

    // 期待結果: 条件差分が正確に抽出される
    expect(result.conditionDelta).toBeDefined();
    expect(result.conditionDelta.pricingPlanChange).toBe(true);
    expect(result.conditionDelta.monthlyBaseAmountChange).toBe(50000); // 150000 - 100000
    expect(result.conditionDelta.discountRateChange).toBe(0.1); // 0.1 - 0.0

    // 期待結果: 請求額の増減が正確に計算される
    expect(result.billingAmountDelta).toBe(35000); // 135000 - 100000

    // 期待結果: 条件差分と請求額差分が整合しているか検証
    // 料金プラン変更（50000）と割引適用（-15000）= 35000
    const expectedDelta = 50000 * (1 - 0.1) - 100000 * 0.0; // = 45000
    expect(result.isConsistent).toBe(true);
    expect(result.consistencyCheck).toEqual({
      conditionDeltaImpact: 45000,
      actualBillingDelta: 35000,
      tolerance: 0,
      isWithinTolerance: false,
    });

    // 期待結果: 日割り計算が必要な場合の按分計算
    // 変更有効日: 2024-06-01 (日中途変更)
    // 2024-06: 1日目～31日目のうち、1日目～31日目（全月）
    // この例では全月なので按分なし
    expect(result.prorationCalculation).toBeDefined();
    expect(result.prorationCalculation.isProrationApplied).toBe(false);

    // 期待結果: 契約変更前後の整合性検証結果
    expect(result.integrityStatus).toBe("CONSISTENT");
    expect(result.systemLog).toBeDefined();
    expect(result.systemLog.validationTimestamp).toBeDefined();
    expect(result.systemLog.customerId).toBe("CUST-001");
  });

  test("should validate contract change with proration when change occurs mid-month", () => {
    // 前提条件: 月中途での契約変更
    const beforeCondition = {
      customerId: "CUST-002",
      serviceType: "standard",
      pricingPlan: "monthly_base",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      monthlyBaseAmount: 100000,
      discountRate: 0.0,
    };

    const beforeBillingAmount = 100000;

    const afterCondition = {
      customerId: "CUST-002",
      serviceType: "standard",
      pricingPlan: "monthly_plus",
      startDate: "2024-06-15",
      endDate: "2024-12-31",
      monthlyBaseAmount: 150000,
      discountRate: 0.05,
    };

    // 2024年6月: 15日から30日（16日間、30日中）
    // 日割り: (150000 * (1 - 0.05)) * (16 / 30) = 142500 * 0.533 = 75933
    // 2024年7月以降: 150000 * (1 - 0.05) = 142500
    // 年間請求額（簡易計算）: 75933 + (142500 * 6) = 75933 + 855000 = 930933
    const afterBillingAmount = 930933;

    const input: ContractChangeInput = {
      customerId: "CUST-002",
      beforeCondition,
      afterCondition,
      changeEffectiveDate: "2024-06-15",
      beforeBillingAmount: 1200000, // 100000 * 12
      afterBillingAmount,
    };

    const result: ContractChangeResult =
      validateContractChangeIntegrity(input);

    // 期待結果: 日割り計算が正確に反映される
    expect(result.prorationCalculation.isProrationApplied).toBe(true);
    expect(result.prorationCalculation.changeEffectiveDate).toBe("2024-06-15");
    expect(result.prorationCalculation.daysInPartialMonth).toBe(16);
    expect(result.prorationCalculation.totalDaysInMonth).toBe(30);
    expect(
      result.prorationCalculation.prorationRatio
    ).toBeCloseTo(0.5333, 4);

    // 期待結果: 整合性が検証される
    expect(result.isConsistent).toBe(true);
    expect(result.integrityStatus).toBe("CONSISTENT");
  });

  test("should detect inconsistency when billing delta does not match condition delta", () => {
    // 前提条件: 条件差分と請求額差分が不整合なケース
    const beforeCondition = {
      customerId: "CUST-003",
      serviceType: "premium",
      pricingPlan: "monthly_base",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      monthlyBaseAmount: 100000,
      discountRate: 0.0,
    };

    const afterCondition = {
      customerId: "CUST-003",
      serviceType: "premium",
      pricingPlan: "monthly_plus",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      monthlyBaseAmount: 150000,
      discountRate: 0.1,
    };

    // 正しい計算: (150000 * (1 - 0.1)) * 12 = 1620000
    // しかし、誤った請求額が入力された場合
    const input: ContractChangeInput = {
      customerId: "CUST-003",
      beforeCondition,
      afterCondition,
      changeEffectiveDate: "2024-01-01",
      beforeBillingAmount: 1200000,
      afterBillingAmount: 1500000, // 誤った値
    };

    const result: ContractChangeResult =
      validateContractChangeIntegrity(input);

    // 期待結果: 不整合が検出される
    expect(result.isConsistent).toBe(false);
    expect(result.integrityStatus).toBe("INCONSISTENT");
    expect(result.systemLog.inconsistencyReason).toBeDefined();
  });

  test("should validate consistency when discount rate is modified", () => {
    // 前提条件: 割引率変更のみの契約変更
    const beforeCondition = {
      customerId: "CUST-004",
      serviceType: "standard",
      pricingPlan: "monthly_base",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      monthlyBaseAmount: 200000,
      discountRate: 0.0,
    };

    const afterCondition = {
      customerId: "CUST-004",
      serviceType: "standard",
      pricingPlan: "monthly_base",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      monthlyBaseAmount: 200000,
      discountRate: 0.15,
    };

    // 請求額計算
    // 変更前: 200000 * 12 = 2400000
    // 変更後: 200000 * (1 - 0.15) * 12 = 2040000
    // 差分: 2040000 - 2400000 = -360000
    const input: ContractChangeInput = {
      customerId: "CUST-004",
      beforeCondition,
      afterCondition,
      changeEffectiveDate: "2024-01-01",
      beforeBillingAmount: 2400000,
      afterBillingAmount: 2040000,
    };

    const result: ContractChangeResult =
      validateContractChangeIntegrity(input);

    // 期待結果: 割引率変更に対応する請求額の変更が整合している
    expect(result.conditionDelta.discountRateChange).toBe(0.15);
    expect(result.billingAmountDelta).toBe(-360000);
    expect(result.isConsistent).toBe(true);
    expect(result.integrityStatus).toBe("CONSISTENT");
  });

  test("should throw error when customer ID is missing from input", () => {
    const beforeCondition = {
      customerId: "CUST-005",
      serviceType: "premium",
      pricingPlan: "monthly_base",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      monthlyBaseAmount: 100000,
      discountRate: 0.0,
    };

    const afterCondition = {
      customerId: "CUST-005",
      serviceType: "premium",
      pricingPlan: "monthly_plus",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      monthlyBaseAmount: 150000,
      discountRate: 0.1,
    };

    const input: ContractChangeInput = {
      customerId: "", // 顧客IDが空
      beforeCondition,
      afterCondition,
      changeEffectiveDate: "2024-01-01",
      beforeBillingAmount: 1200000,
      afterBillingAmount: 1350000,
    };

    expect(() => validateContractChangeIntegrity(input)).toThrow(/顧客ID/);
  });

  test("should throw error when billing amounts are negative", () => {
    const beforeCondition = {
      customerId: "CUST-006",
      serviceType: "premium",
      pricingPlan: "monthly_base",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      monthlyBaseAmount: 100000,
      discountRate: 0.0,
    };

    const afterCondition = {
      customerId: "CUST-006",
      serviceType: "premium",
      pricingPlan: "monthly_plus",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      monthlyBaseAmount: 150000,
      discountRate: 0.1,
    };

    const input: ContractChangeInput = {
      customerId: "CUST-006",
      beforeCondition,
      afterCondition,
      changeEffectiveDate: "2024-01-01",
      beforeBillingAmount: -100, // 負の値
      afterBillingAmount: 1350000,
    };

    expect(() => validateContractChangeIntegrity(input)).toThrow(/請求額/);
  });

  test("should throw error when discount rate is out of valid range", () => {
    const beforeCondition = {
      customerId: "CUST-007",
      serviceType: "premium",
      pricingPlan: "monthly_base",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      monthlyBaseAmount: 100000,
      discountRate: 0.0,
    };

    const afterCondition = {
      customerId: "CUST-007",
      serviceType: "premium",
      pricingPlan: "monthly_plus",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      monthlyBaseAmount: 150000,
      discountRate: 1.5, // 150% は無効
    };

    const input: ContractChangeInput = {
      customerId: "CUST-007",
      beforeCondition,
      afterCondition,
      changeEffectiveDate: "2024-01-01",
      beforeBillingAmount: 1200000,
      afterBillingAmount: 1350000,
    };

    expect(() => validateContractChangeIntegrity(input)).toThrow(/割引率/);
  });
});