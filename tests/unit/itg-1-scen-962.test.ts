import { describe, test, expect } from "@jest/globals";
import { validateBillingCalculationAgainstProcedure } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-962: [normal] 請求額計算結果の手順書照合検証
  test("計算された請求額が手順書のルールに完全に合致し、乖離が検出されない", () => {
    // パターン1: 通常取引（割引なし、税率10%）
    const normalTransaction = {
      salesAmount: 100000,
      discountRate: 0,
      taxRate: 0.1,
      procedureBaseAmount: 100000,
      procedureExpectedBillingAmount: 110000,
    };

    const resultNormal = validateBillingCalculationAgainstProcedure(
      normalTransaction
    );

    expect(resultNormal.calculatedBillingAmount).toBe(110000);
    expect(resultNormal.procedureExpectedBillingAmount).toBe(110000);
    expect(resultNormal.discrepancyDetected).toBe(false);
    expect(resultNormal.validationStatus).toBe("compliant");
    expect(resultNormal.calculationSteps).toEqual([
      {
        stepName: "base_calculation",
        value: 100000,
        procedureCompliant: true,
      },
      {
        stepName: "tax_application",
        value: 110000,
        procedureCompliant: true,
      },
    ]);

    // パターン2: 割引適用（割引率10%、税率10%）
    const discountedTransaction = {
      salesAmount: 100000,
      discountRate: 0.1,
      taxRate: 0.1,
      procedureBaseAmount: 90000,
      procedureExpectedBillingAmount: 99000,
    };

    const resultDiscounted = validateBillingCalculationAgainstProcedure(
      discountedTransaction
    );

    expect(resultDiscounted.calculatedBillingAmount).toBe(99000);
    expect(resultDiscounted.procedureExpectedBillingAmount).toBe(99000);
    expect(resultDiscounted.discrepancyDetected).toBe(false);
    expect(resultDiscounted.validationStatus).toBe("compliant");
    expect(resultDiscounted.calculationSteps).toEqual([
      {
        stepName: "discount_application",
        value: 90000,
        procedureCompliant: true,
      },
      {
        stepName: "tax_application",
        value: 99000,
        procedureCompliant: true,
      },
    ]);

    // パターン3: 税率変動（税率8%）
    const differentTaxTransaction = {
      salesAmount: 100000,
      discountRate: 0,
      taxRate: 0.08,
      procedureBaseAmount: 100000,
      procedureExpectedBillingAmount: 108000,
    };

    const resultDifferentTax = validateBillingCalculationAgainstProcedure(
      differentTaxTransaction
    );

    expect(resultDifferentTax.calculatedBillingAmount).toBe(108000);
    expect(resultDifferentTax.procedureExpectedBillingAmount).toBe(108000);
    expect(resultDifferentTax.discrepancyDetected).toBe(false);
    expect(resultDifferentTax.validationStatus).toBe("compliant");
    expect(resultDifferentTax.calculationSteps).toEqual([
      {
        stepName: "base_calculation",
        value: 100000,
        procedureCompliant: true,
      },
      {
        stepName: "tax_application",
        value: 108000,
        procedureCompliant: true,
      },
    ]);

    // パターン4: 複合適用（割引15%、税率10%）
    const complexTransaction = {
      salesAmount: 200000,
      discountRate: 0.15,
      taxRate: 0.1,
      procedureBaseAmount: 170000,
      procedureExpectedBillingAmount: 187000,
    };

    const resultComplex = validateBillingCalculationAgainstProcedure(
      complexTransaction
    );

    expect(resultComplex.calculatedBillingAmount).toBe(187000);
    expect(resultComplex.procedureExpectedBillingAmount).toBe(187000);
    expect(resultComplex.discrepancyDetected).toBe(false);
    expect(resultComplex.validationStatus).toBe("compliant");
    expect(resultComplex.calculationSteps).toEqual([
      {
        stepName: "discount_application",
        value: 170000,
        procedureCompliant: true,
      },
      {
        stepName: "tax_application",
        value: 187000,
        procedureCompliant: true,
      },
    ]);

    // すべてのパターンで乖離検出アラートが発生していないことを確認
    expect(resultNormal.alertsGenerated).toBe(false);
    expect(resultDiscounted.alertsGenerated).toBe(false);
    expect(resultDifferentTax.alertsGenerated).toBe(false);
    expect(resultComplex.alertsGenerated).toBe(false);

    // 詳細ログが手順書規定に従っていることを確認
    expect(resultNormal.detailedLog).toContain("calculation compliant");
    expect(resultDiscounted.detailedLog).toContain("calculation compliant");
    expect(resultDifferentTax.detailedLog).toContain("calculation compliant");
    expect(resultComplex.detailedLog).toContain("calculation compliant");
  });
});