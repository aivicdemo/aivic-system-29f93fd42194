import { determineLearningDataUpdatePriority } from "../../src/logic/it-6-2-2-1";

describe("査定員別・案件別の判定ロジック・乖離パターン履歴", () => {
  // SCEN-779: [normal] 学習データ改善優先度自動判定機能
  test("精度低下またはユーザーフィードバック件数超過時に地域・工種・時期別の優先度が自動判定される", () => {
    // ============ 前提条件 ============
    // 精度基準値: OCR精度70%以上, AI判定精度75%以上
    // フィードバック閾値: 100件/月
    const precision_threshold_ocr = 70;
    const precision_threshold_ai = 75;
    const feedback_threshold = 100;

    // ============ シナリオ 1: 精度低下（OCR精度が基準値以下）============
    const scenario_precision_decline = {
      trigger_type: "precision_decline",
      ocr_accuracy: 65, // 低下: 70% → 65%
      ai_judgment_accuracy: 78,
      user_feedback_count: 50,
      region_data: [
        { region_code: "R001", case_count: 120, accuracy_decline: 8 },
        { region_code: "R002", case_count: 85, accuracy_decline: 3 },
        { region_code: "R003", case_count: 200, accuracy_decline: 15 },
      ],
      work_type_data: [
        { work_type_code: "W001", case_count: 150, accuracy_decline: 5 },
        { work_type_code: "W002", case_count: 100, accuracy_decline: 12 },
        { work_type_code: "W003", case_count: 155, accuracy_decline: 9 },
      ],
      period_data: [
        { period_code: "P001", case_count: 180, accuracy_decline: 10 },
        { period_code: "P002", case_count: 125, accuracy_decline: 4 },
        { period_code: "P003", case_count: 100, accuracy_decline: 12 },
      ],
    };

    const result_scenario1 = determineLearningDataUpdatePriority(
      scenario_precision_decline
    );

    // 期待値: 精度低下が最大の地域を優先度 HIGH に
    expect(result_scenario1.region_priorities).toEqual([
      { region_code: "R003", priority_level: "HIGH", impact_score: 15 },
      { region_code: "R001", priority_level: "MEDIUM", impact_score: 8 },
      { region_code: "R002", priority_level: "LOW", impact_score: 3 },
    ]);

    // 工種別: W002が精度低下最大 (12%) → HIGH
    expect(result_scenario1.work_type_priorities).toEqual([
      { work_type_code: "W002", priority_level: "HIGH", impact_score: 12 },
      { work_type_code: "W003", priority_level: "MEDIUM", impact_score: 9 },
      { work_type_code: "W001", priority_level: "LOW", impact_score: 5 },
    ]);

    // 時期別: P003 と P001 が精度低下最大 (12%, 10%) → HIGH
    expect(result_scenario1.period_priorities).toEqual([
      { period_code: "P003", priority_level: "HIGH", impact_score: 12 },
      { period_code: "P001", priority_level: "MEDIUM", impact_score: 10 },
      { period_code: "P002", priority_level: "LOW", impact_score: 4 },
    ]);

    // 判定トリガー: precision_decline
    expect(result_scenario1.determination_trigger).toBe("precision_decline");
    expect(result_scenario1.is_priority_update_required).toBe(true);

    // ============ シナリオ 2: ユーザーフィードバック件数超過 ============
    const scenario_feedback_excess = {
      trigger_type: "user_feedback_excess",
      ocr_accuracy: 72,
      ai_judgment_accuracy: 77,
      user_feedback_count: 150, // 超過: 100件 → 150件
      region_data: [
        { region_code: "R001", case_count: 100, feedback_count: 35 },
        { region_code: "R002", case_count: 80, feedback_count: 45 },
        { region_code: "R003", case_count: 150, feedback_count: 70 },
      ],
      work_type_data: [
        { work_type_code: "W001", case_count: 140, feedback_count: 40 },
        { work_type_code: "W002", case_count: 110, feedback_count: 55 },
        { work_type_code: "W003", case_count: 80, feedback_count: 55 },
      ],
      period_data: [
        { period_code: "P001", case_count: 170, feedback_count: 60 },
        { period_code: "P002", case_count: 100, feedback_count: 35 },
        { period_code: "P003", case_count: 60, feedback_count: 55 },
      ],
    };

    const result_scenario2 = determineLearningDataUpdatePriority(
      scenario_feedback_excess
    );

    // フィードバック件数が最多の地域を優先度 HIGH に
    expect(result_scenario2.region_priorities).toEqual([
      { region_code: "R003", priority_level: "HIGH", feedback_count: 70 },
      { region_code: "R002", priority_level: "MEDIUM", feedback_count: 45 },
      { region_code: "R001", priority_level: "LOW", feedback_count: 35 },
    ]);

    // 工種別: W002 と W003 が同じフィードバック数 (55件)
    expect(result_scenario2.work_type_priorities).toEqual([
      { work_type_code: "W002", priority_level: "HIGH", feedback_count: 55 },
      { work_type_code: "W003", priority_level: "HIGH", feedback_count: 55 },
      { work_type_code: "W001", priority_level: "MEDIUM", feedback_count: 40 },
    ]);

    // 時期別: P001 がフィードバック最多 (60件)
    expect(result_scenario2.period_priorities).toEqual([
      { period_code: "P001", priority_level: "HIGH", feedback_count: 60 },
      { period_code: "P003", priority_level: "MEDIUM", feedback_count: 55 },
      { period_code: "P002", priority_level: "LOW", feedback_count: 35 },
    ]);

    // 判定トリガー: user_feedback_excess
    expect(result_scenario2.determination_trigger).toBe("user_feedback_excess");
    expect(result_scenario2.is_priority_update_required).toBe(true);
    expect(result_scenario2.feedback_excess_ratio).toBe(1.5); // 150 / 100

    // ============ シナリオ 3: 複合条件（精度低下 かつ フィードバック超過）============
    const scenario_combined = {
      trigger_type: "combined",
      ocr_accuracy: 68, // 低下: 70% → 68%
      ai_judgment_accuracy: 73, // 低下: 75% → 73%
      user_feedback_count: 120, // 超過: 100件 → 120件
      region_data: [
        {
          region_code: "R001",
          case_count: 100,
          accuracy_decline: 5,
          feedback_count: 30,
        },
        {
          region_code: "R002",
          case_count: 90,
          accuracy_decline: 8,
          feedback_count: 40,
        },
        {
          region_code: "R003",
          case_count: 180,
          accuracy_decline: 12,
          feedback_count: 50,
        },
      ],
      work_type_data: [
        {
          work_type_code: "W001",
          case_count: 130,
          accuracy_decline: 6,
          feedback_count: 35,
        },
        {
          work_type_code: "W002",
          case_count: 120,
          accuracy_decline: 10,
          feedback_count: 45,
        },
        {
          work_type_code: "W003",
          case_count: 120,
          accuracy_decline: 9,
          feedback_count: 40,
        },
      ],
      period_data: [
        {
          period_code: "P001",
          case_count: 160,
          accuracy_decline: 8,
          feedback_count: 55,
        },
        {
          period_code: "P002",
          case_count: 110,
          accuracy_decline: 5,
          feedback_count: 30,
        },
        {
          period_code: "P003",
          case_count: 100,
          accuracy_decline: 12,
          feedback_count: 35,
        },
      ],
    };

    const result_scenario3 = determineLearningDataUpdatePriority(
      scenario_combined
    );

    // 複合条件での統合スコア計算:
    // impact_score = (accuracy_decline_weight * accuracy_decline) + (feedback_weight * feedback_count)
    // weight_accuracy = 0.6, weight_feedback = 0.4 (仮定)
    // R003: 0.6*12 + 0.4*50 = 7.2 + 20 = 27.2 → HIGH
    // R002: 0.6*8 + 0.4*40 = 4.8 + 16 = 20.8 → MEDIUM
    // R001: 0.6*5 + 0.4*30 = 3.0 + 12 = 15.0 → LOW

    expect(result_scenario3.region_priorities).toEqual([
      {
        region_code: "R003",
        priority_level: "HIGH",
        combined_score: 27.2,
      },
      {
        region_code: "R002",
        priority_level: "MEDIUM",
        combined_score: 20.8,
      },
      {
        region_code: "R001",
        priority_level: "LOW",
        combined_score: 15.0,
      },
    ]);

    // 工種別:
    // W002: 0.6*10 + 0.4*45 = 6.0 + 18 = 24.0 → HIGH
    // W003: 0.6*9 + 0.4*40 = 5.4 + 16 = 21.4 → MEDIUM
    // W001: 0.6*6 + 0.4*35 = 3.6 + 14 = 17.6 → LOW

    expect(result_scenario3.work_type_priorities).toEqual([
      {
        work_type_code: "W002",
        priority_level: "HIGH",
        combined_score: 24.0,
      },
      {
        work_type_code: "W003",
        priority_level: "MEDIUM",
        combined_score: 21.4,
      },
      {
        work_type_code: "W001",
        priority_level: "LOW",
        combined_score: 17.6,
      },
    ]);

    // 時期別:
    // P003: 0.6*12 + 0.4*35 = 7.2 + 14 = 21.2 → HIGH
    // P001: 0.6*8 + 0.4*55 = 4.8 + 22 = 26.8 → HIGH
    // P002: 0.6*5 + 0.4*30 = 3.0 + 12 = 15.0 → LOW

    expect(result_scenario3.period_priorities).toEqual([
      {
        period_code: "P001",
        priority_level: "HIGH",
        combined_score: 26.8,
      },
      {
        period_code: "P003",
        priority_level: "HIGH",
        combined_score: 21.2,
      },
      {
        period_code: "P002",
        priority_level: "LOW",
        combined_score: 15.0,
      },
    ]);

    // 複合条件での判定情報
    expect(result_scenario3.determination_trigger).toBe("combined");
    expect(result_scenario3.is_priority_update_required).toBe(true);
    expect(result_scenario3.ocr_accuracy_decline).toBe(2); // 70 - 68
    expect(result_scenario3.ai_accuracy_decline).toBe(2); // 75 - 73
    expect(result_scenario3.feedback_excess_ratio).toBe(1.2); // 120 / 100

    // 改善対象のサマリー
    expect(result_scenario3.priority_summary).toEqual({
      high_priority_regions: ["R003"],
      high_priority_work_types: ["W002"],
      high_priority_periods: ["P001", "P003"],
      total_affected_cases: 370,
      estimated_improvement_impact: "HIGH",
    });
  });
});