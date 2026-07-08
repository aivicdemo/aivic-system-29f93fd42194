import { measureComparisonFormatAccuracy } from "../../src/logic/it-6-2-1-1";

describe("他部署フォーマット相場判定精度測定", () => {
  test("SCEN-1368: AI相場判定結果が出力されず精度測定を開始した場合に入力データ不足エラーを返す", () => {
    const input = {
      aiJudgmentResults: null,
      testDatasetSize: 100,
      referenceDatasetSize: 50,
    };

    expect(() => measureComparisonFormatAccuracy(input)).toThrow(
      /AI相場判定結果/
    );
  });
});