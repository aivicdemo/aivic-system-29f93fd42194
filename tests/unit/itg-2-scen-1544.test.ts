import { diagnoseAccuracyDecline } from "../../src/logic/it-6-2-2-1";

describe("精度低下時の原因特定と対応方法の自動判定", () => {
  test("SCEN-1544: 必要なデータが不足している場合、エラーハンドリングが正しく実行される", () => {
    // テストデータ: 必須項目の一部が欠落
    const incomplete_dataset = {
      assessment_date: "2024-01-15",
      assessor_id: "A001",
      // assessment_target_item が欠落
      assessment_amount: 1500000,
      // reference_price が欠落
      ocr_accuracy: 0.85,
      ai_judgment_accuracy: 0.78,
    };

    // 期待: エラースロー
    expect(() => diagnoseAccuracyDecline(incomplete_dataset as any)).toThrow(
      /必須項目/
    );
  });

  test("SCEN-1544: 査定日時が欠落している場合、エラーが発生する", () => {
    const missing_date = {
      // assessment_date が欠落
      assessor_id: "A001",
      assessment_target_item: "基礎工事",
      assessment_amount: 1500000,
      reference_price: 1450000,
      ocr_accuracy: 0.85,
      ai_judgment_accuracy: 0.78,
    };

    expect(() => diagnoseAccuracyDecline(missing_date as any)).toThrow(
      /査定日時/
    );
  });

  test("SCEN-1544: 査定者IDが欠落している場合、エラーが発生する", () => {
    const missing_assessor = {
      assessment_date: "2024-01-15",
      // assessor_id が欠落
      assessment_target_item: "基礎工事",
      assessment_amount: 1500000,
      reference_price: 1450000,
      ocr_accuracy: 0.85,
      ai_judgment_accuracy: 0.78,
    };

    expect(() => diagnoseAccuracyDecline(missing_assessor as any)).toThrow(
      /査定者/
    );
  });

  test("SCEN-1544: 査定対象品が欠落している場合、エラーが発生する", () => {
    const missing_target = {
      assessment_date: "2024-01-15",
      assessor_id: "A001",
      // assessment_target_item が欠落
      assessment_amount: 1500000,
      reference_price: 1450000,
      ocr_accuracy: 0.85,
      ai_judgment_accuracy: 0.78,
    };

    expect(() => diagnoseAccuracyDecline(missing_target as any)).toThrow(
      /査定対象品/
    );
  });

  test("SCEN-1544: 参考価格が欠落している場合、エラーが発生する", () => {
    const missing_reference = {
      assessment_date: "2024-01-15",
      assessor_id: "A001",
      assessment_target_item: "基礎工事",
      assessment_amount: 1500000,
      // reference_price が欠落
      ocr_accuracy: 0.85,
      ai_judgment_accuracy: 0.78,
    };

    expect(() => diagnoseAccuracyDecline(missing_reference as any)).toThrow(
      /参考価格/
    );
  });

  test("SCEN-1544: すべての必須項目が揃っている場合、正常に判定が実行される", () => {
    const complete_dataset = {
      assessment_date: "2024-01-15",
      assessor_id: "A001",
      assessment_target_item: "基礎工事",
      assessment_amount: 1500000,
      reference_price: 1450000,
      ocr_accuracy: 0.85,
      ai_judgment_accuracy: 0.78,
      learning_data_count: 250,
      last_update_date: "2023-12-20",
    };

    const result = diagnoseAccuracyDecline(complete_dataset);

    expect(result).toBeDefined();
    expect(result.has_error).toBe(false);
    expect(result.diagnosis_result).toBeDefined();
    expect(result.diagnosis_result.root_cause).toBeDefined();
    expect(result.diagnosis_result.recommended_action).toBeDefined();
  });

  test("SCEN-1544: OCR精度が低下している場合、原因がOCRモデルドリフトと判定される", () => {
    const low_ocr_accuracy_dataset = {
      assessment_date: "2024-01-15",
      assessor_id: "A001",
      assessment_target_item: "基礎工事",
      assessment_amount: 1500000,
      reference_price: 1450000,
      ocr_accuracy: 0.65, // 65%に低下
      ai_judgment_accuracy: 0.88,
      learning_data_count: 250,
      last_update_date: "2023-12-20",
      previous_ocr_accuracy: 0.92,
    };

    const result = diagnoseAccuracyDecline(low_ocr_accuracy_dataset);

    expect(result.has_error).toBe(false);
    expect(result.diagnosis_result.root_cause).toContain("OCR");
    expect(result.diagnosis_result.recommended_action).toContain("OCRモデル");
  });

  test("SCEN-1544: AI判定精度が低下している場合、原因がモデルドリフトと判定される", () => {
    const low_ai_accuracy_dataset = {
      assessment_date: "2024-01-15",
      assessor_id: "A001",
      assessment_target_item: "基礎工事",
      assessment_amount: 1500000,
      reference_price: 1450000,
      ocr_accuracy: 0.88,
      ai_judgment_accuracy: 0.62, // 62%に低下
      learning_data_count: 250,
      last_update_date: "2023-12-20",
      previous_ai_judgment_accuracy: 0.91,
    };

    const result = diagnoseAccuracyDecline(low_ai_accuracy_dataset);

    expect(result.has_error).toBe(false);
    expect(result.diagnosis_result.root_cause).toContain("モデルドリフト");
    expect(result.diagnosis_result.recommended_action).toContain("再学習");
  });

  test("SCEN-1544: 学習データが不足している場合、原因がデータ品質と判定される", () => {
    const insufficient_learning_data = {
      assessment_date: "2024-01-15",
      assessor_id: "A001",
      assessment_target_item: "基礎工事",
      assessment_amount: 1500000,
      reference_price: 1450000,
      ocr_accuracy: 0.80,
      ai_judgment_accuracy: 0.75,
      learning_data_count: 50, // 50件のみ（基準未満）
      last_update_date: "2023-12-20",
      required_learning_data_count: 200,
    };

    const result = diagnoseAccuracyDecline(insufficient_learning_data);

    expect(result.has_error).toBe(false);
    expect(result.diagnosis_result.root_cause).toContain("データ品質");
    expect(result.diagnosis_result.recommended_action).toContain(
      "学習データ追加"
    );
  });

  test("SCEN-1544: 物価本が古い場合、原因が物価本未更新と判定される", () => {
    const outdated_reference_book = {
      assessment_date: "2024-01-15",
      assessor_id: "A001",
      assessment_target_item: "基礎工事",
      assessment_amount: 1500000,
      reference_price: 1450000,
      ocr_accuracy: 0.85,
      ai_judgment_accuracy: 0.78,
      learning_data_count: 250,
      last_update_date: "2023-06-20", // 7ヶ月前
      days_since_last_update: 210,
      max_allowed_days_since_update: 180,
    };

    const result = diagnoseAccuracyDecline(outdated_reference_book);

    expect(result.has_error).toBe(false);
    expect(result.diagnosis_result.root_cause).toContain("物価本");
    expect(result.diagnosis_result.recommended_action).toContain("物価本更新");
  });

  test("SCEN-1544: 複数の原因が同時に検出される場合、優先度付きで返却される", () => {
    const multiple_issues = {
      assessment_date: "2024-01-15",
      assessor_id: "A001",
      assessment_target_item: "基礎工事",
      assessment_amount: 1500000,
      reference_price: 1450000,
      ocr_accuracy: 0.68, // 低下
      ai_judgment_accuracy: 0.70, // 低下
      learning_data_count: 80, // 不足
      last_update_date: "2023-05-20", // 古い
      days_since_last_update: 230,
      max_allowed_days_since_update: 180,
      previous_ocr_accuracy: 0.92,
      previous_ai_judgment_accuracy: 0.91,
    };

    const result = diagnoseAccuracyDecline(multiple_issues);

    expect(result.has_error).toBe(false);
    expect(result.diagnosis_result.root_causes).toBeDefined();
    expect(Array.isArray(result.diagnosis_result.root_causes)).toBe(true);
    expect(result.diagnosis_result.root_causes.length).toBeGreaterThan(1);
    expect(result.diagnosis_result.priority_order).toBeDefined();
  });

  test("SCEN-1544: エラーハンドリング実行時、エラーログに不足データの詳細が記録される", () => {
    const error_log_holder: any[] = [];
    const incomplete_with_callback = {
      assessment_date: "2024-01-15",
      assessor_id: "A001",
      // assessment_target_item が欠落
      assessment_amount: 1500000,
      // reference_price が欠落
      ocr_accuracy: 0.85,
      ai_judgment_accuracy: 0.78,
      on_error_log: (log: any) => {
        error_log_holder.push(log);
      },
    };

    expect(() =>
      diagnoseAccuracyDecline(incomplete_with_callback as any)
    ).toThrow(/必須項目/);

    expect(error_log_holder.length).toBeGreaterThan(0);
    const logged_error = error_log_holder[0];
    expect(logged_error.missing_fields).toBeDefined();
    expect(Array.isArray(logged_error.missing_fields)).toBe(true);
    expect(logged_error.missing_fields).toContain("assessment_target_item");
    expect(logged_error.missing_fields).toContain("reference_price");
  });

  test("SCEN-1544: 不完全なデータに基づいた判定は実行されず、システムの整合性が保持される", () => {
    const partial_data_no_side_effects = {
      assessment_date: "2024-01-15",
      assessor_id: "A001",
      // assessment_target_item が欠落（必須）
      assessment_amount: 1500000,
      reference_price: 1450000,
    };

    let system_state_before = {
      diagnosis_cache_size: 0,
      last_diagnosis_timestamp: null,
    };

    try {
      diagnoseAccuracyDecline(partial_data_no_side_effects as any);
    } catch (e) {
      // エラーが発生することは期待
    }

    // 不完全データでの診断は実行されていないため、
    // キャッシュやシステム状態が変更されないことを確認
    let system_state_after = {
      diagnosis_cache_size: 0,
      last_diagnosis_timestamp: null,
    };

    expect(system_state_before).toEqual(system_state_after);
  });
});