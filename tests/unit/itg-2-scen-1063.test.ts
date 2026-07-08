import { calculateJudgmentAccuracyDifference } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-1063: 経験者と新人の判定精度差が正しく計算される（精度差が20%以上の場合）", () => {
    // 経験者査定員のテストデータ：正判定数 / 総判定数
    // 経験者：80件中72件正判定 → 精度 90%
    const experienced_assessor_data = {
      assessor_id: "EXP001",
      assessor_type: "experienced",
      total_judgments: 80,
      correct_judgments: 72,
      region: "Tokyo",
      construction_type: "concrete_work",
      amount_range: "5000000_10000000",
    };

    // 新人査定員のテストデータ：正判定数 / 総判定数
    // 新人：80件中60件正判定 → 精度 75%
    const novice_assessor_data = {
      assessor_id: "NOV001",
      assessor_type: "novice",
      total_judgments: 80,
      correct_judgments: 60,
      region: "Tokyo",
      construction_type: "concrete_work",
      amount_range: "5000000_10000000",
    };

    // 経験者の判定精度を計算：72 / 80 = 0.9 (90%)
    const experienced_accuracy =
      experienced_assessor_data.correct_judgments /
      experienced_assessor_data.total_judgments;
    expect(experienced_accuracy).toBe(0.9);

    // 新人の判定精度を計算：60 / 80 = 0.75 (75%)
    const novice_accuracy =
      novice_assessor_data.correct_judgments /
      novice_assessor_data.total_judgments;
    expect(novice_accuracy).toBe(0.75);

    // 精度差を計算：0.9 - 0.75 = 0.15 (15%)
    // ※この時点ではまだ20%以上ではないので、新人データを再調整
    // 新人を50件中35件正判定に変更 → 精度 70%
    const novice_assessor_data_adjusted = {
      assessor_id: "NOV001",
      assessor_type: "novice",
      total_judgments: 80,
      correct_judgments: 50,
      region: "Tokyo",
      construction_type: "concrete_work",
      amount_range: "5000000_10000000",
    };

    const novice_accuracy_adjusted =
      novice_assessor_data_adjusted.correct_judgments /
      novice_assessor_data_adjusted.total_judgments;
    expect(novice_accuracy_adjusted).toBe(0.625);

    // 調整後の精度差：0.9 - 0.625 = 0.275 (27.5%) → 20%以上
    const accuracy_difference = experienced_accuracy - novice_accuracy_adjusted;
    expect(accuracy_difference).toBe(0.275);
    expect(accuracy_difference).toBeGreaterThanOrEqual(0.2);

    // 判定精度差分析機能を実行
    const result = calculateJudgmentAccuracyDifference({
      experienced_data: experienced_assessor_data,
      novice_data: novice_assessor_data_adjusted,
    });

    // 結果が正しく計算されているか検証
    expect(result).toEqual({
      experienced_accuracy_percentage: 90,
      novice_accuracy_percentage: 62.5,
      accuracy_difference_percentage: 27.5,
      difference_level: "high",
      divergence_patterns: [
        {
          pattern_name: "high_accuracy_gap",
          pattern_code: "PAT_001",
          region: "Tokyo",
          construction_type: "concrete_work",
          amount_range: "5000000_10000000",
          assessment_count: 80,
          accuracy_gap_percentage: 27.5,
          root_causes: [
            "experience_difference",
            "skill_gap",
            "judgment_standard_deviation",
          ],
          improvement_priority: "high",
          recommended_actions: [
            "one_on_one_coaching",
            "standard_training",
            "judgment_criteria_alignment",
          ],
        },
      ],
      summary: {
        total_assessors_compared: 2,
        high_difference_detected: true,
        analysis_region: "Tokyo",
        analysis_construction_type: "concrete_work",
        analysis_amount_range: "5000000_10000000",
        generated_timestamp: "2024-01-15T09:30:00Z",
      },
    });

    // 20%以上の精度差がある場合、乖離パターンが正しく分類されているか確認
    expect(result.difference_level).toBe("high");
    expect(result.divergence_patterns).toHaveLength(1);
    expect(result.divergence_patterns[0].accuracy_gap_percentage).toBe(27.5);
    expect(result.divergence_patterns[0].pattern_code).toBe("PAT_001");

    // 乖離パターン内の根本原因が正しく識別されているか確認
    expect(result.divergence_patterns[0].root_causes).toContain(
      "experience_difference"
    );
    expect(result.divergence_patterns[0].root_causes).toContain("skill_gap");
    expect(
      result.divergence_patterns[0].root_causes
    ).toContain("judgment_standard_deviation");

    // 改善推奨アクションが適切に提案されているか確認
    expect(result.divergence_patterns[0].recommended_actions).toContain(
      "one_on_one_coaching"
    );
    expect(result.divergence_patterns[0].recommended_actions).toContain(
      "standard_training"
    );
    expect(
      result.divergence_patterns[0].recommended_actions
    ).toContain("judgment_criteria_alignment");

    // 改善優先度が「高」に正しく設定されているか確認
    expect(result.divergence_patterns[0].improvement_priority).toBe("high");

    // サマリー情報が正しく出力されているか確認
    expect(result.summary.total_assessors_compared).toBe(2);
    expect(result.summary.high_difference_detected).toBe(true);
    expect(result.summary.analysis_region).toBe("Tokyo");
    expect(result.summary.analysis_construction_type).toBe("concrete_work");
    expect(result.summary.analysis_amount_range).toBe("5000000_10000000");
  });
});