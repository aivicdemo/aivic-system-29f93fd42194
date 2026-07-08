import { compareModelPrecisionBeforeAfter } from "../../src/logic/it-1-br-2-2-2-1";

describe("モデル更新前後精度比較・可視化機能", () => {
  test("SCEN-870: 更新前後のデータソースが異なる場合、比較処理がエラーを返す", () => {
    const beforeModelData = {
      modelVersion: "v1.0",
      trainingDate: "2024-01-01T00:00:00Z",
      dataSource: "datasource_A",
      ocrAccuracy: 92.5,
      judgmentAccuracy: 88.3,
      sampleSize: 5000,
    };

    const afterModelData = {
      modelVersion: "v2.0",
      trainingDate: "2024-02-01T00:00:00Z",
      dataSource: "datasource_B",
      ocrAccuracy: 93.1,
      judgmentAccuracy: 89.7,
      sampleSize: 5200,
    };

    expect(() =>
      compareModelPrecisionBeforeAfter(beforeModelData, afterModelData)
    ).toThrow(/データソース/);
  });
});