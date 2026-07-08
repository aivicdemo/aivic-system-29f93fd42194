import { generateImprovementReport } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1239: [error] 改善結果レポートの自動生成 - 必要な根拠データが不足している場合、レポート生成がエラーで中断される
  test("査定件数が不足している場合、改善結果レポート生成がエラーで中断される", () => {
    const input_missing_assessment_count = {
      assessment_count: null,
      improvement_items: ["OCR精度向上", "学習データ追加"],
      before_ocr_accuracy: 85.5,
      after_ocr_accuracy: 91.2,
      before_judgment_accuracy: 78.3,
      after_judgment_accuracy: 84.7,
      processing_time_before_minutes: 45,
      processing_time_after_minutes: 38,
      quality_uniformity_before: 72.4,
      quality_uniformity_after: 86.9,
      implementation_start_date: "2024-01-15",
      implementation_end_date: "2024-02-15",
    };

    expect(() => generateImprovementReport(input_missing_assessment_count)).toThrow(/査定件数/);
  });

  test("改善項目が不足している場合、改善結果レポート生成がエラーで中断される", () => {
    const input_missing_improvement_items = {
      assessment_count: 240,
      improvement_items: [],
      before_ocr_accuracy: 85.5,
      after_ocr_accuracy: 91.2,
      before_judgment_accuracy: 78.3,
      after_judgment_accuracy: 84.7,
      processing_time_before_minutes: 45,
      processing_time_after_minutes: 38,
      quality_uniformity_before: 72.4,
      quality_uniformity_after: 86.9,
      implementation_start_date: "2024-01-15",
      implementation_end_date: "2024-02-15",
    };

    expect(() => generateImprovementReport(input_missing_improvement_items)).toThrow(/改善項目/);
  });

  test("改善前後のOCR精度が不足している場合、改善結果レポート生成がエラーで中断される", () => {
    const input_missing_ocr_accuracy = {
      assessment_count: 240,
      improvement_items: ["OCR精度向上", "学習データ追加"],
      before_ocr_accuracy: null,
      after_ocr_accuracy: 91.2,
      before_judgment_accuracy: 78.3,
      after_judgment_accuracy: 84.7,
      processing_time_before_minutes: 45,
      processing_time_after_minutes: 38,
      quality_uniformity_before: 72.4,
      quality_uniformity_after: 86.9,
      implementation_start_date: "2024-01-15",
      implementation_end_date: "2024-02-15",
    };

    expect(() => generateImprovementReport(input_missing_ocr_accuracy)).toThrow(/OCR精度/);
  });

  test("改善前後の判定精度が不足している場合、改善結果レポート生成がエラーで中断される", () => {
    const input_missing_judgment_accuracy = {
      assessment_count: 240,
      improvement_items: ["OCR精度向上", "学習データ追加"],
      before_ocr_accuracy: 85.5,
      after_ocr_accuracy: 91.2,
      before_judgment_accuracy: undefined,
      after_judgment_accuracy: 84.7,
      processing_time_before_minutes: 45,
      processing_time_after_minutes: 38,
      quality_uniformity_before: 72.4,
      quality_uniformity_after: 86.9,
      implementation_start_date: "2024-01-15",
      implementation_end_date: "2024-02-15",
    };

    expect(() => generateImprovementReport(input_missing_judgment_accuracy)).toThrow(/判定精度/);
  });

  test("処理時間データが不足している場合、改善結果レポート生成がエラーで中断される", () => {
    const input_missing_processing_time = {
      assessment_count: 240,
      improvement_items: ["OCR精度向上", "学習データ追加"],
      before_ocr_accuracy: 85.5,
      after_ocr_accuracy: 91.2,
      before_judgment_accuracy: 78.3,
      after_judgment_accuracy: 84.7,
      processing_time_before_minutes: null,
      processing_time_after_minutes: 38,
      quality_uniformity_before: 72.4,
      quality_uniformity_after: 86.9,
      implementation_start_date: "2024-01-15",
      implementation_end_date: "2024-02-15",
    };

    expect(() => generateImprovementReport(input_missing_processing_time)).toThrow(/処理時間/);
  });

  test("品質均一化指標が不足している場合、改善結果レポート生成がエラーで中断される", () => {
    const input_missing_quality_uniformity = {
      assessment_count: 240,
      improvement_items: ["OCR精度向上", "学習データ追加"],
      before_ocr_accuracy: 85.5,
      after_ocr_accuracy: 91.2,
      before_judgment_accuracy: 78.3,
      after_judgment_accuracy: 84.7,
      processing_time_before_minutes: 45,
      processing_time_after_minutes: 38,
      quality_uniformity_before: undefined,
      quality_uniformity_after: 86.9,
      implementation_start_date: "2024-01-15",
      implementation_end_date: "2024-02-15",
    };

    expect(() => generateImprovementReport(input_missing_quality_uniformity)).toThrow(/品質均一化/);
  });

  test("実装期間が不足している場合、改善結果レポート生成がエラーで中断される", () => {
    const input_missing_implementation_date = {
      assessment_count: 240,
      improvement_items: ["OCR精度向上", "学習データ追加"],
      before_ocr_accuracy: 85.5,
      after_ocr_accuracy: 91.2,
      before_judgment_accuracy: 78.3,
      after_judgment_accuracy: 84.7,
      processing_time_before_minutes: 45,
      processing_time_after_minutes: 38,
      quality_uniformity_before: 72.4,
      quality_uniformity_after: 86.9,
      implementation_start_date: null,
      implementation_end_date: "2024-02-15",
    };

    expect(() => generateImprovementReport(input_missing_implementation_date)).toThrow(/実装期間/);
  });

  test("すべての根拠データが揃っている場合、改善結果レポートが正常に生成される", () => {
    const input_valid = {
      assessment_count: 240,
      improvement_items: ["OCR精度向上", "学習データ追加"],
      before_ocr_accuracy: 85.5,
      after_ocr_accuracy: 91.2,
      before_judgment_accuracy: 78.3,
      after_judgment_accuracy: 84.7,
      processing_time_before_minutes: 45,
      processing_time_after_minutes: 38,
      quality_uniformity_before: 72.4,
      quality_uniformity_after: 86.9,
      implementation_start_date: "2024-01-15",
      implementation_end_date: "2024-02-15",
    };

    const result = generateImprovementReport(input_valid);

    expect(result).toBeDefined();
    expect(result.assessment_count).toBe(240);
    expect(result.improvement_items).toEqual(["OCR精度向上", "学習データ追加"]);
    expect(result.ocr_accuracy_improvement_rate).toBe(6.67);
    expect(result.judgment_accuracy_improvement_rate).toBe(8.16);
    expect(result.processing_time_reduction_rate).toBe(15.56);
    expect(result.quality_uniformity_improvement_rate).toBe(20.05);
    expect(result.implementation_period_days).toBe(32);
    expect(result.report_status).toBe("generated");
    expect(result.report_generated_at).toBeDefined();
  });

  test("改善率の計算が正確である", () => {
    const input_calculation_check = {
      assessment_count: 150,
      improvement_items: ["判定ロジック修正"],
      before_ocr_accuracy: 80.0,
      after_ocr_accuracy: 88.0,
      before_judgment_accuracy: 75.0,
      after_judgment_accuracy: 82.5,
      processing_time_before_minutes: 50,
      processing_time_after_minutes: 42,
      quality_uniformity_before: 65.0,
      quality_uniformity_after: 78.0,
      implementation_start_date: "2024-01-01",
      implementation_end_date: "2024-01-10",
    };

    const result = generateImprovementReport(input_calculation_check);

    expect(result.ocr_accuracy_improvement_rate).toBe(10.0);
    expect(result.judgment_accuracy_improvement_rate).toBe(10.0);
    expect(result.processing_time_reduction_rate).toBe(16.0);
    expect(result.quality_uniformity_improvement_rate).toBe(20.0);
    expect(result.implementation_period_days).toBe(10);
  });
});