import { calculateModelUpdateAccuracyImprovement } from "../../src/logic/it-6-2-2-1";

describe("モデル更新前後精度計測 - 学習データ更新による精度改善の記録と検証", () => {
  test("SCEN-1167: 学習データ更新後のOCR精度とAI判定精度が更新前比で改善し、改善度が正の値として算出される", () => {
    // ベースライン値（モデル更新前）の精度
    const baseline_ocr_accuracy = 0.82; // 82%
    const baseline_ai_judgment_accuracy = 0.78; // 78%

    // モデル更新後の精度（改善した値）
    const updated_ocr_accuracy = 0.89; // 89%
    const updated_ai_judgment_accuracy = 0.86; // 86%

    // モデル更新の詳細情報
    const model_update_input = {
      baseline_metrics: {
        ocr_accuracy: baseline_ocr_accuracy,
        ai_judgment_accuracy: baseline_ai_judgment_accuracy,
        measurement_timestamp: "2024-01-15T10:00:00Z",
      },
      updated_metrics: {
        ocr_accuracy: updated_ocr_accuracy,
        ai_judgment_accuracy: updated_ai_judgment_accuracy,
        measurement_timestamp: "2024-01-15T14:30:00Z",
      },
      training_data_update: {
        past_project_data_added_count: 150,
        material_price_book_version: "2024Q1",
        regional_data_added: 5,
        seasonal_classification_added: 2,
      },
    };

    // 関数を実行
    const result = calculateModelUpdateAccuracyImprovement(model_update_input);

    // OCR精度の改善度を計算: 更新後 - 更新前 = 0.89 - 0.82 = 0.07
    const expected_ocr_improvement = 0.07;

    // AI判定精度の改善度を計算: 更新後 - 更新前 = 0.86 - 0.78 = 0.08
    const expected_ai_judgment_improvement = 0.08;

    // 改善度が正の値であることを確認
    expect(result.ocr_accuracy_improvement).toBe(expected_ocr_improvement);
    expect(result.ai_judgment_accuracy_improvement).toBe(
      expected_ai_judgment_improvement
    );

    // 改善度がシステムに正しく記録されていることを確認
    expect(result.improvement_degree_positive).toBe(true);
    expect(result.ocr_accuracy_improvement > 0).toBe(true);
    expect(result.ai_judgment_accuracy_improvement > 0).toBe(true);

    // 結果オブジェクトの構造が正確であることを確認
    expect(result).toEqual({
      baseline_ocr_accuracy: baseline_ocr_accuracy,
      baseline_ai_judgment_accuracy: baseline_ai_judgment_accuracy,
      updated_ocr_accuracy: updated_ocr_accuracy,
      updated_ai_judgment_accuracy: updated_ai_judgment_accuracy,
      ocr_accuracy_improvement: expected_ocr_improvement,
      ai_judgment_accuracy_improvement: expected_ai_judgment_improvement,
      improvement_degree_positive: true,
      improvement_percentage_ocr: 8.53, // (0.07 / 0.82) * 100 ≈ 8.54%
      improvement_percentage_ai_judgment: 10.26, // (0.08 / 0.78) * 100 ≈ 10.26%
      training_data_update_details: {
        past_project_data_added_count: 150,
        material_price_book_version: "2024Q1",
        regional_data_added: 5,
        seasonal_classification_added: 2,
      },
      record_timestamp: expect.any(String),
      model_update_status: "success",
    });

    // 改善度の記録が成功していることを確認
    expect(result.model_update_status).toBe("success");
    expect(result.record_timestamp).toBeDefined();

    // 改善度の数値が妥当な範囲（0～1.0の間）であることを確認
    expect(result.ocr_accuracy_improvement).toBeGreaterThan(0);
    expect(result.ocr_accuracy_improvement).toBeLessThan(1.0);
    expect(result.ai_judgment_accuracy_improvement).toBeGreaterThan(0);
    expect(result.ai_judgment_accuracy_improvement).toBeLessThan(1.0);

    // 改善率の算出が正確であることを確認（小数点第2位までの近似値）
    const expected_ocr_improvement_percentage = Math.round(
      (expected_ocr_improvement / baseline_ocr_accuracy) * 10000
    ) / 100;
    const expected_ai_judgment_improvement_percentage = Math.round(
      (expected_ai_judgment_improvement / baseline_ai_judgment_accuracy) *
        10000
    ) / 100;

    expect(
      Math.abs(
        result.improvement_percentage_ocr -
          expected_ocr_improvement_percentage
      )
    ).toBeLessThan(0.1);
    expect(
      Math.abs(
        result.improvement_percentage_ai_judgment -
          expected_ai_judgment_improvement_percentage
      )
    ).toBeLessThan(0.1);
  });
});