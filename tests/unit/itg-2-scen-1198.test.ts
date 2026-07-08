import { analyzeCorrelationWithLearningDataUpdates } from "../../src/logic/it-6-2-2-1";

describe("学習データ更新履歴との相関分析機能", () => {
  test("SCEN-1198: 学習データ変更イベントが存在しない期間における精度低下は他原因に分類される", () => {
    // テストデータ: 学習データ更新イベントが存在しない期間
    const learningDataUpdateEvents = [
      {
        event_id: "LDU_001",
        update_type: "past_project_data_addition",
        update_date: "2024-01-15",
        affected_regions: ["Tokyo"],
        affected_construction_types: ["Foundation"],
      },
      {
        event_id: "LDU_002",
        update_type: "price_book_version_update",
        update_date: "2024-02-20",
        affected_regions: ["Osaka"],
        affected_construction_types: ["Structural"],
      },
    ];

    // テストデータ: 学習データ更新イベントが存在しない期間での精度低下シナリオ
    // 2024-03-01 ～ 2024-03-10: 更新イベントなし
    // この期間でOCR精度が低下: 85% → 78%、判定精度が低下: 82% → 75%
    const precisionMetrics = [
      {
        measurement_date: "2024-02-28",
        ocr_accuracy: 85.5,
        judgment_accuracy: 82.3,
        sample_count: 150,
      },
      {
        measurement_date: "2024-03-05",
        ocr_accuracy: 78.2,
        judgment_accuracy: 75.1,
        sample_count: 145,
      },
      {
        measurement_date: "2024-03-10",
        ocr_accuracy: 77.8,
        judgment_accuracy: 74.6,
        sample_count: 148,
      },
    ];

    // 相関分析を実行
    const analysisResult = analyzeCorrelationWithLearningDataUpdates({
      learningDataUpdateEvents,
      precisionMetrics,
      analysis_period_start: "2024-03-01",
      analysis_period_end: "2024-03-10",
      correlation_threshold: 0.5,
    });

    // 検証1: 精度低下が検出されているか確認
    expect(analysisResult.precision_decline_detected).toBe(true);

    // 検証2: 精度低下の期間が正しく特定されているか確認
    expect(analysisResult.decline_start_date).toBe("2024-03-05");
    expect(analysisResult.decline_magnitude_ocr_percent).toBe(-7.3);
    expect(analysisResult.decline_magnitude_judgment_percent).toBe(-7.2);

    // 検証3: 学習データ更新との相関が有意でないことを確認
    expect(analysisResult.correlation_with_learning_data_updates).toBeLessThan(0.5);

    // 検証4: 精度低下が学習データ変更以外の原因として分類されているか確認
    expect(analysisResult.root_cause_classification).not.toBe("learning_data_update");

    // 検証5: 代替原因が適切に提示されているか確認
    expect(analysisResult.alternative_causes).toContain("model_drift");
    expect(
      analysisResult.alternative_causes.length
    ).toBeGreaterThanOrEqual(1);

    // 検証6: 代替原因カテゴリが妥当であるか確認
    // 妥当な原因カテゴリ: model_drift, external_factors, data_distribution_shift等
    const valid_cause_categories = [
      "model_drift",
      "external_factors",
      "data_distribution_shift",
      "format_change",
      "seasonal_variation",
    ];
    analysisResult.alternative_causes.forEach((cause: string) => {
      expect(valid_cause_categories).toContain(cause);
    });

    // 検証7: 相関係数が計算されて記録されているか確認
    expect(analysisResult.correlation_coefficient).toBeDefined();
    expect(typeof analysisResult.correlation_coefficient).toBe("number");
    expect(
      analysisResult.correlation_coefficient
    ).toBeLessThanOrEqual(1);
    expect(analysisResult.correlation_coefficient).toBeGreaterThanOrEqual(-1);

    // 検証8: 統計的有意性の判定結果を確認
    expect(analysisResult.is_correlation_significant).toBe(false);

    // 検証9: 分析結果の信頼度スコアが適切な範囲内か確認
    expect(analysisResult.analysis_confidence_score).toBeGreaterThan(0);
    expect(analysisResult.analysis_confidence_score).toBeLessThanOrEqual(100);

    // 検証10: 推奨アクション（モデル再学習ではなく、他の対応）が提示されているか確認
    expect(analysisResult.recommended_action).not.toBe("model_retraining_required");
    expect(
      ["model_monitoring", "data_quality_check", "external_factor_investigation"]
    ).toContain(analysisResult.recommended_action);

    // 検証11: 学習データ更新との関連性スコアが低いことを確認
    expect(analysisResult.learning_data_relevance_score).toBeLessThan(0.3);

    // 検証12: 分析期間内に更新イベントが存在しないことを確認
    const updates_in_period = learningDataUpdateEvents.filter(
      (event) =>
        event.update_date >= "2024-03-01" &&
        event.update_date <= "2024-03-10"
    );
    expect(updates_in_period.length).toBe(0);

    // 検証13: 分析結果の履歴記録フラグが立てられているか確認
    expect(analysisResult.recorded_to_history).toBe(true);

    // 検証14: 精度低下の開始タイミングが更新イベント後ではないことを確認
    const latest_update_before_period = learningDataUpdateEvents.filter(
      (event) => event.update_date < "2024-03-01"
    );
    expect(latest_update_before_period.length).toBeGreaterThan(0);
    const last_update_date = latest_update_before_period.sort((a, b) =>
      b.update_date.localeCompare(a.update_date)
    )[0].update_date;
    expect(analysisResult.decline_start_date).not.toBe(last_update_date);
  });
});