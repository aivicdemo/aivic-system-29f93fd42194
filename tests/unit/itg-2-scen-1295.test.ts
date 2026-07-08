import { describe, test, expect, beforeEach } from "@jest/globals";
import { aggregatePrecisionIndicators } from "../../src/logic/it-6-2-1-1";

const fetchMock = require("jest-fetch-mock");

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1295
  test("評価対象の過去案件データが存在しない場合、エラーを返す", async () => {
    const evaluationTargetId = "eval_target_nonexistent_001";
    const pastCaseDataId = "past_case_data_not_found";

    fetchMock.mockResponseOnce(
      JSON.stringify({
        error: "指定された評価対象の過去案件データが見つかりません",
        evaluationTargetId: evaluationTargetId,
        pastCaseDataId: pastCaseDataId,
        statusCode: 404,
      }),
      { status: 404 }
    );

    const result = await aggregatePrecisionIndicators({
      evaluationTargetId: evaluationTargetId,
      pastCaseDataId: pastCaseDataId,
      includeRegion: true,
      includeConstructionType: true,
      includeAmountRange: true,
    });

    expect(result.statusCode).toBe(404);
    expect(result.error).toMatch(/過去案件データ/);
    expect(result.evaluationTargetId).toBe(evaluationTargetId);
  });
});