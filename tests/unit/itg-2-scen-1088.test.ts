import { determineTrainingDataNecessity } from "../../src/logic/it-1-br-6-2-1";

describe("学習データ必要性判定機能", () => {
  test("SCEN-1088: OCR精度が閾値以下に低下した場合、学習データ更新の必要性が正常に判定される", () => {
    const ocr_accuracy_threshold = 95;
    const current_ocr_accuracy_normal = 96;
    const current_ocr_accuracy_degraded = 92;

    const result_normal = determineTrainingDataNecessity({
      current_ocr_accuracy: current_ocr_accuracy_normal,
      ocr_accuracy_threshold: ocr_accuracy_threshold,
    });

    expect(result_normal.requires_update).toBe(false);
    expect(result_normal.update_reason).toBe("");

    const result_degraded = determineTrainingDataNecessity({
      current_ocr_accuracy: current_ocr_accuracy_degraded,
      ocr_accuracy_threshold: ocr_accuracy_threshold,
    });

    expect(result_degraded.requires_update).toBe(true);
    expect(result_degraded.update_reason).toBe("OCR精度低下による学習データ更新が必要");
    expect(typeof result_degraded.detection_timestamp).toBe("string");

    const result_at_threshold = determineTrainingDataNecessity({
      current_ocr_accuracy: ocr_accuracy_threshold,
      ocr_accuracy_threshold: ocr_accuracy_threshold,
    });

    expect(result_at_threshold.requires_update).toBe(false);

    const result_below_threshold = determineTrainingDataNecessity({
      current_ocr_accuracy: ocr_accuracy_threshold - 0.1,
      ocr_accuracy_threshold: ocr_accuracy_threshold,
    });

    expect(result_below_threshold.requires_update).toBe(true);
    expect(result_below_threshold.update_reason).toBe("OCR精度低下による学習データ更新が必要");

    expect(() =>
      determineTrainingDataNecessity({
        current_ocr_accuracy: -5,
        ocr_accuracy_threshold: ocr_accuracy_threshold,
      })
    ).toThrow(/精度値/);

    expect(() =>
      determineTrainingDataNecessity({
        current_ocr_accuracy: 105,
        ocr_accuracy_threshold: ocr_accuracy_threshold,
      })
    ).toThrow(/精度値/);

    expect(() =>
      determineTrainingDataNecessity({
        current_ocr_accuracy: current_ocr_accuracy_degraded,
        ocr_accuracy_threshold: -10,
      })
    ).toThrow(/閾値/);
  });
});