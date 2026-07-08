import { classifyLearningDataUpdateTrigger } from "../../src/logic/it-6-2-2-1";

describe("査定員別・案件別の判定ロジック・乖離パターン履歴の記録・抽出機能", () => {
  test("SCEN-1121: 学習データ更新トリガー自動判定機能 - 物価本版数変更・季節変動・地域追加を判定基準として認識し更新トリガーを分類できる", () => {
    // テストケース 1: 物価本版数変更のみを含むトリガーデータ
    const trigger_price_book_change = {
      trigger_id: "TRG001",
      trigger_type: "price_book_version_change",
      price_book_previous_version: "2024_Q1_v1.0",
      price_book_new_version: "2024_Q2_v1.1",
      seasonal_variation_detected: false,
      new_regions_added: [],
      detected_at: new Date("2024-04-15T09:00:00Z"),
    };

    const result_price_book = classifyLearningDataUpdateTrigger(
      trigger_price_book_change
    );

    expect(result_price_book.trigger_id).toBe("TRG001");
    expect(result_price_book.trigger_type).toBe("price_book_version_change");
    expect(result_price_book.classification).toBe("price_book_update");
    expect(result_price_book.priority_rank).toBe("high");
    expect(result_price_book.update_categories).toContain(
      "price_book_version_change"
    );
    expect(result_price_book.update_categories).not.toContain(
      "seasonal_variation"
    );
    expect(result_price_book.update_categories).not.toContain("region_addition");
    expect(result_price_book.recognized_criteria_count).toBe(1);

    // テストケース 2: 季節変動を含むトリガーデータ
    const trigger_seasonal_variation = {
      trigger_id: "TRG002",
      trigger_type: "seasonal_variation_detected",
      price_book_previous_version: "2024_Q1_v1.0",
      price_book_new_version: "2024_Q1_v1.0",
      seasonal_variation_detected: true,
      seasonal_variation_regions: ["東京", "大阪", "名古屋"],
      seasonal_variation_period: "Q2_2024",
      new_regions_added: [],
      detected_at: new Date("2024-04-20T14:30:00Z"),
    };

    const result_seasonal = classifyLearningDataUpdateTrigger(
      trigger_seasonal_variation
    );

    expect(result_seasonal.trigger_id).toBe("TRG002");
    expect(result_seasonal.trigger_type).toBe("seasonal_variation_detected");
    expect(result_seasonal.classification).toBe("seasonal_update");
    expect(result_seasonal.priority_rank).toBe("medium");
    expect(result_seasonal.update_categories).toContain("seasonal_variation");
    expect(result_seasonal.update_categories).not.toContain(
      "price_book_version_change"
    );
    expect(result_seasonal.update_categories).not.toContain("region_addition");
    expect(result_seasonal.recognized_criteria_count).toBe(1);
    expect(result_seasonal.affected_regions_count).toBe(3);

    // テストケース 3: 地域追加を含むトリガーデータ
    const trigger_region_addition = {
      trigger_id: "TRG003",
      trigger_type: "region_addition",
      price_book_previous_version: "2024_Q1_v1.0",
      price_book_new_version: "2024_Q1_v1.0",
      seasonal_variation_detected: false,
      new_regions_added: ["福岡", "札幌", "広島"],
      new_regions_market_data_ready: true,
      detected_at: new Date("2024-05-10T11:15:00Z"),
    };

    const result_region = classifyLearningDataUpdateTrigger(
      trigger_region_addition
    );

    expect(result_region.trigger_id).toBe("TRG003");
    expect(result_region.trigger_type).toBe("region_addition");
    expect(result_region.classification).toBe("region_expansion_update");
    expect(result_region.priority_rank).toBe("medium");
    expect(result_region.update_categories).toContain("region_addition");
    expect(result_region.update_categories).not.toContain(
      "price_book_version_change"
    );
    expect(result_region.update_categories).not.toContain("seasonal_variation");
    expect(result_region.recognized_criteria_count).toBe(1);
    expect(result_region.new_regions_count).toBe(3);

    // テストケース 4: 複数の判定基準を同時に含むトリガーデータ
    const trigger_combined = {
      trigger_id: "TRG004",
      trigger_type: "combined_triggers",
      price_book_previous_version: "2024_Q1_v1.0",
      price_book_new_version: "2024_Q2_v1.2",
      seasonal_variation_detected: true,
      seasonal_variation_regions: ["東京", "大阪"],
      seasonal_variation_period: "Q2_2024",
      new_regions_added: ["福岡", "札幌"],
      new_regions_market_data_ready: true,
      detected_at: new Date("2024-05-15T10:00:00Z"),
    };

    const result_combined =
      classifyLearningDataUpdateTrigger(trigger_combined);

    expect(result_combined.trigger_id).toBe("TRG004");
    expect(result_combined.trigger_type).toBe("combined_triggers");
    expect(result_combined.classification).toBe("comprehensive_update");
    expect(result_combined.priority_rank).toBe("high");
    expect(result_combined.update_categories).toContain(
      "price_book_version_change"
    );
    expect(result_combined.update_categories).toContain("seasonal_variation");
    expect(result_combined.update_categories).toContain("region_addition");
    expect(result_combined.recognized_criteria_count).toBe(3);
    expect(result_combined.affected_regions_count).toBe(2);
    expect(result_combined.new_regions_count).toBe(2);
    expect(result_combined.total_affected_regions_count).toBe(4);

    // テストケース 5: 複合トリガーの詳細検証
    expect(result_combined.requires_model_retraining).toBe(true);
    expect(result_combined.estimated_learning_data_volume).toBe(
      "large_volume_required"
    );
    expect(result_combined.recommended_implementation_days).toBe(7);
  });
});