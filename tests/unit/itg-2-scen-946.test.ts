import { aggregateMonthlyAssessmentPrecisionByDemographics } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-946: [edge] 月次繁忙度レベル自動分類機能 - 複数の月の件数が完全に同一の場合、分類が正しく実行される
  test("複数月の査定件数が完全に同一の場合、繁忙度レベルが正しく分類される", () => {
    const identical_assessment_counts = [
      {
        month: "2024-01",
        assessment_count: 100,
        assessor_id: "A001",
        work_type: "土木",
        amount_band: "1000万～5000万",
      },
      {
        month: "2024-02",
        assessment_count: 100,
        assessor_id: "A001",
        work_type: "土木",
        amount_band: "1000万～5000万",
      },
      {
        month: "2024-03",
        assessment_count: 100,
        assessor_id: "A001",
        work_type: "土木",
        amount_band: "1000万～5000万",
      },
    ];

    const result = aggregateMonthlyAssessmentPrecisionByDemographics(
      identical_assessment_counts
    );

    // 全ての月が同一件数（100件）であるため、すべての月が同じ繁忙度レベルに分類されるべき
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);

    // 各月の分類結果の検証
    expect(result.length).toBe(3);

    // 同一件数の月間では同じ繁忙度レベルが割り当てられることを確認
    const busyness_levels = result.map((item) => item.busyness_level);
    expect(busyness_levels[0]).toBe(busyness_levels[1]);
    expect(busyness_levels[1]).toBe(busyness_levels[2]);

    // 各月のデータ構造の完全性を検証
    result.forEach((item) => {
      expect(item).toHaveProperty("month");
      expect(item).toHaveProperty("assessment_count");
      expect(item).toHaveProperty("assessor_id");
      expect(item).toHaveProperty("work_type");
      expect(item).toHaveProperty("amount_band");
      expect(item).toHaveProperty("busyness_level");
      expect(item).toHaveProperty("ranking_position");

      expect(typeof item.month).toBe("string");
      expect(typeof item.assessment_count).toBe("number");
      expect(typeof item.assessor_id).toBe("string");
      expect(typeof item.work_type).toBe("string");
      expect(typeof item.amount_band).toBe("string");
      expect(typeof item.busyness_level).toBe("string");
      expect(typeof item.ranking_position).toBe("number");
    });

    // 同一件数では同じランキング順位が割り当てられることを確認
    const ranking_positions = result.map((item) => item.ranking_position);
    expect(ranking_positions[0]).toBe(ranking_positions[1]);
    expect(ranking_positions[1]).toBe(ranking_positions[2]);

    // 査定件数が保持されていることを確認
    result.forEach((item) => {
      expect(item.assessment_count).toBe(100);
    });

    // エラーが発生していないこと、かつ予期されたロジックに従って実行されていることを検証
    expect(result.every((item) => item.busyness_level !== null)).toBe(true);
  });
});