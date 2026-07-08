import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { generateLearningSchedule } from "../../src/logic/it-6-2-2-1";

describe("学習データ更新・再学習実行スケジュール自動生成", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1526: 複数の高優先度パターンが同時に存在する場合に正しく順序付けできる
  it("should generate correctly ordered learning schedule for multiple high-priority patterns", () => {
    // テストデータ: 優先度「高」の複数パターン（3件以上）、異なるトリガー条件
    const input_patterns = [
      {
        pattern_id: "PAT_001",
        priority_level: "high",
        trigger_type: "data_quality_degradation",
        trigger_timestamp: new Date("2024-01-15T10:00:00Z"),
        data_quality_score: 0.65,
        threshold_lower_bound: 0.70,
        required_data_count: 500,
        available_data_count: 480,
        estimated_learning_days: 3,
      },
      {
        pattern_id: "PAT_002",
        priority_level: "high",
        trigger_type: "model_accuracy_degradation",
        trigger_timestamp: new Date("2024-01-15T09:30:00Z"),
        ocr_accuracy_current: 0.82,
        ocr_accuracy_threshold: 0.85,
        ai_accuracy_current: 0.78,
        ai_accuracy_threshold: 0.80,
        estimated_learning_days: 5,
      },
      {
        pattern_id: "PAT_003",
        priority_level: "high",
        trigger_type: "data_volume_threshold_exceeded",
        trigger_timestamp: new Date("2024-01-15T10:15:00Z"),
        required_data_count: 500,
        available_data_count: 520,
        data_collection_ratio: 1.04,
        estimated_learning_days: 2,
      },
      {
        pattern_id: "PAT_004",
        priority_level: "medium",
        trigger_type: "seasonal_data_missing",
        trigger_timestamp: new Date("2024-01-15T11:00:00Z"),
        estimated_learning_days: 4,
      },
    ];

    // 学習スケジュール自動生成機能を実行
    const result = generateLearningSchedule({
      patterns: input_patterns,
      base_date: new Date("2024-01-15T00:00:00Z"),
      max_parallel_tasks: 1,
    });

    // 期待値: 高優先度パターンは優先度順に順序付けられ、セカンダリソート条件に基づいて一貫性を持つ

    // 1. 生成されたスケジュールから高優先度パターンのみを抽出
    const high_priority_schedules = result.schedule_items.filter(
      (item) => item.priority_level === "high"
    );

    // 2. 高優先度パターンが3件以上であることを確認（テストデータに含まれる高優先度）
    expect(high_priority_schedules.length).toBe(3);

    // 3. 高優先度パターンのスケジュール順序を確認
    const high_priority_pattern_ids = high_priority_schedules.map(
      (item) => item.pattern_id
    );

    // セカンダリソート条件（trigger_timestamp）に基づいた期待順序
    // PAT_002（09:30:00） → PAT_001（10:00:00） → PAT_003（10:15:00）
    const expected_order_by_timestamp = ["PAT_002", "PAT_001", "PAT_003"];

    expect(high_priority_pattern_ids).toEqual(expected_order_by_timestamp);

    // 4. 各スケジュール項目のフィールド検証
    expect(high_priority_schedules[0]).toMatchObject({
      pattern_id: "PAT_002",
      priority_level: "high",
      trigger_type: "model_accuracy_degradation",
      scheduled_start_date: new Date("2024-01-15T00:00:00Z"),
    });

    expect(high_priority_schedules[1]).toMatchObject({
      pattern_id: "PAT_001",
      priority_level: "high",
      trigger_type: "data_quality_degradation",
      scheduled_start_date: new Date("2024-01-18T00:00:00Z"), // PAT_002完了後（5日後）
    });

    expect(high_priority_schedules[2]).toMatchObject({
      pattern_id: "PAT_003",
      priority_level: "high",
      trigger_type: "data_volume_threshold_exceeded",
      scheduled_start_date: new Date("2024-01-23T00:00:00Z"), // PAT_001完了後（3日後）
    });

    // 5. スケジュール実行順序の一貫性を確認
    for (let i = 0; i < high_priority_schedules.length - 1; i++) {
      const current_end_date = new Date(
        high_priority_schedules[i].scheduled_start_date.getTime() +
          high_priority_schedules[i].estimated_learning_days * 24 * 60 * 60 * 1000
      );
      const next_start_date = high_priority_schedules[i + 1].scheduled_start_date;

      // 重複がないことを確認（次のスケジュール開始日 >= 現在のスケジュール終了日）
      expect(next_start_date.getTime()).toBeGreaterThanOrEqual(
        current_end_date.getTime()
      );
    }

    // 6. 全パターンの重複と漏落がないことを確認
    const scheduled_pattern_ids = new Set(
      result.schedule_items.map((item) => item.pattern_id)
    );
    expect(scheduled_pattern_ids.size).toBe(result.schedule_items.length); // 重複なし
    expect(scheduled_pattern_ids.has("PAT_001")).toBe(true);
    expect(scheduled_pattern_ids.has("PAT_002")).toBe(true);
    expect(scheduled_pattern_ids.has("PAT_003")).toBe(true);
    expect(scheduled_pattern_ids.has("PAT_004")).toBe(true);

    // 7. 中優先度パターンも含まれていることを確認
    const medium_priority_schedules = result.schedule_items.filter(
      (item) => item.priority_level === "medium"
    );
    expect(medium_priority_schedules.length).toBe(1);
    expect(medium_priority_schedules[0].pattern_id).toBe("PAT_004");

    // 8. スケジュール生成の完全性を確認
    expect(result.total_patterns_count).toBe(4);
    expect(result.scheduled_patterns_count).toBe(4);
    expect(result.estimated_total_learning_days).toBe(14); // 5+3+2+4=14日
    expect(result.has_conflicts).toBe(false);
  });
});