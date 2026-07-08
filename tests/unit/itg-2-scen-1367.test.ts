import { describe, test, expect } from "@jest/globals";
import {
  calculateOcrAccuracy,
  calculatePriceJudgmentAccuracy,
  calculateDeviationRate,
  judgeAcceptance,
  generateMeasurementReport,
} from "../../src/logic/it-6-2-1-1";

describe("他部署フォーマット相場判定精度測定機能", () => {
  test("SCEN-1367: OCR読取精度と相場判定精度を定量化し査定部署モデルとの乖離率を算出して合格判定を実施する", () => {
    // ==================== OCR読取精度の定量化 ====================
    // 他部署フォーマットのテストデータ: 5件中4件が正確に読み取れた
    const ocrTestData = {
      total_items: 5,
      correctly_read_items: 4,
    };

    // OCR読取精度 = 正確に読み取れた項目数 / 全項目数 × 100
    // = 4 / 5 × 100 = 80%
    const ocrAccuracy = calculateOcrAccuracy(ocrTestData);
    expect(ocrAccuracy).toBe(80);

    // ==================== 相場判定精度の定量化 ====================
    // 査定部署の標準判定精度: 95%
    // 他部署フォーマットでの判定結果: 10件中9件が正確に判定された
    const priceJudgmentTestData = {
      standard_accuracy: 95,
      other_branch_total_cases: 10,
      other_branch_correct_cases: 9,
    };

    // 相場判定精度 = 正確に判定された件数 / 全件数 × 100
    // = 9 / 10 × 100 = 90%
    const priceAccuracy = calculatePriceJudgmentAccuracy(priceJudgmentTestData);
    expect(priceAccuracy).toBe(90);

    // ==================== 乖離率の自動計算 ====================
    // 乖離率 = |他部署精度 - 標準精度| / 標準精度 × 100
    // OCR乖離率 = |80 - 90| / 90 × 100 = 11.11%
    // 判定精度乖離率 = |90 - 95| / 95 × 100 = 5.26%
    const deviationCalcData = {
      other_branch_ocr_accuracy: 80,
      standard_ocr_accuracy: 90,
      other_branch_price_accuracy: 90,
      standard_price_accuracy: 95,
    };

    const deviationRates = calculateDeviationRate(deviationCalcData);
    expect(deviationRates.ocr_deviation_rate).toBeCloseTo(11.11, 1);
    expect(deviationRates.price_deviation_rate).toBeCloseTo(5.26, 1);

    // ==================== 許容範囲内判定と合格/不合格判定 ====================
    // 許容範囲の閾値: OCR乖離率 ≤ 15%、判定精度乖離率 ≤ 10%
    // 計算結果: OCR 11.11% (許容内)、判定精度 5.26% (許容内)
    const acceptanceJudgmentData = {
      ocr_deviation_rate: 11.11,
      price_deviation_rate: 5.26,
      ocr_tolerance_threshold: 15,
      price_tolerance_threshold: 10,
    };

    const acceptanceResult = judgeAcceptance(acceptanceJudgmentData);
    expect(acceptanceResult.is_acceptable).toBe(true);
    expect(acceptanceResult.judgment).toBe("合格");
    expect(acceptanceResult.ocr_within_tolerance).toBe(true);
    expect(acceptanceResult.price_within_tolerance).toBe(true);

    // ==================== 測定結果レポートの生成 ====================
    // レポートには以下の情報が含まれるべき:
    // - OCR読取精度, 相場判定精度, 乖離率, 合格判定結果
    const reportGenerationData = {
      test_date: "2024-01-15T11:00:00Z",
      other_branch_name: "営業部門A",
      ocr_accuracy: 80,
      price_accuracy: 90,
      ocr_deviation_rate: 11.11,
      price_deviation_rate: 5.26,
      is_acceptable: true,
      judgment: "合格",
      total_test_cases: 10,
    };

    const report = generateMeasurementReport(reportGenerationData);
    expect(report).toBeDefined();
    expect(report.test_date).toBe("2024-01-15T11:00:00Z");
    expect(report.other_branch_name).toBe("営業部門A");
    expect(report.ocr_accuracy_percentage).toBe(80);
    expect(report.price_accuracy_percentage).toBe(90);
    expect(report.ocr_deviation_rate_percentage).toBeCloseTo(11.11, 1);
    expect(report.price_deviation_rate_percentage).toBeCloseTo(5.26, 1);
    expect(report.final_judgment).toBe("合格");
    expect(report.report_status).toBe("完成");

    // ==================== 不合格ケースの検証 ====================
    // OCR乖離率が許容範囲を超える場合
    const failureJudgmentData = {
      ocr_deviation_rate: 18.5,
      price_deviation_rate: 5.26,
      ocr_tolerance_threshold: 15,
      price_tolerance_threshold: 10,
    };

    const failureResult = judgeAcceptance(failureJudgmentData);
    expect(failureResult.is_acceptable).toBe(false);
    expect(failureResult.judgment).toBe("不合格");
    expect(failureResult.ocr_within_tolerance).toBe(false);
    expect(failureResult.price_within_tolerance).toBe(true);

    // ==================== 判定精度乖離率が許容範囲を超える場合 ====================
    const failureJudgmentData2 = {
      ocr_deviation_rate: 11.11,
      price_deviation_rate: 12.5,
      ocr_tolerance_threshold: 15,
      price_tolerance_threshold: 10,
    };

    const failureResult2 = judgeAcceptance(failureJudgmentData2);
    expect(failureResult2.is_acceptable).toBe(false);
    expect(failureResult2.judgment).toBe("不合格");
    expect(failureResult2.ocr_within_tolerance).toBe(true);
    expect(failureResult2.price_within_tolerance).toBe(false);

    // ==================== 境界値テスト: 両方許容範囲の上限 ====================
    const boundaryData = {
      ocr_deviation_rate: 15.0,
      price_deviation_rate: 10.0,
      ocr_tolerance_threshold: 15,
      price_tolerance_threshold: 10,
    };

    const boundaryResult = judgeAcceptance(boundaryData);
    expect(boundaryResult.is_acceptable).toBe(true);
    expect(boundaryResult.judgment).toBe("合格");
    expect(boundaryResult.ocr_within_tolerance).toBe(true);
    expect(boundaryResult.price_within_tolerance).toBe(true);

    // ==================== 関数呼び出しが必須フィールドなしで呼ばれた場合のエラー ====================
    const invalidOcrData = {
      total_items: 5,
    };
    expect(() => calculateOcrAccuracy(invalidOcrData as any)).toThrow(
      /読取項目数/
    );

    const invalidJudgmentData = {
      standard_accuracy: 95,
    };
    expect(() =>
      calculatePriceJudgmentAccuracy(invalidJudgmentData as any)
    ).toThrow(/判定件数/);

    const invalidDeviationData = {
      other_branch_ocr_accuracy: 80,
    };
    expect(() => calculateDeviationRate(invalidDeviationData as any)).toThrow(
      /精度値/
    );

    const invalidAcceptanceData = {
      ocr_deviation_rate: 11.11,
    };
    expect(() => judgeAcceptance(invalidAcceptanceData as any)).toThrow(
      /乖離率/
    );

    const invalidReportData = {
      test_date: "2024-01-15T11:00:00Z",
    };
    expect(() =>
      generateMeasurementReport(invalidReportData as any)
    ).toThrow(/測定値/);
  });
});