import { describe, test, expect } from "@jest/globals";
import {
  determineExpansionFeasibility,
} from "../../src/logic/it-6-2-1-1";

describe("展開計画実行可否判定機能", () => {
  test("SCEN-1582: 初期30名運用の定量実績と他部署試験適用精度測定から展開Go/No-Go判定を実行する", () => {
    // テストデータ: 初期30名運用の定量実績データ
    const initial_30_operands = {
      operation_period_months: 3,
      total_assessment_count: 1250,
      average_processing_time_minutes: 18.5,
      processing_time_reduction_rate_percent: 35.2,
      quality_uniformity_index: 87.5,
      system_availability_rate_percent: 98.8,
      ocr_accuracy_rate_percent: 94.2,
      ai_judgment_accuracy_rate_percent: 91.8,
      assessment_personnel_count: 30,
    };

    // テストデータ: 他部署試験適用精度測定データ
    const other_dept_trial_results = {
      trial_period_days: 14,
      trial_assessment_count: 180,
      ocr_accuracy_trial_percent: 89.5,
      ai_judgment_accuracy_trial_percent: 86.2,
      format_compatibility_assessment: "partial_incompatibility",
      format_incompatibility_count: 12,
      learning_data_coverage_rate_percent: 72.3,
      critical_region_coverage_rate_percent: 65.8,
    };

    // 展開Go/No-Go判定機能を実行
    const feasibility_result = determineExpansionFeasibility(
      initial_30_operands,
      other_dept_trial_results
    );

    // ==================== 判定結果の妥当性検証 ====================
    // 期待結果: No-Go と判定される（他部署精度が初期値から許容度以上低下）
    expect(feasibility_result.expansion_go_no_go_decision).toBe("no_go");

    // ==================== 判定根拠となる詳細分析データの検証 ====================
    // OCR精度低下率の計算: (94.2 - 89.5) / 94.2 * 100 = 5.0% 低下 (許容度内)
    expect(feasibility_result.ocr_accuracy_degradation_rate_percent).toBe(5.0);

    // AI判定精度低下率の計算: (91.8 - 86.2) / 91.8 * 100 = 6.1% 低下 (許容度内)
    expect(feasibility_result.ai_judgment_accuracy_degradation_rate_percent).toBe(
      6.1
    );

    // 学習データ不足リスク判定: カバレッジが72.3% (許容度75%以下なので低リスク)
    expect(feasibility_result.learning_data_insufficiency_risk_level).toBe(
      "low_risk"
    );

    // フォーマット互換性リスク評価
    // 不適合率: 12 / 180 * 100 = 6.67% (許容度内)
    expect(feasibility_result.format_incompatibility_rate_percent).toBe(6.67);

    // 重要地域カバレッジリスク判定: 65.8% (許容度70%以下なので中リスク)
    expect(feasibility_result.critical_region_coverage_risk_level).toBe(
      "medium_risk"
    );

    // ==================== No-Go 判定理由の検証 ====================
    // 複合判定: 重要地域カバレッジが許容度未満のため No-Go
    expect(feasibility_result.primary_rejection_reason).toBe(
      "critical_region_coverage_insufficient"
    );

    // 代替判定条件の提示
    expect(feasibility_result.alternative_improvement_requirements).toEqual({
      required_critical_region_coverage_rate_percent: 75.0,
      current_critical_region_coverage_rate_percent: 65.8,
      coverage_gap_percent: 9.2,
      estimated_additional_learning_data_cases: 280,
      estimated_preparation_period_days: 30,
    });

    // ==================== 判定結果の記録検証 ====================
    // 判定実行タイムスタンプが ISO 8601 形式で記録される
    expect(feasibility_result.decision_execution_timestamp).toBe(
      "2024-12-15T10:30:00Z"
    );

    // 判定根拠となる詳細情報がすべて含まれることを確認
    expect(feasibility_result.detailed_analysis_summary).toEqual({
      initial_operation_metrics: {
        avg_processing_time_minutes: 18.5,
        processing_time_reduction_rate_percent: 35.2,
        quality_uniformity_index: 87.5,
        system_availability_rate_percent: 98.8,
      },
      trial_performance_metrics: {
        ocr_accuracy_trial_percent: 89.5,
        ai_judgment_accuracy_trial_percent: 86.2,
        format_incompatibility_rate_percent: 6.67,
      },
      risk_assessment: {
        ocr_accuracy_degradation_percent: 5.0,
        ai_judgment_accuracy_degradation_percent: 6.1,
        learning_data_insufficiency_risk: "low_risk",
        critical_region_coverage_risk: "medium_risk",
      },
    });

    // ==================== 判定結果の保存状態を検証 ====================
    // 判定結果がシステムに正常に保存されたことを示すフラグ
    expect(feasibility_result.is_decision_saved_to_system).toBe(true);

    // 判定レコード ID が生成され記録されている
    expect(feasibility_result.decision_record_id).toMatch(/^EXPAND_DEC_\d{14}$/);

    // ==================== 判定の稲妥性チェック ====================
    // No-Go 判定の場合、次評価時期が提示される
    expect(feasibility_result.re_evaluation_scheduled_date).toBe(
      "2025-01-14"
    );

    // 改善施策完了後の再判定条件が明確に記載される
    expect(feasibility_result.conditions_for_go_decision).toEqual({
      minimum_critical_region_coverage_rate_percent: 75.0,
      minimum_ocr_accuracy_rate_percent: 91.0,
      minimum_ai_judgment_accuracy_rate_percent: 88.0,
      maximum_format_incompatibility_rate_percent: 5.0,
    });

    // ==================== 判定根拠の透明性検証 ====================
    // 判定に用いられた判定ロジック識別子
    expect(feasibility_result.applied_judgment_logic_id).toBe(
      "LOGIC_EXPAND_v2.1"
    );

    // 判定実行者の識別情報
    expect(feasibility_result.decision_executor_id).toBe("SYS_AUTOMATED");

    // 判定に用いられた基準値が明示される
    expect(feasibility_result.judgment_threshold_values).toEqual({
      accuracy_degradation_tolerance_percent: 7.5,
      critical_region_coverage_minimum_percent: 75.0,
      format_compatibility_tolerance_percent: 8.0,
      learning_data_coverage_minimum_percent: 70.0,
    });
  });
});