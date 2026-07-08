import { calculateConsensusScore } from "../../src/logic/it-6-2-1-1";

describe("査定員間判定一致度計算機能", () => {
  // SCEN-850
  test("全査定員の判定が完全一致した場合に一致度スコア100%と算出される", () => {
    const assessment_date = new Date("2024-01-15T09:00:00Z");
    const assessor_1_id = "assessor_001";
    const assessor_2_id = "assessor_002";
    const assessor_3_id = "assessor_003";
    const item_id = "item_20240115_001";
    const quality_rank = "A";
    const price_band = "100000-150000";
    const condition_evaluation = "excellent";

    const assessor_judgments = [
      {
        assessor_id: assessor_1_id,
        assessment_date: assessment_date,
        item_id: item_id,
        quality_rank: quality_rank,
        price_band: price_band,
        condition_evaluation: condition_evaluation,
      },
      {
        assessor_id: assessor_2_id,
        assessment_date: assessment_date,
        item_id: item_id,
        quality_rank: quality_rank,
        price_band: price_band,
        condition_evaluation: condition_evaluation,
      },
      {
        assessor_id: assessor_3_id,
        assessment_date: assessment_date,
        item_id: item_id,
        quality_rank: quality_rank,
        price_band: price_band,
        condition_evaluation: condition_evaluation,
      },
    ];

    const result = calculateConsensusScore(assessor_judgments);

    expect(result.consensus_score).toBe(100);
    expect(result.consensus_percentage).toBe("100%");
    expect(result.all_items_match).toBe(true);
    expect(result.matched_dimensions).toEqual([
      "quality_rank",
      "price_band",
      "condition_evaluation",
    ]);
    expect(result.total_assessors).toBe(3);
    expect(result.consensus_calculation_log).toContain(
      "全判定項目が一致しています"
    );
  });
});