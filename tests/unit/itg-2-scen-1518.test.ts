import { determineImprovementAchievementAndNextCyclePlan } from "../../src/logic/it-6-2-1-1";

describe("改善効果達成度判定と継続改善計画決定", () => {
  // SCEN-1518
  test("改善実績が事前設定の目標達成度を超過した場合、継続改善必要なしと判定し次サイクル計画を自動決定", () => {
    // 改善実績データ: 目標達成度を超過するケース
    // 目標: OCR精度改善率 5% → 実績: 7.2%
    // 目標: AI判定精度改善率 3% → 実績: 4.8%
    // 目標: 査定時間短縮率 10% → 実績: 12.5%
    const improvement_metrics = {
      ocr_accuracy_improvement_rate: 7.2,
      ai_judgment_accuracy_improvement_rate: 4.8,
      assessment_time_reduction_rate: 12.5,
    };

    // 事前設定の目標達成度の閾値
    const target_thresholds = {
      ocr_accuracy_target: 5.0,
      ai_judgment_accuracy_target: 3.0,
      assessment_time_reduction_target: 10.0,
    };

    // システムの判定ロジック実行
    const result = determineImprovementAchievementAndNextCyclePlan(
      improvement_metrics,
      target_thresholds
    );

    // 判定結果の検証: 『継続改善必要なし』と判定される
    expect(result.continuation_improvement_required).toBe(false);

    // 改善実績が目標達成度を超過していることの検証
    expect(improvement_metrics.ocr_accuracy_improvement_rate).toBeGreaterThan(
      target_thresholds.ocr_accuracy_target
    );
    expect(
      improvement_metrics.ai_judgment_accuracy_improvement_rate
    ).toBeGreaterThan(target_thresholds.ai_judgment_accuracy_target);
    expect(improvement_metrics.assessment_time_reduction_rate).toBeGreaterThan(
      target_thresholds.assessment_time_reduction_target
    );

    // 自動決定された次サイクル計画の内容を検証
    // 継続改善不要の場合は「通常監視モード」で次サイクル計画が生成される
    expect(result.next_cycle_plan).toBeDefined();
    expect(result.next_cycle_plan.cycle_mode).toBe("normal_monitoring");

    // 次サイクル計画の開始日が適切に設定されていることを検証
    // 改善実績確認から 30 日後が開始予定日
    const result_date = new Date(result.next_cycle_plan.cycle_start_date);
    const expected_start_date = new Date("2024-02-14T00:00:00Z");
    expect(result_date.getTime()).toEqual(expected_start_date.getTime());

    // 次サイクル計画の監視項目が適切に定義されていることを検証
    expect(result.next_cycle_plan.monitoring_items).toEqual([
      "ocr_accuracy",
      "ai_judgment_accuracy",
      "assessment_time",
    ]);

    // 次サイクル計画の監視頻度が月次と設定されていることを検証
    expect(result.next_cycle_plan.monitoring_frequency).toBe("monthly");

    // 判定結果がデータベースに保存可能な形式であることを検証
    expect(result.judgment_record).toBeDefined();
    expect(result.judgment_record.judgment_date).toEqual("2024-01-15");
    expect(result.judgment_record.achievement_status).toBe("exceeded");
    expect(result.judgment_record.continuation_required).toBe(false);

    // 次サイクル計画がデータベースに保存可能な形式であることを検証
    expect(result.next_cycle_plan_record).toBeDefined();
    expect(result.next_cycle_plan_record.plan_id).toBeDefined();
    expect(result.next_cycle_plan_record.plan_id).toMatch(/^PLAN-\d{8}-\d{6}$/);
    expect(result.next_cycle_plan_record.cycle_number).toBe(2);
    expect(result.next_cycle_plan_record.status).toBe("scheduled");

    // 判定理由が明確に記録されていることを検証
    expect(result.judgment_reason).toContain("OCR精度改善率");
    expect(result.judgment_reason).toContain("AI判定精度改善率");
    expect(result.judgment_reason).toContain("査定時間短縮率");

    // 統計的有意性の判定結果を検証
    expect(result.statistical_significance_confirmed).toBe(true);

    // 改善達成度スコア（0-100）を検証：すべての指標が目標を超過している
    expect(result.overall_achievement_score).toBeGreaterThan(100);
    expect(result.overall_achievement_score).toBeLessThanOrEqual(150);
  });
});