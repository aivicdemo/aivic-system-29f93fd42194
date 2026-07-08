import { calculateModelRegressionApproval } from "../../src/logic/it-6-2-1-1";

describe("モデル更新回帰テスト精度判定機能", () => {
  // SCEN-1449: [normal] モデル更新回帰テスト精度判定機能 - 更新前後のOCR精度・AI判定精度を計測し、精度低下がない場合に本番適用承認判定が出される
  test("更新前後のOCR精度・AI判定精度を比較し、精度低下がない場合に本番適用承認判定が『承認』として出力される", () => {
    // 入力: 更新前OCR精度（基準値）、更新後OCR精度、更新前AI判定精度（基準値）、更新後AI判定精度
    const pre_update_ocr_accuracy = 92.5;
    const post_update_ocr_accuracy = 93.8;
    const pre_update_ai_judgment_accuracy = 88.3;
    const post_update_ai_judgment_accuracy = 89.7;
    const model_version_id = "model_v2_20240115";
    const test_dataset_size = 500;
    const evaluation_date = "2024-01-15T10:30:00Z";

    const result = calculateModelRegressionApproval({
      pre_update_ocr_accuracy,
      post_update_ocr_accuracy,
      pre_update_ai_judgment_accuracy,
      post_update_ai_judgment_accuracy,
      model_version_id,
      test_dataset_size,
      evaluation_date,
    });

    // 期待結果: 更新後のOCR精度 >= 更新前のOCR精度、かつ更新後のAI判定精度 >= 更新前のAI判定精度の場合、承認判定が『承認』
    expect(result.approval_status).toBe("承認");
    expect(result.ocr_accuracy_improvement).toBe(1.3);
    expect(result.ai_judgment_accuracy_improvement).toBe(1.4);
    expect(result.regression_test_passed).toBe(true);
    expect(result.model_version_id).toBe("model_v2_20240115");
    expect(result.evaluation_date).toBe("2024-01-15T10:30:00Z");
    expect(result.recommendation).toBe("本番環境への適用を承認します");
  });

  test("更新後のOCR精度が更新前以下である場合に本番適用承認判定が『却下』として出力される", () => {
    const pre_update_ocr_accuracy = 92.5;
    const post_update_ocr_accuracy = 91.8;
    const pre_update_ai_judgment_accuracy = 88.3;
    const post_update_ai_judgment_accuracy = 89.7;
    const model_version_id = "model_v2_20240115";
    const test_dataset_size = 500;
    const evaluation_date = "2024-01-15T10:30:00Z";

    const result = calculateModelRegressionApproval({
      pre_update_ocr_accuracy,
      post_update_ocr_accuracy,
      pre_update_ai_judgment_accuracy,
      post_update_ai_judgment_accuracy,
      model_version_id,
      test_dataset_size,
      evaluation_date,
    });

    expect(result.approval_status).toBe("却下");
    expect(result.ocr_accuracy_improvement).toBe(-0.7);
    expect(result.regression_test_passed).toBe(false);
    expect(result.recommendation).toMatch(/精度低下/);
  });

  test("更新後のAI判定精度が更新前以下である場合に本番適用承認判定が『却下』として出力される", () => {
    const pre_update_ocr_accuracy = 92.5;
    const post_update_ocr_accuracy = 93.8;
    const pre_update_ai_judgment_accuracy = 88.3;
    const post_update_ai_judgment_accuracy = 87.9;
    const model_version_id = "model_v2_20240115";
    const test_dataset_size = 500;
    const evaluation_date = "2024-01-15T10:30:00Z";

    const result = calculateModelRegressionApproval({
      pre_update_ocr_accuracy,
      post_update_ocr_accuracy,
      pre_update_ai_judgment_accuracy,
      post_update_ai_judgment_accuracy,
      model_version_id,
      test_dataset_size,
      evaluation_date,
    });

    expect(result.approval_status).toBe("却下");
    expect(result.ai_judgment_accuracy_improvement).toBe(-0.4);
    expect(result.regression_test_passed).toBe(false);
  });

  test("更新前後のOCR精度とAI判定精度が同一である場合に本番適用承認判定が『承認』として出力される", () => {
    const pre_update_ocr_accuracy = 92.5;
    const post_update_ocr_accuracy = 92.5;
    const pre_update_ai_judgment_accuracy = 88.3;
    const post_update_ai_judgment_accuracy = 88.3;
    const model_version_id = "model_v2_20240115";
    const test_dataset_size = 500;
    const evaluation_date = "2024-01-15T10:30:00Z";

    const result = calculateModelRegressionApproval({
      pre_update_ocr_accuracy,
      post_update_ocr_accuracy,
      pre_update_ai_judgment_accuracy,
      post_update_ai_judgment_accuracy,
      model_version_id,
      test_dataset_size,
      evaluation_date,
    });

    expect(result.approval_status).toBe("承認");
    expect(result.ocr_accuracy_improvement).toBe(0);
    expect(result.ai_judgment_accuracy_improvement).toBe(0);
    expect(result.regression_test_passed).toBe(true);
  });

  test("両方の精度が低下する場合に本番適用承認判定が『却下』として出力される", () => {
    const pre_update_ocr_accuracy = 92.5;
    const post_update_ocr_accuracy = 91.2;
    const pre_update_ai_judgment_accuracy = 88.3;
    const post_update_ai_judgment_accuracy = 86.9;
    const model_version_id = "model_v2_20240115";
    const test_dataset_size = 500;
    const evaluation_date = "2024-01-15T10:30:00Z";

    const result = calculateModelRegressionApproval({
      pre_update_ocr_accuracy,
      post_update_ocr_accuracy,
      pre_update_ai_judgment_accuracy,
      post_update_ai_judgment_accuracy,
      model_version_id,
      test_dataset_size,
      evaluation_date,
    });

    expect(result.approval_status).toBe("却下");
    expect(result.regression_test_passed).toBe(false);
    expect(result.ocr_accuracy_improvement).toBe(-1.3);
    expect(result.ai_judgment_accuracy_improvement).toBe(-1.4);
  });

  test("精度差が小数点以下の値である場合に正確に計測される", () => {
    const pre_update_ocr_accuracy = 92.456;
    const post_update_ocr_accuracy = 92.789;
    const pre_update_ai_judgment_accuracy = 88.234;
    const post_update_ai_judgment_accuracy = 88.567;
    const model_version_id = "model_v2_20240115";
    const test_dataset_size = 500;
    const evaluation_date = "2024-01-15T10:30:00Z";

    const result = calculateModelRegressionApproval({
      pre_update_ocr_accuracy,
      post_update_ocr_accuracy,
      pre_update_ai_judgment_accuracy,
      post_update_ai_judgment_accuracy,
      model_version_id,
      test_dataset_size,
      evaluation_date,
    });

    expect(result.approval_status).toBe("承認");
    expect(result.ocr_accuracy_improvement).toBeCloseTo(0.333, 2);
    expect(result.ai_judgment_accuracy_improvement).toBeCloseTo(0.333, 2);
    expect(result.regression_test_passed).toBe(true);
  });
});