import { describe, test, expect } from "@jest/globals";
import {
  verifyAIJudgmentPrecision,
} from "../../src/logic/it-6-2-1-1";

describe("AI判定精度検証機能", () => {
  test("SCEN-1500: AI判定モデル再学習完了後、検証データセットに対して精度検証を実施した場合、OCR精度と判定精度が合格基準を満たしているか正確に判定される", () => {
    // ========== 検証データセット準備 ==========
    // OCR対象画像リスト（base64 encoded 画像データの模擬）
    const ocrTestImages = [
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    ];

    // OCR正解データセット（実際の見積書項目）
    const ocrGroundTruth = [
      {
        image_index: 0,
        expected_text: "工事種別: 土木工事",
        expected_amount: 5000000,
      },
      {
        image_index: 1,
        expected_text: "数量: 100.5 m3",
        expected_amount: 100.5,
      },
      {
        image_index: 2,
        expected_text: "単価: 49751 円/m3",
        expected_amount: 49751,
      },
    ];

    // AI判定正解データセット
    const judgmentGroundTruth = [
      {
        estimate_id: "EST-001",
        work_type: "土木工事",
        region: "東京",
        amount: 5000000,
        expected_judgment: "承認",
        expected_deviation_rate: 2.5,
      },
      {
        estimate_id: "EST-002",
        work_type: "土木工事",
        region: "大阪",
        amount: 3500000,
        expected_judgment: "修正",
        expected_deviation_rate: 8.7,
      },
      {
        estimate_id: "EST-003",
        work_type: "建築工事",
        region: "東京",
        amount: 7200000,
        expected_judgment: "承認",
        expected_deviation_rate: 1.2,
      },
      {
        estimate_id: "EST-004",
        work_type: "建築工事",
        region: "愛知",
        amount: 4100000,
        expected_judgment: "修正",
        expected_deviation_rate: 6.5,
      },
    ];

    // 合格基準の設定値
    const passingCriteria = {
      ocr_precision_threshold: 0.92, // 92%以上で合格
      judgment_precision_threshold: 0.88, // 88%以上で合格
      max_deviation_rate_for_approval: 5.0, // 乖離率5%以内で承認
    };

    // ========== OCR精度検証結果（模擬実行結果） ==========
    // OCR処理結果：正解率の計算
    const ocrResults = [
      {
        image_index: 0,
        detected_text: "工事種別: 土木工事",
        detected_amount: 5000000,
        is_match: true,
      },
      {
        image_index: 1,
        detected_text: "数量: 100.5 m3",
        detected_amount: 100.5,
        is_match: true,
      },
      {
        image_index: 2,
        detected_text: "単価: 49751 円/m3",
        detected_amount: 49751,
        is_match: true,
      },
    ];

    // OCR精度の計算（正解数 / 全体数）
    const ocrCorrectCount = ocrResults.filter((r) => r.is_match).length;
    const ocrPrecision = ocrCorrectCount / ocrResults.length; // 3/3 = 1.0 (100%)

    // ========== AI判定精度検証結果（模擬実行結果） ==========
    // AI判定処理結果：判定と乖離率の検証
    const judgmentResults = [
      {
        estimate_id: "EST-001",
        predicted_judgment: "承認",
        predicted_deviation_rate: 2.3,
        is_judgment_match: true,
        is_deviation_match: true,
      },
      {
        estimate_id: "EST-002",
        predicted_judgment: "修正",
        predicted_deviation_rate: 8.9,
        is_judgment_match: true,
        is_deviation_match: true,
      },
      {
        estimate_id: "EST-003",
        predicted_judgment: "承認",
        predicted_deviation_rate: 1.1,
        is_judgment_match: true,
        is_deviation_match: true,
      },
      {
        estimate_id: "EST-004",
        predicted_judgment: "修正",
        predicted_deviation_rate: 6.3,
        is_judgment_match: true,
        is_deviation_match: true,
      },
    ];

    // AI判定精度の計算（判定と乖離率の正解数 / 全体数）
    const judgmentCorrectCount = judgmentResults.filter(
      (r) => r.is_judgment_match && r.is_deviation_match
    ).length;
    const judgmentPrecision = judgmentCorrectCount / judgmentResults.length; // 4/4 = 1.0 (100%)

    // ========== 精度検証メイン処理 ==========
    const verificationInput = {
      model_version: "v2.3.1",
      relearning_completion_datetime: new Date("2024-12-15T14:30:00Z"),
      test_dataset_id: "test-set-2024-12-15-001",
      ocr_test_images: ocrTestImages,
      ocr_ground_truth: ocrGroundTruth,
      judgment_ground_truth: judgmentGroundTruth,
      passing_criteria: passingCriteria,
      ocr_results: ocrResults,
      judgment_results: judgmentResults,
    };

    const verificationResult = verifyAIJudgmentPrecision(verificationInput);

    // ========== Assertion: OCR精度検証 ==========
    expect(verificationResult.ocr_precision).toBe(1.0);
    expect(verificationResult.ocr_precision).toBeGreaterThanOrEqual(
      passingCriteria.ocr_precision_threshold
    );
    expect(verificationResult.ocr_precision_percentage).toBe("100.00%");
    expect(verificationResult.ocr_correct_count).toBe(3);
    expect(verificationResult.ocr_total_count).toBe(3);
    expect(verificationResult.ocr_status).toBe("合格");

    // ========== Assertion: AI判定精度検証 ==========
    expect(verificationResult.judgment_precision).toBe(1.0);
    expect(verificationResult.judgment_precision).toBeGreaterThanOrEqual(
      passingCriteria.judgment_precision_threshold
    );
    expect(verificationResult.judgment_precision_percentage).toBe("100.00%");
    expect(verificationResult.judgment_correct_count).toBe(4);
    expect(verificationResult.judgment_total_count).toBe(4);
    expect(verificationResult.judgment_status).toBe("合格");

    // ========== Assertion: 総合判定結果 ==========
    expect(verificationResult.overall_verification_status).toBe("合格");
    expect(verificationResult.both_criteria_met).toBe(true);

    // ========== Assertion: 精度検証レポート生成 ==========
    expect(verificationResult.verification_report).toBeDefined();
    expect(verificationResult.verification_report.report_id).toMatch(
      /^VERIFY-\d{8}-\d{6}-[A-Z0-9]{8}$/
    );
    expect(verificationResult.verification_report.model_version).toBe(
      "v2.3.1"
    );
    expect(
      verificationResult.verification_report.verification_datetime
    ).toBeDefined();
    expect(
      verificationResult.verification_report.verification_datetime
    ).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // ========== Assertion: レポート内の詳細指標 ==========
    expect(verificationResult.verification_report.ocr_metrics).toEqual({
      precision: 1.0,
      precision_percentage: "100.00%",
      correct_count: 3,
      total_count: 3,
      status: "合格",
      threshold_value: 0.92,
      threshold_met: true,
    });

    expect(verificationResult.verification_report.judgment_metrics).toEqual({
      precision: 1.0,
      precision_percentage: "100.00%",
      correct_count: 4,
      total_count: 4,
      status: "合格",
      threshold_value: 0.88,
      threshold_met: true,
    });

    // ========== Assertion: レポートサマリー ==========
    expect(verificationResult.verification_report.summary).toEqual({
      overall_status: "合格",
      both_thresholds_met: true,
      recommendation: "本번 運用への適用を承認",
      next_action: "モデルを本番環境にデプロイ",
    });

    // ========== Assertion: タイムスタンプとメタデータ ==========
    expect(verificationResult.verification_report.test_dataset_id).toBe(
      "test-set-2024-12-15-001"
    );
    expect(verificationResult.verification_report.passing_criteria).toEqual({
      ocr_precision_threshold: 0.92,
      judgment_precision_threshold: 0.88,
      max_deviation_rate_for_approval: 5.0,
    });

    // ========== Assertion: 両精度が合格基準を満たす場合の最終判定 ==========
    expect(verificationResult.final_verification_decision).toBe("合格");
    expect(verificationResult.verification_passed).toBe(true);
    expect(verificationResult.can_apply_to_production).toBe(true);
  });
});