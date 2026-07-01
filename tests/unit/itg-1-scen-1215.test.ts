import {
  classifyInvoiceDiscrepancy
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  test("SCEN-1215: データ不一致自動判定機能 - 問い合わせ内容と営業データの不一致が『データ入力誤り』『計算ロジック誤り』『契約条件の誤解釈』のいずれかに正確に分類される", () => {
    // パターン1：データ入力誤り
    // テストデータ：顧客名の表記ゆれ、住所の入力漏れ
    const dataInputErrorResult = classifyInvoiceDiscrepancy({
      discrepancyType: "data_entry",
      reportedValue: "株式会社タナカ商事",
      sourceDataValue: "タナカ商事",
      inquiryCategory: "customer_name_mismatch",
      contractTerms: {
        baseAmount: 100000,
        discountRate: 0,
        taxRate: 0.1
      },
      invoiceCalculation: {
        baseAmount: 100000,
        discountAmount: 0,
        taxAmount: 10000,
        totalAmount: 110000
      },
      sourceDataCalculation: {
        baseAmount: 100000,
        discountAmount: 0,
        taxAmount: 10000,
        totalAmount: 110000
      }
    });

    expect(dataInputErrorResult.classification).toBe("データ入力誤り");
    expect(dataInputErrorResult.severity).toBe("medium");
    expect(dataInputErrorResult.rootCause).toContain("表記揺れ");
    expect(dataInputErrorResult.detectionLog).toBeDefined();
    expect(typeof dataInputErrorResult.detectionLog).toBe("string");

    // パターン2：計算ロジック誤り
    // テストデータ：税金計算の誤り、割引額の計算違い
    const calculationLogicErrorResult = classifyInvoiceDiscrepancy({
      discrepancyType: "calculation_logic",
      reportedValue: "110000",
      sourceDataValue: "105000",
      inquiryCategory: "tax_calculation_mismatch",
      contractTerms: {
        baseAmount: 100000,
        discountRate: 0.05,
        taxRate: 0.1
      },
      invoiceCalculation: {
        baseAmount: 100000,
        discountAmount: 5000,
        taxAmount: 10500,
        totalAmount: 105500
      },
      sourceDataCalculation: {
        baseAmount: 100000,
        discountAmount: 5000,
        taxAmount: 10000,
        totalAmount: 105000
      }
    });

    expect(calculationLogicErrorResult.classification).toBe("計算ロジック誤り");
    expect(calculationLogicErrorResult.severity).toBe("high");
    expect(calculationLogicErrorResult.rootCause).toContain("税金計算");
    expect(calculationLogicErrorResult.discrepancyAmount).toBe(500);
    expect(calculationLogicErrorResult.detectionLog).toBeDefined();
    expect(typeof calculationLogicErrorResult.detectionLog).toBe("string");

    // パターン3：契約条件の誤解釈
    // テストデータ：契約内容と請求内容の不整合、特別条項の適用ミス
    const contractMisinterpretationResult = classifyInvoiceDiscrepancy({
      discrepancyType: "contract_misinterpretation",
      reportedValue: "120000",
      sourceDataValue: "100000",
      inquiryCategory: "special_clause_application",
      contractTerms: {
        baseAmount: 100000,
        discountRate: 0,
        taxRate: 0.1,
        specialClauseApplied: false,
        specialClauseDiscountRate: 0.1
      },
      invoiceCalculation: {
        baseAmount: 100000,
        discountAmount: 0,
        taxAmount: 12000,
        totalAmount: 112000,
        specialClauseApplied: true
      },
      sourceDataCalculation: {
        baseAmount: 100000,
        discountAmount: 0,
        taxAmount: 10000,
        totalAmount: 110000,
        specialClauseApplied: false
      }
    });

    expect(contractMisinterpretationResult.classification).toBe("契約条件の誤解釈");
    expect(contractMisinterpretationResult.severity).toBe("high");
    expect(contractMisinterpretationResult.rootCause).toContain("特別条項");
    expect(contractMisinterpretationResult.detectionLog).toBeDefined();
    expect(typeof contractMisinterpretationResult.detectionLog).toBe("string");

    // 各パターンの分類精度を検証
    const results = [
      dataInputErrorResult,
      calculationLogicErrorResult,
      contractMisinterpretationResult
    ];

    results.forEach((result) => {
      expect(result.classification).toMatch(
        /^(データ入力誤り|計算ロジック誤り|契約条件の誤解釈)$/
      );
      expect(result.severity).toMatch(/^(low|medium|high)$/);
      expect(result.detectionLog.length).toBeGreaterThan(0);
      expect(result.timestamp).toBeDefined();
    });

    // 不正な分類が行われないことを確認
    results.forEach((result, index) => {
      if (index === 0) {
        expect(result.classification).not.toBe("計算ロジック誤り");
        expect(result.classification).not.toBe("契約条件の誤解釈");
      }
      if (index === 1) {
        expect(result.classification).not.toBe("データ入力誤り");
        expect(result.classification).not.toBe("契約条件の誤解釈");
      }
      if (index === 2) {
        expect(result.classification).not.toBe("データ入力誤り");
        expect(result.classification).not.toBe("計算ロジック誤り");
      }
    });
  });
});