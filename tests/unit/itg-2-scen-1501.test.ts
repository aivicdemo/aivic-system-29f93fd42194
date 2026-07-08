import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import fetchMock from "jest-fetch-mock";
import { calculateJudgmentAccuracyByAssignee } from "../../src/logic/it-6-2-1-1";

fetchMock.enableMocks();

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1501: [error] AI判定精度検証機能 - 検証データセットが存在しない場合、精度検証が実行されずエラーが返される
  test("should throw error when validation dataset is not found during AI judgment accuracy verification", async () => {
    const request = {
      assigneeId: "EMP001",
      constructionType: "建築工事",
      amountBand: "100万～500万",
      validationDatasetId: "",
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 400,
        errorCode: "VALIDATION_DATASET_NOT_FOUND",
        message: "検証データセットが見つかりません",
      }),
      { status: 400 }
    );

    await expect(() =>
      calculateJudgmentAccuracyByAssignee(request)
    ).toThrow(/検証データセット/);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});