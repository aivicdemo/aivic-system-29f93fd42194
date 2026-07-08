import { describe, test, expect } from "@jest/globals";
import { calculateAssessorPrecisionMetrics } from "../../src/logic/it-6-2-1-1";

describe("査定員別判定精度指標の自動集計と可視化", () => {
  test("SCEN-1061: 判定結果データが存在しない場合に精度計算がエラーを返す", () => {
    const input = {
      assessor_id: "ASS-0001",
      assessor_name: "山田太郎",
      judgment_results: [],
      period_start: "2024-01-01",
      period_end: "2024-01-31",
    };

    expect(() => calculateAssessorPrecisionMetrics(input)).toThrow(/判定結果データ/);
  });
});