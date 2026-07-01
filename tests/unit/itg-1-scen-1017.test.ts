import { describe, test, expect } from "@jest/globals";
import {
  validateBillingHandbookConsistency,
  identifyDiscrepancies,
  updateExceptionProcessingRules,
  verifyBillingCalculationWithUpdatedRules,
  confirmHandbookReflection,
  validateNoSideEffects,
} from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1017: [normal] 請求ロジック・割引基準・例外パターンの文書化と体制確保 - 既存の手順書に矛盾が判明したときに例外処理ルールが更新される
  test("既存手順書と実システム割引ロジックの矛盾を検出し、例外処理ルールを更新・反映・検証する", () => {
    // ステップ1: 既存の請求ロジック手順書を確認し、現在の割引基準と例外処理ルールを把握
    const handbookVersion = "v2.1";
    const handbookDiscountRules = {
      baseDiscount: 0.1, // 基本割引 10%
      volumeThreshold: 5, // 5件以上
      volumeDiscountRate: 0.15, // ボリューム割引 15%
      maxDiscountRate: 0.2, // 最大割引率 20%
      specialCustomerDiscount: 0.05, // 特別顧客割引 5%
    };

    const handbookValidationResult = validateBillingHandbookConsistency({
      handbookVersion,
      discountRules: handbookDiscountRules,
    });
    expect(handbookValidationResult.isValid).toBe(true);
    expect(handbookValidationResult.handbookVersion).toBe("v2.1");

    // ステップ2: 請求処理システムで実際に適用されている割引計算ロジックを確認
    const systemAppliedDiscountLogic = {
      baseDiscount: 0.1,
      volumeThreshold: 5,
      volumeDiscountRate: 0.15,
      maxDiscountRate: 0.25, // システムは 25% を上限としている（矛盾！）
      specialCustomerDiscount: 0.05,
      cascadingApply: true, // 割引を段階適用（手順書未記載）
    };

    // ステップ3: 手順書と実際のシステムロジックを比較して矛盾箇所を特定
    const discrepancies = identifyDiscrepancies({
      handbookRules: handbookDiscountRules,
      systemRules: systemAppliedDiscountLogic,
    });

    expect(discrepancies.discrepanciesFound).toBe(true);
    expect(discrepancies.discrepancyItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "maxDiscountRate",
          handbookValue: 0.2,
          systemValue: 0.25,
        }),
        expect.objectContaining({
          field: "cascadingApply",
          handbookValue: undefined,
          systemValue: true,
        }),
      ])
    );

    // ステップ4: 矛盾が判明した場合、例外処理ルール更新の申請フローを実行
    const exceptionUpdateRequest = {
      discrepancyId: "disc_001",
      affectedField: "maxDiscountRate",
      previousValue: 0.2,
      newValue: 0.25,
      reason: "システム実装で上限 25% が確認された",
      requestedBy: "billing_admin",
      requestedAt: new Date("2024-01-15T10:00:00Z").toISOString(),
      priority: "high",
    };

    const updateResult = updateExceptionProcessingRules(exceptionUpdateRequest);
    expect(updateResult.success).toBe(true);
    expect(updateResult.updatedRuleId).toBe("rule_exc_001");
    expect(updateResult.maxDiscountRateAfterUpdate).toBe(0.25);
    expect(updateResult.cascadingApplyAfterUpdate).toBe(true);
    expect(updateResult.updateTimestamp).toBeDefined();

    // ステップ5: 更新されたルールがシステムの例外処理テーブルに反映されたことを確認
    const testBillingDataSet = {
      customerId: "cust_A",
      serviceId: "svc_premium",
      baseAmount: 1000,
      transactionVolume: 8, // 5件以上でボリューム割引対象
      isSpecialCustomer: false,
    };

    const calculationWithUpdatedRules = verifyBillingCalculationWithUpdatedRules(
      {
        ...testBillingDataSet,
        appliedRules: {
          baseDiscount: 0.1,
          volumeDiscountRate: 0.15,
          maxDiscountRate: 0.25,
          cascadingApply: true,
        },
      }
    );

    // 期待値計算:
    // baseAmount: 1000
    // baseDiscount: 1000 * 0.1 = 100
    // 残額: 1000 - 100 = 900
    // volumeDiscount (段階適用): 900 * 0.15 = 135
    // 合計割引: 100 + 135 = 235
    // 割引率: 235 / 1000 = 0.235 (最大 0.25 以下なので OK)
    // 最終金額: 1000 - 235 = 765
    expect(calculationWithUpdatedRules.finalAmount).toBe(765);
    expect(calculationWithUpdatedRules.totalDiscountAmount).toBe(235);
    expect(calculationWithUpdatedRules.appliedDiscountRate).toBe(0.235);
    expect(calculationWithUpdatedRules.maxDiscountRateLimitApplied).toBe(false);

    // ステップ6: 更新後の例外処理ルールで実際に請求計算を実行し、期待値と一致することを検証
    const additionalTestCase = {
      customerId: "cust_B",
      serviceId: "svc_standard",
      baseAmount: 2000,
      transactionVolume: 10,
      isSpecialCustomer: true,
    };

    const calculationAdditional = verifyBillingCalculationWithUpdatedRules({
      ...additionalTestCase,
      appliedRules: {
        baseDiscount: 0.1,
        volumeDiscountRate: 0.15,
        maxDiscountRate: 0.25,
        specialCustomerDiscount: 0.05,
        cascadingApply: true,
      },
    });

    // 期待値計算:
    // baseAmount: 2000
    // baseDiscount: 2000 * 0.1 = 200
    // 残額: 2000 - 200 = 1800
    // volumeDiscount (段階適用): 1800 * 0.15 = 270
    // 残額: 1800 - 270 = 1530
    // specialCustomerDiscount (段階適用): 1530 * 0.05 = 76.5
    // 合計割引: 200 + 270 + 76.5 = 546.5
    // 割引率: 546.5 / 2000 = 0.2733 (最大 0.25 を超える → 上限適用)
    // 最大割引額: 2000 * 0.25 = 500
    // 最終金額: 2000 - 500 = 1500
    expect(calculationAdditional.finalAmount).toBe(1500);
    expect(calculationAdditional.totalDiscountAmount).toBe(500);
    expect(calculationAdditional.appliedDiscountRate).toBe(0.25);
    expect(calculationAdditional.maxDiscountRateLimitApplied).toBe(true);

    // ステップ7: 更新された例外処理ルールが手順書に反映されたことを確認
    const handbookReflectionStatus = confirmHandbookReflection({
      handbookVersion: "v2.2", // 新バージョン
      discrepancyId: "disc_001",
      expectedUpdates: {
        maxDiscountRate: 0.25,
        cascadingApply: true,
      },
    });

    expect(handbookReflectionStatus.handbookUpdated).toBe(true);
    expect(handbookReflectionStatus.updatedVersion).toBe("v2.2");
    expect(handbookReflectionStatus.reflectionTimestamp).toBeDefined();
    expect(handbookReflectionStatus.updateItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "maxDiscountRate",
          oldValue: 0.2,
          newValue: 0.25,
          documentedAt: expect.any(String),
        }),
        expect.objectContaining({
          field: "cascadingApply",
          oldValue: undefined,
          newValue: true,
          documentedAt: expect.any(String),
        }),
      ])
    );

    // ステップ8: 他の関連する請求パターンに対して副作用がないことを確認
    const sideEffectValidationCases = [
      {
        name: "基本割引のみ対象",
        testCase: {
          customerId: "cust_C",
          baseAmount: 500,
          transactionVolume: 2, // ボリューム割引非対象
          isSpecialCustomer: false,
        },
        expectedAmount: 450, // 500 * (1 - 0.1) = 450
      },
      {
        name: "特別顧客割引のみ対象",
        testCase: {
          customerId: "cust_D",
          baseAmount: 800,
          transactionVolume: 2,
          isSpecialCustomer: true,
        },
        expectedAmount: 760, // 800 * (1 - 0.05) = 760
      },
      {
        name: "ボリューム割引のみ対象",
        testCase: {
          customerId: "cust_E",
          baseAmount: 1200,
          transactionVolume: 7,
          isSpecialCustomer: false,
        },
        expectedAmount: 1020, // 1200 * 0.1 = 120, 1080 * 0.15 = 162, 合計 282, 1200 - 282 = 918
      },
    ];

    const sideEffectResult = validateNoSideEffects({
      updatedRuleId: "rule_exc_001",
      testCases: sideEffectValidationCases.map((tc) => ({
        name: tc.name,
        input: {
          ...tc.testCase,
          appliedRules: {
            baseDiscount: 0.1,
            volumeDiscountRate: 0.15,
            maxDiscountRate: 0.25,
            specialCustomerDiscount: 0.05,
            cascadingApply: true,
          },
        },
      })),
    });

    expect(sideEffectResult.noSideEffectsDetected).toBe(true);
    expect(sideEffectResult.validatedCaseCount).toBe(3);
    expect(sideEffectResult.failedCases).toEqual([]);
    expect(sideEffectResult.validationCompletedAt).toBeDefined();
  });
});