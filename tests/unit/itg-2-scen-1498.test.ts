import { validateDataSplitRatio } from "../../src/logic/it-6-2-2-1";

describe("学習データ分割・モデル学習機能", () => {
  // SCEN-1498: [error] 学習データ分割・モデル学習機能 - 指定された分割比率の合計が100%を超える場合、バリデーションエラーが返される
  test("分割比率の合計が100%を超える場合、バリデーションエラーが返される", () => {
    const trainingRatio = 60;
    const validationRatio = 30;
    const testRatio = 15;

    expect(() =>
      validateDataSplitRatio({
        trainingRatio,
        validationRatio,
        testRatio,
      })
    ).toThrow(/分割比率|100%/);
  });
});