import { describe, test, expect, beforeEach } from "@jest/globals";
import { measureBaselineAccuracy, compareAccuracyBeforeAfter } from "../../src/logic/it-6-3-1";

describe("モデル更新前後精度計測・比較機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1120
  test("ベースライン測定データが不在の場合にエラーを適切に通知する", () => {
    const input_model_update_id = "MODEL_UPD_20240115_001";
    const input_measurement_timestamp = "2024-01-15T14:30:00Z";
    const input_user_id = "USR_001";

    expect(() =>
      compareAccuracyBeforeAfter({
        model_update_id: input_model_update_id,
        measurement_timestamp: input_measurement_timestamp,
        user_id: input_user_id,
        baseline_ocr_accuracy: undefined,
        baseline_ai_judgment_accuracy: undefined,
        post_update_ocr_accuracy: 0.82,
        post_update_ai_judgment_accuracy: 0.75,
      })
    ).toThrow(/ベースラインデータ/);
  });
});