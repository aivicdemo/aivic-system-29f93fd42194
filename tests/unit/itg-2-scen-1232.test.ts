import { calculateImprovementAchievementAndNextStep } from "../../src/logic/it-6-2-1-1";

describe("改善目標値達成判定と次ステップ自動決定", () => {
  test("SCEN-1232: 改善目標値に未達の場合、追加改善が決定される", () => {
    // 前提条件: 改善実績データが存在し、改善率が目標値を下回る状態
    const improvementData = {
      assessmentCaseId: "CASE-20240115-001",
      improvementTargetRate: 15, // 目標改善率: 15%
      currentImprovementRate: 8, // 現在の改善率: 8% (未達)
      ocr_accuracy_before: 78.5, // 改善前OCR精度
      ocr_accuracy_after: 84.8, // 改善後OCR精度
      ai_judgment_accuracy_before: 82.3, // 改善前AI判定精度
      ai_judgment_accuracy_after: 89.1, // 改善後AI判定精度
      processing_time_before: 18.5, // 改善前処理時間(分)
      processing_time_after: 16.2, // 改善後処理時間(分)
      quality_uniformity_index_before: 0.72, // 改善前品質均一化指標
      quality_uniformity_index_after: 0.79, // 改善後品質均一化指標
      assessment_date: "2024-01-15",
      improvement_items: ["OCR_MODEL_RETRAIN", "LEARNING_DATA_EXPANSION"],
      improvement_priority_level: "HIGH",
    };

    // 処理実行
    const result = calculateImprovementAchievementAndNextStep(improvementData);

    // 期待結果: 改善目標値に未達
    expect(result.achievement_status).toBe("UNACHIEVED");

    // 改善率が目標値を下回ることを確認
    expect(result.current_improvement_rate).toBe(8);
    expect(result.improvement_target_rate).toBe(15);
    expect(result.current_improvement_rate).toBeLessThan(
      result.improvement_target_rate
    );

    // システムが自動的に『追加改善』ステップを決定
    expect(result.next_step).toBe("ADDITIONAL_IMPROVEMENT");

    // 追加改善の詳細情報が返却される
    expect(result.additional_improvement_details).toBeDefined();
    expect(result.additional_improvement_details.estimated_completion_date).toBe(
      "2024-02-15"
    ); // 追加改善期限: 30日後
    expect(result.additional_improvement_details.priority_level).toBe("HIGH");
    expect(result.additional_improvement_details.improvement_items).toContain(
      "LEARNING_DATA_QUALITY_IMPROVEMENT"
    );
    expect(result.additional_improvement_details.improvement_items).toContain(
      "OCR_MODEL_PARAMETER_ADJUSTMENT"
    );

    // 改善履歴レコードが自動作成される
    expect(result.improvement_history_record).toBeDefined();
    expect(result.improvement_history_record.record_id).toMatch(/^IMP_REC_/);
    expect(result.improvement_history_record.status).toBe("ADDITIONAL_IMPROVEMENT");
    expect(result.improvement_history_record.created_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
    expect(result.improvement_history_record.assessment_case_id).toBe(
      "CASE-20240115-001"
    );

    // OCR精度改善度を確認
    const ocrImprovementRate =
      ((84.8 - 78.5) / 78.5) * 100;
    expect(result.ocr_improvement_percentage).toBeCloseTo(8.02, 1);

    // AI判定精度改善度を確認
    const aiImprovementRate =
      ((89.1 - 82.3) / 82.3) * 100;
    expect(result.ai_judgment_improvement_percentage).toBeCloseTo(8.27, 1);

    // 処理時間削減率を確認
    const timeReductionRate =
      ((18.5 - 16.2) / 18.5) * 100;
    expect(result.processing_time_reduction_percentage).toBeCloseTo(12.43, 1);

    // 品質均一化指標改善度を確認
    const uniformityImprovementRate =
      ((0.79 - 0.72) / 0.72) * 100;
    expect(result.quality_uniformity_improvement_percentage).toBeCloseTo(
      9.72,
      1
    );

    // 改善対策の根本原因診断結果を確認
    expect(result.root_cause_diagnosis).toBeDefined();
    expect(result.root_cause_diagnosis.primary_cause).toMatch(
      /^(LEARNING_DATA_INSUFFICIENT|MODEL_DRIFT|FORMAT_CHANGE)$/
    );

    // 次ステップの推奨期限
    expect(result.additional_improvement_details.recommended_start_date).toBe(
      "2024-01-16"
    );

    // システムが追加改善内容を表示用にフォーマット
    expect(result.display_message).toContain("追加改善");
    expect(result.display_message).toContain("未達");
  });
});