import { describe, test, expect } from "@jest/globals";
import { detectBillingCalculationErrors } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-607: [error] 請求額計算・異常値検出機能 - 計算誤り（四捨五入・端数処理）が検出される
  test("複数の請求項目の四捨五入・端数処理誤りを検出し、詳細なエラー情報を記録する", () => {
    const billingData = [
      {
        itemId: "item_001",
        itemName: "サービスA",
        unitPrice: 1234.567,
        quantity: 3,
        expectedAmount: 3704,
        calculatedAmount: 3705,
        roundingMethod: "常に切り上げ",
      },
      {
        itemId: "item_002",
        itemName: "サービスB",
        unitPrice: 567.89,
        quantity: 2,
        expectedAmount: 1136,
        calculatedAmount: 1135,
        roundingMethod: "常に切り下げ",
      },
      {
        itemId: "item_003",
        itemName: "サービスC",
        unitPrice: 999.999,
        quantity: 5,
        expectedAmount: 5000,
        calculatedAmount: 5000,
        roundingMethod: "四捨五入",
      },
    ];

    const detectionResult = detectBillingCalculationErrors(billingData);

    expect(detectionResult).toBeDefined();
    expect(detectionResult.hasErrors).toBe(true);
    expect(detectionResult.errorCount).toBe(2);

    const errors = detectionResult.detectedErrors;
    expect(errors.length).toBe(2);

    const firstError = errors[0];
    expect(firstError.itemId).toBe("item_001");
    expect(firstError.itemName).toBe("サービスA");
    expect(firstError.errorType).toBe("四捨五入誤り");
    expect(firstError.expectedValue).toBe(3704);
    expect(firstError.calculatedValue).toBe(3705);
    expect(firstError.discrepancy).toBe(1);
    expect(firstError.cause).toBe("常に切り上げ");
    expect(firstError.severity).toBe("high");
    expect(firstError.detectionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
    expect(firstError.detectionReason).toMatch(/四捨五入/);

    const secondError = errors[1];
    expect(secondError.itemId).toBe("item_002");
    expect(secondError.itemName).toBe("サービスB");
    expect(secondError.errorType).toBe("四捨五入誤り");
    expect(secondError.expectedValue).toBe(1136);
    expect(secondError.calculatedValue).toBe(1135);
    expect(secondError.discrepancy).toBe(-1);
    expect(secondError.cause).toBe("常に切り下げ");
    expect(secondError.severity).toBe("high");
    expect(secondError.detectionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
    expect(secondError.detectionReason).toMatch(/四捨五入/);

    const successItem = errors.find((e) => e.itemId === "item_003");
    expect(successItem).toBeUndefined();

    expect(detectionResult.errorLog).toBeDefined();
    expect(detectionResult.errorLog.length).toBeGreaterThan(0);
    expect(detectionResult.errorLog[0]).toHaveProperty("detectedAt");
    expect(detectionResult.errorLog[0]).toHaveProperty("reason");
    expect(detectionResult.errorLog[0]).toHaveProperty("severity");
    expect(detectionResult.errorLog[0].severity).toMatch(
      /^(low|medium|high|critical)$/
    );

    const totalDiscrepancy = errors.reduce((sum, e) => sum + Math.abs(e.discrepancy), 0);
    expect(totalDiscrepancy).toBe(2);

    expect(detectionResult.summary).toBeDefined();
    expect(detectionResult.summary.processedItemCount).toBe(3);
    expect(detectionResult.summary.errorItemCount).toBe(2);
    expect(detectionResult.summary.successItemCount).toBe(1);
  });

  test("複数の端数処理パターンでの計算誤りを検出し、根本原因を特定する", () => {
    const complexBillingData = [
      {
        itemId: "item_010",
        unitPrice: 1111.111,
        quantity: 7,
        expectedAmount: 7778,
        calculatedAmount: 7779,
        roundingMethod: "切り上げ",
      },
      {
        itemId: "item_020",
        unitPrice: 2222.222,
        quantity: 4,
        expectedAmount: 8889,
        calculatedAmount: 8888,
        roundingMethod: "切り下げ",
      },
      {
        itemId: "item_030",
        unitPrice: 3333.333,
        quantity: 3,
        expectedAmount: 10000,
        calculatedAmount: 9999,
        roundingMethod: "四捨五入（誤り）",
      },
    ];

    const detectionResult = detectBillingCalculationErrors(complexBillingData);

    expect(detectionResult.hasErrors).toBe(true);
    expect(detectionResult.errorCount).toBe(3);

    const rootCauses = detectionResult.detectedErrors.map((e) => e.cause);
    expect(rootCauses).toContain("切り上げ");
    expect(rootCauses).toContain("切り下げ");
    expect(rootCauses).toContain("四捨五入（誤り）");

    detectionResult.detectedErrors.forEach((error) => {
      expect(error).toHaveProperty("cause");
      expect(error.cause).toBeTruthy();
      expect(error).toHaveProperty("errorType");
      expect(error.errorType).toBe("四捨五入誤り");
    });

    const discrepancies = detectionResult.detectedErrors.map((e) => e.discrepancy);
    expect(discrepancies).toContain(1);
    expect(discrepancies).toContain(-1);
    expect(discrepancies).toContain(-1);
  });

  test("計算誤りが検出されない場合、errorCountは0で hasErrorsはfalseとなる", () => {
    const validBillingData = [
      {
        itemId: "item_100",
        unitPrice: 1000,
        quantity: 5,
        expectedAmount: 5000,
        calculatedAmount: 5000,
        roundingMethod: "四捨五入",
      },
      {
        itemId: "item_101",
        unitPrice: 2500,
        quantity: 2,
        expectedAmount: 5000,
        calculatedAmount: 5000,
        roundingMethod: "四捨五入",
      },
    ];

    const detectionResult = detectBillingCalculationErrors(validBillingData);

    expect(detectionResult.hasErrors).toBe(false);
    expect(detectionResult.errorCount).toBe(0);
    expect(detectionResult.detectedErrors.length).toBe(0);
    expect(detectionResult.summary.errorItemCount).toBe(0);
    expect(detectionResult.summary.successItemCount).toBe(2);
  });

  test("不正な四捨五入ルールが適用されたデータを入力時、エラー検出機能が正常に動作しないケースで例外をスロー", () => {
    const invalidBillingData = [
      {
        itemId: "item_bad",
        unitPrice: null as any,
        quantity: 3,
        expectedAmount: 0,
        calculatedAmount: 0,
        roundingMethod: "不正なルール",
      },
    ];

    expect(() => detectBillingCalculationErrors(invalidBillingData)).toThrow(
      /単価/
    );
  });

  test("異常値検出ログに検出日時、検出理由、重要度レベルが記録される", () => {
    const billingDataForLogging = [
      {
        itemId: "item_log_001",
        itemName: "ログテスト項目A",
        unitPrice: 1500.5,
        quantity: 4,
        expectedAmount: 6002,
        calculatedAmount: 6003,
        roundingMethod: "不正な切り上げ",
      },
    ];

    const detectionResult = detectBillingCalculationErrors(
      billingDataForLogging
    );

    expect(detectionResult.errorLog).toBeDefined();
    expect(Array.isArray(detectionResult.errorLog)).toBe(true);
    expect(detectionResult.errorLog.length).toBeGreaterThan(0);

    const logEntry = detectionResult.errorLog[0];
    expect(logEntry).toHaveProperty("detectedAt");
    expect(typeof logEntry.detectedAt).toBe("string");
    expect(logEntry.detectedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(logEntry).toHaveProperty("reason");
    expect(typeof logEntry.reason).toBe("string");
    expect(logEntry.reason.length).toBeGreaterThan(0);

    expect(logEntry).toHaveProperty("severity");
    expect(["low", "medium", "high", "critical"]).toContain(logEntry.severity);

    expect(logEntry).toHaveProperty("affectedItemId");
    expect(logEntry.affectedItemId).toBe("item_log_001");

    expect(logEntry).toHaveProperty("discrepancyAmount");
    expect(logEntry.discrepancyAmount).toBe(1);
  });
});