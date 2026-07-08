import { generateLearningDataUpdateSchedule } from "../../src/logic/it-6-2-2-1";

describe("学習データ更新・モデル再学習スケジュール自動生成", () => {
  test("SCEN-1524: 月次乖離パターン分析結果から実行優先度と実施時期を正しく計算できる", () => {
    // 月次乖離パターン分析結果データを準備
    const monthly_divergence_analysis = {
      analysis_date: "2024-01-31T23:59:59Z",
      patterns: [
        {
          pattern_id: "PAT001",
          region: "Tokyo",
          construction_type: "建築",
          time_period: "Q1",
          divergence_rate: 12.5,
          divergence_frequency: 45,
          affected_quote_count: 892,
          data_coverage_ratio: 0.72,
        },
        {
          pattern_id: "PAT002",
          region: "Osaka",
          construction_type: "土木",
          time_period: "Q1",
          divergence_rate: 8.3,
          divergence_frequency: 28,
          affected_quote_count: 534,
          data_coverage_ratio: 0.65,
        },
        {
          pattern_id: "PAT003",
          region: "Tokyo",
          construction_type: "電気",
          time_period: "Q2",
          divergence_rate: 18.7,
          divergence_frequency: 67,
          affected_quote_count: 1245,
          data_coverage_ratio: 0.58,
        },
        {
          pattern_id: "PAT004",
          region: "Fukuoka",
          construction_type: "建築",
          time_period: "Q1",
          divergence_rate: 5.2,
          divergence_frequency: 15,
          affected_quote_count: 312,
          data_coverage_ratio: 0.81,
        },
      ],
    };

    const current_datetime = "2024-02-01T09:00:00Z";
    const system_resource_capacity = 100;
    const max_concurrent_tasks = 3;

    // スケジュール自動生成機能を実行
    const result = generateLearningDataUpdateSchedule({
      monthly_divergence_analysis,
      current_datetime,
      system_resource_capacity,
      max_concurrent_tasks,
    });

    // 実行優先度が乖離度と発生頻度に基づいて正確に計算されたことを確認
    // 優先度スコア計算: (乖離率 * 40) + (発生頻度 * 0.3) = 優先度スコア
    // PAT001: (12.5 * 40) + (45 * 0.3) = 500 + 13.5 = 513.5
    // PAT002: (8.3 * 40) + (28 * 0.3) = 332 + 8.4 = 340.4
    // PAT003: (18.7 * 40) + (67 * 0.3) = 748 + 20.1 = 768.1
    // PAT004: (5.2 * 40) + (15 * 0.3) = 208 + 4.5 = 212.5
    // 期待される優先度順: PAT003 > PAT001 > PAT002 > PAT004

    expect(result.schedules).toBeDefined();
    expect(Array.isArray(result.schedules)).toBe(true);
    expect(result.schedules.length).toBe(4);

    // 優先度が正しく計算されたことを確認
    const schedule_by_pattern = new Map(
      result.schedules.map((s: any) => [s.pattern_id, s])
    );

    const pat003_schedule = schedule_by_pattern.get("PAT003");
    const pat001_schedule = schedule_by_pattern.get("PAT001");
    const pat002_schedule = schedule_by_pattern.get("PAT002");
    const pat004_schedule = schedule_by_pattern.get("PAT004");

    expect(pat003_schedule.priority_score).toBe(768.1);
    expect(pat001_schedule.priority_score).toBe(513.5);
    expect(pat002_schedule.priority_score).toBe(340.4);
    expect(pat004_schedule.priority_score).toBe(212.5);

    expect(pat003_schedule.priority_rank).toBe(1);
    expect(pat001_schedule.priority_rank).toBe(2);
    expect(pat002_schedule.priority_rank).toBe(3);
    expect(pat004_schedule.priority_rank).toBe(4);

    // 実施時期が優先度に基づいて正しく計算されたことを確認
    // スケジュール配置ロジック:
    // - 優先度1: 2024-02-05（4日後）
    // - 優先度2: 2024-02-12（11日後）
    // - 優先度3: 2024-02-19（18日後）
    // - 優先度4: 2024-02-26（25日後）

    expect(pat003_schedule.scheduled_start_datetime).toBe(
      "2024-02-05T09:00:00Z"
    );
    expect(pat001_schedule.scheduled_start_datetime).toBe(
      "2024-02-12T09:00:00Z"
    );
    expect(pat002_schedule.scheduled_start_datetime).toBe(
      "2024-02-19T09:00:00Z"
    );
    expect(pat004_schedule.scheduled_start_datetime).toBe(
      "2024-02-26T09:00:00Z"
    );

    // 実施期間が正しく設定されたことを確認
    // 標準実施期間: 3日間
    expect(pat003_schedule.scheduled_end_datetime).toBe("2024-02-08T09:00:00Z");
    expect(pat001_schedule.scheduled_end_datetime).toBe("2024-02-15T09:00:00Z");
    expect(pat002_schedule.scheduled_end_datetime).toBe("2024-02-22T09:00:00Z");
    expect(pat004_schedule.scheduled_end_datetime).toBe("2024-02-29T09:00:00Z");

    // 必要な学習データ件数が正しく計算されたことを確認
    // 必要件数 = 影響を受けた見積件数 * (1 - データカバレッジ率) / (100 - 乖離率)
    // PAT003: 1245 * (1 - 0.58) / (100 - 18.7) = 1245 * 0.42 / 81.3 ≈ 6.44 → 7件
    // PAT001: 892 * (1 - 0.72) / (100 - 12.5) = 892 * 0.28 / 87.5 ≈ 2.86 → 3件
    // PAT002: 534 * (1 - 0.65) / (100 - 8.3) = 534 * 0.35 / 91.7 ≈ 2.04 → 2件
    // PAT004: 312 * (1 - 0.81) / (100 - 5.2) = 312 * 0.19 / 94.8 ≈ 0.63 → 1件

    expect(pat003_schedule.required_data_count).toBe(7);
    expect(pat001_schedule.required_data_count).toBe(3);
    expect(pat002_schedule.required_data_count).toBe(2);
    expect(pat004_schedule.required_data_count).toBe(1);

    // 実施時期の順序が優先度と一致していることを確認
    const start_dates = result.schedules.map(
      (s: any) => new Date(s.scheduled_start_datetime).getTime()
    );
    const is_ordered = start_dates.every(
      (date: number, i: number) =>
        i === 0 || date > start_dates[i - 1]
    );
    expect(is_ordered).toBe(true);

    // スケジュール内の計算結果に矛盾がないことを確認
    result.schedules.forEach((schedule: any) => {
      // 開始日時は現在日時以降であること
      expect(
        new Date(schedule.scheduled_start_datetime).getTime() >=
          new Date(current_datetime).getTime()
      ).toBe(true);

      // 終了日時は開始日時以降であること
      expect(
        new Date(schedule.scheduled_end_datetime).getTime() >=
          new Date(schedule.scheduled_start_datetime).getTime()
      ).toBe(true);

      // 優先度スコアは0以上であること
      expect(schedule.priority_score).toBeGreaterThanOrEqual(0);

      // 優先度ランクは1以上4以下であること
      expect(schedule.priority_rank).toBeGreaterThanOrEqual(1);
      expect(schedule.priority_rank).toBeLessThanOrEqual(4);

      // 必要データ件数は0以上であること
      expect(schedule.required_data_count).toBeGreaterThanOrEqual(0);
    });

    // 生成されたスケジュールが実行可能な構造であることを確認
    expect(result.total_schedules).toBe(4);
    expect(result.total_estimated_duration_days).toBe(25);
    expect(result.concurrent_task_count).toBe(1);
    expect(result.resource_utilization_ratio).toBeLessThanOrEqual(1.0);

    // 出力スケジュールの整合性を確認
    expect(result.schedules[0].priority_rank).toBe(1);
    expect(result.schedules[1].priority_rank).toBe(2);
    expect(result.schedules[2].priority_rank).toBe(3);
    expect(result.schedules[3].priority_rank).toBe(4);

    // 最初のスケジュール詳細を確認
    const first_schedule = result.schedules[0];
    expect(first_schedule.pattern_id).toBe("PAT003");
    expect(first_schedule.region).toBe("Tokyo");
    expect(first_schedule.construction_type).toBe("電気");
    expect(first_schedule.time_period).toBe("Q2");
    expect(first_schedule.divergence_rate).toBe(18.7);
    expect(first_schedule.divergence_frequency).toBe(67);
  });
});