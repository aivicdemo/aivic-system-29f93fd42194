import { assessLearningDataUpdateTriggerPriority } from "../../src/logic/it-1-br-2-2-2-1";

describe("学習データ更新トリガー自動判定機能", () => {
  // SCEN-1122: [normal] 学習データ更新トリガー自動判定機能 - 検知されたトリガーの優先度を自動判定し記録できる
  test("複数のトリガーイベントに対して優先度を自動判定し、結果を正確に記録する", () => {
    const triggerEvents = [
      {
        trigger_id: "T001",
        trigger_type: "price_volatility",
        region: "Tokyo",
        product_category: "excavator",
        price_change_rate: 8.5,
        data_age_days: 35,
        confidence_score: 0.92,
        detected_at: "2024-01-15T09:30:00Z",
      },
      {
        trigger_id: "T002",
        trigger_type: "market_trend_change",
        region: "Osaka",
        product_category: "concrete",
        trend_shift_magnitude: 0.15,
        affected_records_count: 245,
        data_age_days: 60,
        confidence_score: 0.88,
        detected_at: "2024-01-15T10:15:00Z",
      },
      {
        trigger_id: "T003",
        trigger_type: "category_structure_change",
        region: "Nagoya",
        product_category: "labor",
        structural_impact_level: 0.45,
        affected_transaction_count: 89,
        data_age_days: 45,
        confidence_score: 0.85,
        detected_at: "2024-01-15T11:00:00Z",
      },
      {
        trigger_id: "T004",
        trigger_type: "seasonal_pattern_detection",
        region: "Tokyo",
        product_category: "excavator",
        seasonal_magnitude: 0.22,
        pattern_confidence: 0.91,
        data_age_days: 25,
        confidence_score: 0.94,
        detected_at: "2024-01-15T11:45:00Z",
      },
      {
        trigger_id: "T005",
        trigger_type: "data_quality_degradation",
        region: "Fukuoka",
        product_category: "truck",
        quality_score_change: -0.18,
        missing_rate_increase: 0.12,
        data_age_days: 70,
        confidence_score: 0.79,
        detected_at: "2024-01-15T12:30:00Z",
      },
    ];

    const result = assessLearningDataUpdateTriggerPriority(triggerEvents);

    expect(result).toBeDefined();
    expect(result.processed_trigger_count).toBe(5);
    expect(result.priority_assessments).toBeDefined();
    expect(Array.isArray(result.priority_assessments)).toBe(true);
    expect(result.priority_assessments.length).toBe(5);

    const priortyMap = new Map(
      result.priority_assessments.map((item: any) => [item.trigger_id, item])
    );

    const t001 = priortyMap.get("T001");
    expect(t001).toBeDefined();
    expect(t001.trigger_id).toBe("T001");
    expect(t001.trigger_type).toBe("price_volatility");
    expect(t001.priority_level).toBe("High");
    expect(t001.priority_score).toBe(87);
    expect(t001.reasoning).toBeDefined();
    expect(typeof t001.reasoning).toBe("string");
    expect(t001.reasoning.length).toBeGreaterThan(0);
    expect(t001.assessment_timestamp).toBeDefined();
    expect(t001.record_status).toBe("recorded");

    const t002 = priortyMap.get("T002");
    expect(t002).toBeDefined();
    expect(t002.trigger_id).toBe("T002");
    expect(t002.trigger_type).toBe("market_trend_change");
    expect(t002.priority_level).toBe("High");
    expect(t002.priority_score).toBe(82);
    expect(t002.record_status).toBe("recorded");

    const t003 = priortyMap.get("T003");
    expect(t003).toBeDefined();
    expect(t003.trigger_id).toBe("T003");
    expect(t003.trigger_type).toBe("category_structure_change");
    expect(t003.priority_level).toBe("High");
    expect(t003.priority_score).toBe(79);
    expect(t003.record_status).toBe("recorded");

    const t004 = priortyMap.get("T004");
    expect(t004).toBeDefined();
    expect(t004.trigger_id).toBe("T004");
    expect(t004.trigger_type).toBe("seasonal_pattern_detection");
    expect(t004.priority_level).toBe("Medium");
    expect(t004.priority_score).toBe(68);
    expect(t004.record_status).toBe("recorded");

    const t005 = priortyMap.get("T005");
    expect(t005).toBeDefined();
    expect(t005.trigger_id).toBe("T005");
    expect(t005.trigger_type).toBe("data_quality_degradation");
    expect(t005.priority_level).toBe("Medium");
    expect(t005.priority_score).toBe(61);
    expect(t005.record_status).toBe("recorded");

    const priorityOrder = result.priority_assessments
      .map((item: any) => item.priority_score)
      .reduce((prev: number, curr: number, idx: number, arr: number[]) => {
        if (idx > 0) {
          expect(arr[idx - 1]).toBeGreaterThanOrEqual(curr);
        }
        return curr;
      });

    expect(result.highest_priority_trigger_id).toBe("T001");
    expect(result.total_high_priority_count).toBe(3);
    expect(result.total_medium_priority_count).toBe(2);
    expect(result.total_low_priority_count).toBe(0);

    const recordedCount = result.priority_assessments.filter(
      (item: any) => item.record_status === "recorded"
    ).length;
    expect(recordedCount).toBe(5);

    expect(result.processing_status).toBe("completed");
    expect(result.data_completeness_rate).toBe(100);
  });
});