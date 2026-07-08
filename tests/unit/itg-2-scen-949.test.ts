import { calculateAssessorProductivityIndex } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-949: 処理記録データが存在しない査定員の場合、エラーが返される", () => {
    const assessor_id = "ASSESSOR_NOT_FOUND_001";
    const processing_records: Array<{
      assessor_id: string;
      processing_time_minutes: number;
      judgment_accuracy_rate: number;
      construction_type: string;
      amount_band: string;
    }> = [];

    expect(() =>
      calculateAssessorProductivityIndex({
        assessor_id,
        processing_records,
      })
    ).toThrow(/処理記録/);
  });
});