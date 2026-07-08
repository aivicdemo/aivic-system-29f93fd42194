import {
  evaluateModelRetrainingNeed,
} from "../../src/logic/it-1-br-6-2-1";

describe("モデル再学習実行判定基準の定義", () => {
  // SCEN-1539
  test("新しい物価本公開時に精度低下の許容度が正しく評価される", () => {
    // 前提条件: 現在のモデルの基準精度が記録されている
    const baseline_ocr_accuracy = 92.5; // 現在のOCR読取精度 92.5%
    const baseline_judgment_accuracy = 88.3; // 現在のAI判定精度 88.3%

    // 新しい物価本取り込み後の精度測定値
    const post_update_ocr_accuracy = 91.2; // 新物価本取り込み後のOCR精度 91.2%
    const post_update_judgment_accuracy = 86.8; // 新物価本取り込み後のAI判定精度 86.8%

    // 事前に定義された許容度基準
    const tolerance_threshold_percent = 3.0; // 許容度: 3.0%ポイント以下

    // 精度低下度の計算（事前にシステム内で計算される）
    const ocr_accuracy_decline = baseline_ocr_accuracy - post_update_ocr_accuracy; // 92.5 - 91.2 = 1.3%ポイント
    const judgment_accuracy_decline =
      baseline_judgment_accuracy - post_update_judgment_accuracy; // 88.3 - 86.8 = 1.5%ポイント

    // テスト対象: モデル再学習実行判定基準の定義
    const result = evaluateModelRetrainingNeed({
      baseline_ocr_accuracy,
      baseline_judgment_accuracy,
      post_update_ocr_accuracy,
      post_update_judgment_accuracy,
      tolerance_threshold_percent,
    });

    // 期待結果 1: 精度低下度が正確に計算される
    expect(result.ocr_decline_percentage).toBe(1.3);
    expect(result.judgment_decline_percentage).toBe(1.5);

    // 期待結果 2: 最大低下度（より大きい値）が判定基準として選定される
    expect(result.max_decline_percentage).toBe(1.5);

    // 期待結果 3: 許容度評価ルールに基づいて再学習要否が正しく判定される
    // 最大低下度 1.5%ポイント < 許容度閾値 3.0%ポイント → 再学習不要
    expect(result.retraining_required).toBe(false);

    // 期待結果 4: 判定根拠データが正確に記録される
    expect(result.judgment_basis).toEqual({
      evaluation_metric: "max_decline_percentage",
      measured_value: 1.5,
      threshold_value: 3.0,
      comparison_result: "within_tolerance",
    });

    // 期待結果 5: 判定結果ログが生成される
    expect(result.evaluation_log).toEqual({
      timestamp: expect.any(String),
      model_update_trigger: "new_price_book_published",
      baseline_metrics: {
        ocr_accuracy: 92.5,
        judgment_accuracy: 88.3,
      },
      post_update_metrics: {
        ocr_accuracy: 91.2,
        judgment_accuracy: 86.8,
      },
      accuracy_decline_analysis: {
        ocr_decline: 1.3,
        judgment_decline: 1.5,
        max_decline: 1.5,
      },
      tolerance_evaluation: {
        threshold: 3.0,
        result: "within_tolerance",
        retraining_decision: "not_required",
      },
    });
  });

  // 追加 test: 許容度超過時の判定
  test("精度低下度が許容度を超える場合は再学習必要と判定される", () => {
    const baseline_ocr_accuracy = 92.5;
    const baseline_judgment_accuracy = 88.3;

    // 精度が大幅に低下した場合
    const post_update_ocr_accuracy = 87.8; // 4.7%ポイント低下
    const post_update_judgment_accuracy = 83.1; // 5.2%ポイント低下

    const tolerance_threshold_percent = 3.0; // 許容度 3.0%ポイント

    const result = evaluateModelRetrainingNeed({
      baseline_ocr_accuracy,
      baseline_judgment_accuracy,
      post_update_ocr_accuracy,
      post_update_judgment_accuracy,
      tolerance_threshold_percent,
    });

    // 精度低下度が計算される
    expect(result.ocr_decline_percentage).toBe(4.7);
    expect(result.judgment_decline_percentage).toBe(5.2);

    // 最大低下度が 5.2%ポイント
    expect(result.max_decline_percentage).toBe(5.2);

    // 最大低下度 5.2%ポイント > 許容度閾値 3.0%ポイント → 再学習必要
    expect(result.retraining_required).toBe(true);

    expect(result.judgment_basis).toEqual({
      evaluation_metric: "max_decline_percentage",
      measured_value: 5.2,
      threshold_value: 3.0,
      comparison_result: "exceeds_tolerance",
    });

    expect(result.evaluation_log.tolerance_evaluation.result).toBe(
      "exceeds_tolerance"
    );
    expect(result.evaluation_log.tolerance_evaluation.retraining_decision).toBe(
      "required"
    );
  });

  // 追加 test: 精度がちょうど許容度の境界値時の判定
  test("精度低下度がちょうど許容度の境界値の場合は再学習不要と判定される", () => {
    const baseline_ocr_accuracy = 92.5;
    const baseline_judgment_accuracy = 88.3;

    // 精度低下がちょうど許容度と同じ
    const post_update_ocr_accuracy = 89.5; // 3.0%ポイント低下
    const post_update_judgment_accuracy = 88.3; // 0%ポイント低下

    const tolerance_threshold_percent = 3.0;

    const result = evaluateModelRetrainingNeed({
      baseline_ocr_accuracy,
      baseline_judgment_accuracy,
      post_update_ocr_accuracy,
      post_update_judgment_accuracy,
      tolerance_threshold_percent,
    });

    expect(result.ocr_decline_percentage).toBe(3.0);
    expect(result.judgment_decline_percentage).toBe(0);
    expect(result.max_decline_percentage).toBe(3.0);

    // 最大低下度 3.0%ポイント = 許容度閾値 3.0%ポイント → 許容以内
    expect(result.retraining_required).toBe(false);

    expect(result.judgment_basis.comparison_result).toBe("within_tolerance");
  });

  // 追加 test: 精度が向上した場合の判定
  test("精度が向上した場合は再学習不要と判定される", () => {
    const baseline_ocr_accuracy = 92.5;
    const baseline_judgment_accuracy = 88.3;

    // 新しい物価本によって精度が向上
    const post_update_ocr_accuracy = 94.1; // 1.6%ポイント向上
    const post_update_judgment_accuracy = 90.2; // 1.9%ポイント向上

    const tolerance_threshold_percent = 3.0;

    const result = evaluateModelRetrainingNeed({
      baseline_ocr_accuracy,
      baseline_judgment_accuracy,
      post_update_ocr_accuracy,
      post_update_judgment_accuracy,
      tolerance_threshold_percent,
    });

    expect(result.ocr_decline_percentage).toBe(-1.6); // 負の値 = 向上
    expect(result.judgment_decline_percentage).toBe(-1.9);
    expect(result.max_decline_percentage).toBe(0); // 向上の場合は最大低下度として 0 とする

    // 精度向上した場合は再学習不要
    expect(result.retraining_required).toBe(false);

    expect(result.judgment_basis.comparison_result).toBe("within_tolerance");
  });

  // 追加 test: 許容度評価ルールが一貫性を持つ
  test("複数の許容度閾値に対して評価ルールが一貫性を持つ", () => {
    const baseline_ocr_accuracy = 92.5;
    const baseline_judgment_accuracy = 88.3;
    const post_update_ocr_accuracy = 89.5; // 3.0%ポイント低下
    const post_update_judgment_accuracy = 84.8; // 3.5%ポイント低下

    // 許容度を複数の値でテスト
    // ケース 1: 許容度 2.0%ポイント（低い）
    const result_low_tolerance = evaluateModelRetrainingNeed({
      baseline_ocr_accuracy,
      baseline_judgment_accuracy,
      post_update_ocr_accuracy,
      post_update_judgment_accuracy,
      tolerance_threshold_percent: 2.0,
    });

    // 最大低下度 3.5% > 許容度 2.0% → 再学習必要
    expect(result_low_tolerance.retraining_required).toBe(true);

    // ケース 2: 許容度 4.0%ポイント（高い）
    const result_high_tolerance = evaluateModelRetrainingNeed({
      baseline_ocr_accuracy,
      baseline_judgment_accuracy,
      post_update_ocr_accuracy,
      post_update_judgment_accuracy,
      tolerance_threshold_percent: 4.0,
    });

    // 最大低下度 3.5% < 許容度 4.0% → 再学習不要
    expect(result_high_tolerance.retraining_required).toBe(false);
  });

  // 追加 test: エラーハンドリング - 無効な入力値
  test("許容度値が負の値の場合エラーを投げる", () => {
    expect(() =>
      evaluateModelRetrainingNeed({
        baseline_ocr_accuracy: 92.5,
        baseline_judgment_accuracy: 88.3,
        post_update_ocr_accuracy: 91.2,
        post_update_judgment_accuracy: 86.8,
        tolerance_threshold_percent: -1.0, // 無効な許容度
      })
    ).toThrow(/許容度/);
  });

  // 追加 test: エラーハンドリング - 基準精度が不合理な値
  test("基準OCR精度が100%を超える場合エラーを投げる", () => {
    expect(() =>
      evaluateModelRetrainingNeed({
        baseline_ocr_accuracy: 105.0, // 無効な精度値
        baseline_judgment_accuracy: 88.3,
        post_update_ocr_accuracy: 91.2,
        post_update_judgment_accuracy: 86.8,
        tolerance_threshold_percent: 3.0,
      })
    ).toThrow(/OCR精度/);
  });

  // 追加 test: エラーハンドリング - 基準精度が負の値
  test("基準判定精度が負の値の場合エラーを投げる", () => {
    expect(() =>
      evaluateModelRetrainingNeed({
        baseline_ocr_accuracy: 92.5,
        baseline_judgment_accuracy: -5.0, // 無効な精度値
        post_update_ocr_accuracy: 91.2,
        post_update_judgment_accuracy: 86.8,
        tolerance_threshold_percent: 3.0,
      })
    ).toThrow(/判定精度/);
  });
});