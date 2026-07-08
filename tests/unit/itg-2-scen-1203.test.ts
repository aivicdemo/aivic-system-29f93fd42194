import { improveCountermeasurePlan } from "../../src/logic/it-6-2-2-2";

describe("改善対策立案機能 - データ品質低下原因分析", () => {
  // SCEN-1203
  test("データ品質低下が原因の場合にデータ追加・品質検査対策が立案される", () => {
    const input = {
      assessment_id: "ASS-2024-001",
      ocr_accuracy_rate: 0.72,
      ai_judgment_accuracy_rate: 0.68,
      user_feedback_count: 45,
      root_cause_analysis: {
        data_quality_low: true,
        model_drift: false,
        format_change: false,
      },
      missing_data_regions: ["Kanto", "Kansai"],
      missing_work_types: ["Foundation", "Reinforcement"],
      historical_case_data_coverage: 0.65,
      material_book_currency: false,
      assessment_period_start: "2024-01-01",
      assessment_period_end: "2024-01-31",
      evaluator_id: "EVL-2024-100",
    };

    const result = improveCountermeasurePlan(input);

    // 対策が提案されていることを確認
    expect(result.countermeasures).toBeDefined();
    expect(Array.isArray(result.countermeasures)).toBe(true);
    expect(result.countermeasures.length).toBeGreaterThanOrEqual(2);

    // データ追加対策の存在確認
    const data_addition_measure = result.countermeasures.find(
      (m) => m.measure_type === "DATA_ADDITION"
    );
    expect(data_addition_measure).toBeDefined();
    expect(data_addition_measure.measure_type).toBe("DATA_ADDITION");
    expect(data_addition_measure.priority).toBe("HIGH");
    expect(data_addition_measure.implementation_items).toContain(
      "不足データの特定"
    );
    expect(data_addition_measure.implementation_items).toContain(
      "データ追加方法の提示"
    );

    // 品質検査対策の存在確認
    const quality_check_measure = result.countermeasures.find(
      (m) => m.measure_type === "QUALITY_CHECK"
    );
    expect(quality_check_measure).toBeDefined();
    expect(quality_check_measure.measure_type).toBe("QUALITY_CHECK");
    expect(quality_check_measure.priority).toBe("HIGH");
    expect(quality_check_measure.implementation_items).toContain(
      "検査基準の定義"
    );
    expect(quality_check_measure.implementation_items).toContain(
      "検査実施方法の提示"
    );

    // データ追加対策の詳細検証
    expect(data_addition_measure.target_regions).toEqual(["Kanto", "Kansai"]);
    expect(data_addition_measure.target_work_types).toEqual([
      "Foundation",
      "Reinforcement",
    ]);
    expect(data_addition_measure.required_data_count).toBe(35);
    expect(data_addition_measure.implementation_deadline).toBe("2024-02-14");
    expect(data_addition_measure.responsible_person_id).toBe("EVL-2024-100");

    // 品質検査対策の詳細検証
    expect(quality_check_measure.check_criteria).toBeDefined();
    expect(quality_check_measure.check_criteria.duplicate_rate_threshold).toBe(
      0.05
    );
    expect(quality_check_measure.check_criteria.anomaly_rate_threshold).toBe(
      0.1
    );
    expect(quality_check_measure.check_criteria.missing_rate_threshold).toBe(
      0.08
    );
    expect(quality_check_measure.implementation_deadline).toBe("2024-02-21");
    expect(quality_check_measure.responsible_person_id).toBe("EVL-2024-100");

    // 原因分析結果の確認
    expect(result.root_cause_judgment).toBe("DATA_QUALITY_LOW");
    expect(result.data_quality_score).toBe(65);

    // 全体的な対策計画の検証
    expect(result.total_measures).toBe(2);
    expect(result.overall_priority).toBe("HIGH");
    expect(result.plan_saved).toBe(true);
    expect(result.saved_timestamp).toBeDefined();

    // 対策計画の一意性を検証
    const measure_types = result.countermeasures.map((m) => m.measure_type);
    expect(new Set(measure_types).size).toBe(measure_types.length);

    // 実施期限の整合性を検証
    const deadline_date_addition = new Date(
      data_addition_measure.implementation_deadline
    );
    const deadline_date_quality = new Date(
      quality_check_measure.implementation_deadline
    );
    expect(deadline_date_quality.getTime()).toBeGreaterThan(
      deadline_date_addition.getTime()
    );
  });
});