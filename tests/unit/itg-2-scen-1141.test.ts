import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { calculateAccuracyImprovement } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1141
  test("ベースライン値が未測定の状態での改善度計算をエラーで拒否する", () => {
    const input = {
      assessor_id: "ASS001",
      work_type: "鉄骨工事",
      amount_band: "500万以上1000万未満",
      baseline_ocr_accuracy: null,
      baseline_judgment_accuracy: null,
      current_ocr_accuracy: 0.85,
      current_judgment_accuracy: 0.88,
      measurement_date: "2024-02-15T14:30:00Z",
    };

    expect(() => calculateAccuracyImprovement(input)).toThrow(/ベースライン値/);
  });
});