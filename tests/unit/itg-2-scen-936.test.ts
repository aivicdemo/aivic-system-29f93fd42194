import { aggregateAccuracyByAssessor } from "../../src/logic/it-6-2-1-1";

describe("IT-6-2-1-1: 査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-936: AI判定精度が閾値を下回ったとき、学習データ不足箇所が正確に特定される", () => {
    // ========================================
    // 1. テスト用の査定データセット準備
    // ========================================
    const assessment_records = [
      {
        assessor_id: "A001",
        work_type: "土木工事",
        amount_band: "1000万～5000万",
        estimation_id: "EST001",
        estimated_amount: 2500,
        reference_data_count: 8,
        ai_judgment_accuracy: 78,
        timestamp: "2024-01-15T10:00:00Z",
      },
      {
        assessor_id: "A001",
        work_type: "建築工事",
        amount_band: "1000万～5000万",
        estimation_id: "EST002",
        estimated_amount: 3200,
        reference_data_count: 5,
        ai_judgment_accuracy: 72,
        timestamp: "2024-01-15T11:00:00Z",
      },
      {
        assessor_id: "A002",
        work_type: "土木工事",
        amount_band: "5000万超",
        estimation_id: "EST003",
        estimated_amount: 7800,
        reference_data_count: 3,
        ai_judgment_accuracy: 68,
        timestamp: "2024-01-15T12:00:00Z",
      },
      {
        assessor_id: "A002",
        work_type: "機械工事",
        amount_band: "500万～1000万",
        estimation_id: "EST004",
        estimated_amount: 800,
        reference_data_count: 2,
        ai_judgment_accuracy: 65,
        timestamp: "2024-01-15T13:00:00Z",
      },
      {
        assessor_id: "A003",
        work_type: "建築工事",
        amount_band: "100万～500万",
        estimation_id: "EST005",
        estimated_amount: 350,
        reference_data_count: 15,
        ai_judgment_accuracy: 88,
        timestamp: "2024-01-15T14:00:00Z",
      },
    ];

    // ========================================
    // 2. 精度低下の閾値設定と診断パラメータ
    // ========================================
    const accuracy_threshold = 85;
    const min_reference_data_threshold = 10;

    // ========================================
    // 3. 診断実行: aggregateAccuracyByAssessor 関数を呼び出す
    // ========================================
    const diagnostic_result = aggregateAccuracyByAssessor({
      assessment_records,
      accuracy_threshold,
      min_reference_data_threshold,
    });

    // ========================================
    // 4. 期待結果の検証
    // ========================================

    // (1) 精度低下の主要原因として学習データ不足が識別されていることを確認
    expect(diagnostic_result.primary_cause).toBe("insufficient_learning_data");

    // (2) 具体的な不足箇所（品目カテゴリ、査定タイプ等）が明記されていることを確認
    expect(diagnostic_result.insufficient_areas).toBeDefined();
    expect(Array.isArray(diagnostic_result.insufficient_areas)).toBe(true);
    expect(diagnostic_result.insufficient_areas.length).toBeGreaterThan(0);

    // 各不足箇所が正しい構造を持つことを確認
    diagnostic_result.insufficient_areas.forEach((area) => {
      expect(area).toHaveProperty("work_type");
      expect(area).toHaveProperty("amount_band");
      expect(area).toHaveProperty("current_accuracy");
      expect(area).toHaveProperty("reference_data_count");
      expect(area).toHaveProperty("recommended_supplement_count");
      expect(area).toHaveProperty("priority_rank");
    });

    // (3) 各不足箇所について推奨補充件数が提示されていることを確認
    // 最も精度の低い領域: 機械工事・500万～1000万（精度: 65%, 参照データ: 2）
    const machine_work_area = diagnostic_result.insufficient_areas.find(
      (area) => area.work_type === "機械工事" && area.amount_band === "500万～1000万"
    );
    expect(machine_work_area).toBeDefined();
    expect(machine_work_area!.recommended_supplement_count).toBe(8);

    // 土木工事・5000万超（精度: 68%, 参照データ: 3）
    const civil_large_area = diagnostic_result.insufficient_areas.find(
      (area) => area.work_type === "土木工事" && area.amount_band === "5000万超"
    );
    expect(civil_large_area).toBeDefined();
    expect(civil_large_area!.recommended_supplement_count).toBe(7);

    // 建築工事・1000万～5000万（精度: 72%, 参照データ: 5）
    const building_mid_area = diagnostic_result.insufficient_areas.find(
      (area) => area.work_type === "建築工事" && area.amount_band === "1000万～5000万"
    );
    expect(building_mid_area).toBeDefined();
    expect(building_mid_area!.recommended_supplement_count).toBe(5);

    // (4) 複数の不足箇所がある場合は優先度順に表示されていることを確認
    // 優先度は精度低下度が大きいほど高く、参照データが少ないほど高くなる
    expect(diagnostic_result.insufficient_areas[0].priority_rank).toBe(1);
    expect(diagnostic_result.insufficient_areas[0].work_type).toBe("機械工事");

    expect(diagnostic_result.insufficient_areas[1].priority_rank).toBe(2);
    expect(diagnostic_result.insufficient_areas[1].work_type).toBe("土木工事");

    expect(diagnostic_result.insufficient_areas[2].priority_rank).toBe(3);
    expect(diagnostic_result.insufficient_areas[2].work_type).toBe("建築工事");

    // ========================================
    // 5. 追加の検証
    // ========================================

    // 閾値を超過していない項目（建築工事・100万～500万、精度: 88%）は不足箇所に含まれないことを確認
    const normal_area = diagnostic_result.insufficient_areas.find(
      (area) => area.work_type === "建築工事" && area.amount_band === "100万～500万"
    );
    expect(normal_area).toBeUndefined();

    // 診断結果全体の構造が正しいことを確認
    expect(diagnostic_result).toHaveProperty("primary_cause");
    expect(diagnostic_result).toHaveProperty("insufficient_areas");
    expect(diagnostic_result).toHaveProperty("total_areas_below_threshold");
    expect(diagnostic_result).toHaveProperty("overall_accuracy_average");
    expect(diagnostic_result).toHaveProperty("diagnosis_timestamp");

    // 全体精度平均が正しく計算されていることを確認
    // (78 + 72 + 68 + 65 + 88) / 5 = 371 / 5 = 74.2
    expect(diagnostic_result.overall_accuracy_average).toBe(74.2);

    // 閾値以下の領域数が正しく計算されていることを確認
    expect(diagnostic_result.total_areas_below_threshold).toBe(4);

    // 診断タイムスタンプが ISO 8601 形式であることを確認
    expect(diagnostic_result.diagnosis_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
  });
});