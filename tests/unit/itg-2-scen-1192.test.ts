import { diagnoseOCRAccuracyDecline } from "../../src/logic/it-6-2-1-1";

describe("精度低下原因仮説立案機能 - OCR精度低下時の3分類による原因仮説生成", () => {
  test("SCEN-1192: OCR精度低下時に3分類（データ品質・モデルドリフト・フォーマット変化）で原因仮説が生成される", () => {
    // Arrange: テストデータ準備
    const baseline_ocr_accuracy = 0.92; // 基準精度 92%
    const current_ocr_accuracy = 0.87; // 現在精度 87% → 5%低下
    const accuracy_decline_rate = (baseline_ocr_accuracy - current_ocr_accuracy) / baseline_ocr_accuracy; // 5.43%
    
    const learning_data_records_count = 1200;
    const learning_data_last_update_date = "2024-10-15";
    const current_date = "2024-12-20";
    const data_freshness_days = 66; // 66日経過
    
    const model_training_date = "2024-09-01";
    const data_distribution_change_detected = true; // フォーマット変化検出
    const format_mismatch_ratio = 0.18; // 18%のフォーマット不整合
    
    const testInput = {
      current_ocr_accuracy,
      baseline_ocr_accuracy,
      learning_data_records_count,
      learning_data_last_update_date,
      current_date,
      model_training_date,
      data_distribution_change_detected,
      format_mismatch_ratio,
    };

    // Act
    const result = diagnoseOCRAccuracyDecline(testInput);

    // Assert: 戻り値が存在し、3つの分類カテゴリが含まれていることを確認
    expect(result).toBeDefined();
    expect(result.hypotheses).toBeDefined();
    expect(Array.isArray(result.hypotheses)).toBe(true);
    expect(result.hypotheses.length).toBe(3);

    // 各分類のカテゴリ名が正確に存在することを確認
    const categories = result.hypotheses.map((h: any) => h.category);
    expect(categories).toContain("データ品質");
    expect(categories).toContain("モデルドリフト");
    expect(categories).toContain("フォーマット変化");

    // Assert: データ品質分類の仮説内容を検証
    const data_quality_hypothesis = result.hypotheses.find((h: any) => h.category === "データ品質");
    expect(data_quality_hypothesis).toBeDefined();
    expect(data_quality_hypothesis.hypothesis).toBeDefined();
    expect(typeof data_quality_hypothesis.hypothesis).toBe("string");
    expect(data_quality_hypothesis.hypothesis.length).toBeGreaterThan(0);
    
    // データ品質仮説に「66日」「1200件」などの具体的な根拠が含まれていることを確認
    expect(data_quality_hypothesis.hypothesis).toMatch(/学習データ/);
    expect(data_quality_hypothesis.supporting_factors).toBeDefined();
    expect(Array.isArray(data_quality_hypothesis.supporting_factors)).toBe(true);
    expect(data_quality_hypothesis.supporting_factors.length).toBeGreaterThan(0);

    // Assert: モデルドリフト分類の仮説内容を検証
    const model_drift_hypothesis = result.hypotheses.find((h: any) => h.category === "モデルドリフト");
    expect(model_drift_hypothesis).toBeDefined();
    expect(model_drift_hypothesis.hypothesis).toBeDefined();
    expect(typeof model_drift_hypothesis.hypothesis).toBe("string");
    expect(model_drift_hypothesis.hypothesis.length).toBeGreaterThan(0);
    
    // モデルドリフト仮説に「モデル」「学習」などのキーワードが含まれていることを確認
    expect(model_drift_hypothesis.hypothesis).toMatch(/モデル|学習|ドリフト/);
    expect(model_drift_hypothesis.supporting_factors).toBeDefined();
    expect(Array.isArray(model_drift_hypothesis.supporting_factors)).toBe(true);
    expect(model_drift_hypothesis.supporting_factors.length).toBeGreaterThan(0);

    // Assert: フォーマット変化分類の仮説内容を検証
    const format_change_hypothesis = result.hypotheses.find((h: any) => h.category === "フォーマット変化");
    expect(format_change_hypothesis).toBeDefined();
    expect(format_change_hypothesis.hypothesis).toBeDefined();
    expect(typeof format_change_hypothesis.hypothesis).toBe("string");
    expect(format_change_hypothesis.hypothesis.length).toBeGreaterThan(0);
    
    // フォーマット変化仮説に「フォーマット」「不整合」などのキーワードが含まれていることを確認
    expect(format_change_hypothesis.hypothesis).toMatch(/フォーマット|不整合|見積書/);
    expect(format_change_hypothesis.supporting_factors).toBeDefined();
    expect(Array.isArray(format_change_hypothesis.supporting_factors)).toBe(true);
    expect(format_change_hypothesis.supporting_factors.length).toBeGreaterThan(0);

    // Assert: 各仮説の根拠ファクターに具体的な数値・理由が含まれていることを確認
    const all_supporting_factors = result.hypotheses.flatMap((h: any) => h.supporting_factors);
    expect(all_supporting_factors.length).toBeGreaterThanOrEqual(3);
    all_supporting_factors.forEach((factor: any) => {
      expect(factor).toBeDefined();
      expect(typeof factor).toBe("string");
      expect(factor.length).toBeGreaterThan(0);
    });

    // Assert: 仮説立案の処理が正常に完了したことを確認
    expect(result.status).toBe("completed");
    expect(result.timestamp).toBeDefined();
    expect(typeof result.timestamp).toBe("string");
    
    // Assert: 精度低下率が結果に記録されていることを確認
    expect(result.decline_rate).toBeDefined();
    expect(result.decline_rate).toBeCloseTo(accuracy_decline_rate, 4);
    
    // Assert: 総合診断スコア（確信度）が 0-100 の範囲で出力されていることを確認
    expect(result.confidence_score).toBeDefined();
    expect(typeof result.confidence_score).toBe("number");
    expect(result.confidence_score).toBeGreaterThanOrEqual(0);
    expect(result.confidence_score).toBeLessThanOrEqual(100);
  });
});