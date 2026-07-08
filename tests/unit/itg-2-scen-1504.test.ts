import { calculatePrecisionImprovement } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1504
  test("改善前データが存在しない場合、差分計算ができずエラーが返される", () => {
    const after_ocr_accuracy = 92.5;
    const after_ai_judgment_accuracy = 88.3;
    const before_ocr_accuracy = null;
    const before_ai_judgment_accuracy = null;

    expect(() =>
      calculatePrecisionImprovement({
        before_ocr_accuracy,
        before_ai_judgment_accuracy,
        after_ocr_accuracy,
        after_ai_judgment_accuracy,
      })
    ).toThrow(/改善前データ/);
  });
});