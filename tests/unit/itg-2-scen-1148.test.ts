import { diagnoseOCRPrecisionDecline } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1148
  test("精度低下根本原因特定機能 - OCR精度が前月比5%以上低下した場合、学習データ不足・物価本更新遅延・見積フォーマット変化から根本原因を正確に特定する", () => {
    // 前月のOCR精度データ（基準値）
    const previous_month_ocr_accuracy = 92.5;

    // 当月のOCR精度データ（5%以上の低下シナリオ）
    const current_month_ocr_accuracy = 87.0;

    // 前月比の低下率を計算
    const accuracy_decline_rate =
      ((previous_month_ocr_accuracy - current_month_ocr_accuracy) /
        previous_month_ocr_accuracy) *
      100;

    // 低下率が5%以上であることを確認
    expect(accuracy_decline_rate).toBeGreaterThanOrEqual(5.0);

    // 学習データ不足のシミュレーション条件
    const training_data_shortage_condition = {
      data_coverage_rate: 68.5, // カバレッジ率が70%未満
      missing_regions: ["北海道", "沖縄"],
      missing_construction_types: ["橋梁工事"],
      confidence_score: 0,
    };

    // 物価本更新遅延のシミュレーション条件
    const price_book_update_delay_condition = {
      latest_version_release_date: "2023-11-15",
      current_date: "2024-01-15",
      days_since_update: 61,
      confidence_score: 0,
    };

    // 見積フォーマット変化のシミュレーション条件
    const estimate_format_change_condition = {
      format_change_detected: true,
      affected_estimate_count: 142,
      format_change_rate: 18.5,
      confidence_score: 0,
    };

    // 根本原因特定機能を実行
    const diagnosis_result = diagnoseOCRPrecisionDecline({
      previous_month_accuracy: previous_month_ocr_accuracy,
      current_month_accuracy: current_month_ocr_accuracy,
      training_data_shortage_condition,
      price_book_update_delay_condition,
      estimate_format_change_condition,
    });

    // 診断結果の基本構造を検証
    expect(diagnosis_result).toHaveProperty("decline_rate");
    expect(diagnosis_result).toHaveProperty("root_causes");
    expect(diagnosis_result).toHaveProperty("analysis_report");

    // 低下率が正確に計算されていることを検証
    expect(diagnosis_result.decline_rate).toBe(5.946994595941546);

    // 3つの根本原因がすべて特定されることを検証
    expect(diagnosis_result.root_causes).toHaveLength(3);

    // 根本原因1: 学習データ不足
    const training_data_shortage_root_cause = diagnosis_result.root_causes.find(
      (cause: any) => cause.root_cause_type === "training_data_shortage"
    );
    expect(training_data_shortage_root_cause).toBeDefined();
    expect(training_data_shortage_root_cause.confidence_score).toBe(72.5);
    expect(training_data_shortage_root_cause.impact_degree).toBe("high");
    expect(training_data_shortage_root_cause.missing_coverage_regions).toEqual([
      "北海道",
      "沖縄",
    ]);
    expect(training_data_shortage_root_cause.missing_coverage_types).toEqual([
      "橋梁工事",
    ]);
    expect(training_data_shortage_root_cause.recommended_actions).toContain(
      "不足地域のデータ追加収集"
    );

    // 根本原因2: 物価本更新遅延
    const price_book_update_delay_root_cause = diagnosis_result.root_causes.find(
      (cause: any) => cause.root_cause_type === "price_book_update_delay"
    );
    expect(price_book_update_delay_root_cause).toBeDefined();
    expect(price_book_update_delay_root_cause.confidence_score).toBe(68.0);
    expect(price_book_update_delay_root_cause.impact_degree).toBe("high");
    expect(price_book_update_delay_root_cause.days_since_last_update).toBe(61);
    expect(price_book_update_delay_root_cause.recommended_actions).toContain(
      "物価本の最新版を適用"
    );

    // 根本原因3: 見積フォーマット変化
    const estimate_format_change_root_cause = diagnosis_result.root_causes.find(
      (cause: any) => cause.root_cause_type === "estimate_format_change"
    );
    expect(estimate_format_change_root_cause).toBeDefined();
    expect(estimate_format_change_root_cause.confidence_score).toBe(64.5);
    expect(estimate_format_change_root_cause.impact_degree).toBe("medium");
    expect(estimate_format_change_root_cause.affected_estimate_count).toBe(142);
    expect(estimate_format_change_root_cause.format_change_rate).toBe(18.5);
    expect(estimate_format_change_root_cause.recommended_actions).toContain(
      "OCRモデルの再学習"
    );

    // 分析レポートが正常に生成されていることを検証
    expect(diagnosis_result.analysis_report).toBeDefined();
    expect(diagnosis_result.analysis_report).toHaveProperty("report_title");
    expect(diagnosis_result.analysis_report).toHaveProperty("summary");
    expect(diagnosis_result.analysis_report).toHaveProperty("detailed_analysis");
    expect(diagnosis_result.analysis_report).toHaveProperty(
      "countermeasures_priority"
    );

    // レポートの内容を検証
    expect(diagnosis_result.analysis_report.report_title).toBe(
      "OCR精度低下根本原因分析レポート"
    );
    expect(diagnosis_result.analysis_report.summary).toContain("5.95%");

    // 対策案が優先度付きで含まれていることを検証
    expect(
      diagnosis_result.analysis_report.countermeasures_priority
    ).toHaveLength(3);
    expect(
      diagnosis_result.analysis_report.countermeasures_priority[0].priority
    ).toBe(1);
    expect(
      diagnosis_result.analysis_report.countermeasures_priority[0].root_cause
    ).toBe("training_data_shortage");
    expect(
      diagnosis_result.analysis_report.countermeasures_priority[1].priority
    ).toBe(2);
    expect(
      diagnosis_result.analysis_report.countermeasures_priority[1].root_cause
    ).toBe("price_book_update_delay");
    expect(
      diagnosis_result.analysis_report.countermeasures_priority[2].priority
    ).toBe(3);
    expect(
      diagnosis_result.analysis_report.countermeasures_priority[2].root_cause
    ).toBe("estimate_format_change");

    // 詳細分析内容が正確であることを検証
    expect(
      diagnosis_result.analysis_report.detailed_analysis
    ).toContain("学習データ不足");
    expect(
      diagnosis_result.analysis_report.detailed_analysis
    ).toContain("物価本更新遅延");
    expect(
      diagnosis_result.analysis_report.detailed_analysis
    ).toContain("見積フォーマット変化");
  });
});