import { aggregateMonthlyAssessmentMetrics } from "../../src/logic/it-6-2-1-1";

describe("月次査定業務実績の集計・ダッシュボード表示機能", () => {
  // SCEN-758
  test("システム自動生成の月次集計データをトリガーにダッシュボードが更新される", () => {
    // 前月度（2024年11月）の査定データを想定
    const monthlyAssessmentData = {
      year: 2024,
      month: 11,
      assessmentRecords: [
        {
          id: "A001",
          assessor_id: "ASS001",
          work_type: "土工",
          amount_band: "1000-5000万",
          assessment_time_minutes: 28,
          deviation_rate_percent: 3.5,
          deviation_amount_yen: 145000,
          judgment_consistency_score: 95,
          timestamp: "2024-11-15T10:30:00Z",
        },
        {
          id: "A002",
          assessor_id: "ASS002",
          work_type: "土工",
          amount_band: "1000-5000万",
          assessment_time_minutes: 35,
          deviation_rate_percent: 8.2,
          deviation_amount_yen: 310000,
          judgment_consistency_score: 87,
          timestamp: "2024-11-15T11:15:00Z",
        },
        {
          id: "A003",
          assessor_id: "ASS001",
          work_type: "建築",
          amount_band: "5000-10000万",
          assessment_time_minutes: 42,
          deviation_rate_percent: 2.1,
          deviation_amount_yen: 178000,
          judgment_consistency_score: 98,
          timestamp: "2024-11-16T09:45:00Z",
        },
        {
          id: "A004",
          assessor_id: "ASS003",
          work_type: "建築",
          amount_band: "1000-5000万",
          assessment_time_minutes: 31,
          deviation_rate_percent: 5.7,
          deviation_amount_yen: 267000,
          judgment_consistency_score: 91,
          timestamp: "2024-11-16T14:20:00Z",
        },
        {
          id: "A005",
          assessor_id: "ASS002",
          work_type: "機械",
          amount_band: "500-1000万",
          assessment_time_minutes: 22,
          deviation_rate_percent: 1.3,
          deviation_amount_yen: 52000,
          judgment_consistency_score: 99,
          timestamp: "2024-11-17T13:00:00Z",
        },
      ],
    };

    // 集計処理を実行
    const aggregatedResult = aggregateMonthlyAssessmentMetrics(
      monthlyAssessmentData
    );

    // === 【全体集計項目の検証】 ===
    // 全体件数: 5件
    expect(aggregatedResult.total_count).toBe(5);

    // 全体平均査定時間: (28+35+42+31+22)/5 = 31.6分
    expect(aggregatedResult.average_assessment_time_minutes).toBe(31.6);

    // 全体平均乖離率: (3.5+8.2+2.1+5.7+1.3)/5 = 4.16%
    expect(aggregatedResult.average_deviation_rate_percent).toBeCloseTo(
      4.16,
      2
    );

    // 全体合計乖離額: 145000+310000+178000+267000+52000 = 952000円
    expect(aggregatedResult.total_deviation_amount_yen).toBe(952000);

    // 全体平均一致度スコア: (95+87+98+91+99)/5 = 94%
    expect(aggregatedResult.average_judgment_consistency_score).toBe(94);

    // === 【査定担当者別集計の検証】 ===
    // ASS001: 2件 (A001, A003)
    const ass001_stats = aggregatedResult.by_assessor.find(
      (item: any) => item.assessor_id === "ASS001"
    );
    expect(ass001_stats).toBeDefined();
    expect(ass001_stats.count).toBe(2);
    // 平均査定時間: (28+42)/2 = 35分
    expect(ass001_stats.average_assessment_time_minutes).toBe(35);
    // 平均乖離率: (3.5+2.1)/2 = 2.8%
    expect(ass001_stats.average_deviation_rate_percent).toBe(2.8);
    // 合計乖離額: 145000+178000 = 323000円
    expect(ass001_stats.total_deviation_amount_yen).toBe(323000);
    // 平均一致度: (95+98)/2 = 96.5
    expect(ass001_stats.average_judgment_consistency_score).toBe(96.5);

    // ASS002: 2件 (A002, A005)
    const ass002_stats = aggregatedResult.by_assessor.find(
      (item: any) => item.assessor_id === "ASS002"
    );
    expect(ass002_stats).toBeDefined();
    expect(ass002_stats.count).toBe(2);
    // 平均査定時間: (35+22)/2 = 28.5分
    expect(ass002_stats.average_assessment_time_minutes).toBe(28.5);
    // 平均乖離率: (8.2+1.3)/2 = 4.75%
    expect(ass002_stats.average_deviation_rate_percent).toBe(4.75);
    // 合計乖離額: 310000+52000 = 362000円
    expect(ass002_stats.total_deviation_amount_yen).toBe(362000);
    // 平均一致度: (87+99)/2 = 93
    expect(ass002_stats.average_judgment_consistency_score).toBe(93);

    // ASS003: 1件 (A004)
    const ass003_stats = aggregatedResult.by_assessor.find(
      (item: any) => item.assessor_id === "ASS003"
    );
    expect(ass003_stats).toBeDefined();
    expect(ass003_stats.count).toBe(1);
    expect(ass003_stats.average_assessment_time_minutes).toBe(31);
    expect(ass003_stats.average_deviation_rate_percent).toBe(5.7);
    expect(ass003_stats.total_deviation_amount_yen).toBe(267000);
    expect(ass003_stats.average_judgment_consistency_score).toBe(91);

    // === 【工種別集計の検証】 ===
    // 土工: 2件 (A001, A002)
    const work_type_soil = aggregatedResult.by_work_type.find(
      (item: any) => item.work_type === "土工"
    );
    expect(work_type_soil).toBeDefined();
    expect(work_type_soil.count).toBe(2);
    // 平均査定時間: (28+35)/2 = 31.5分
    expect(work_type_soil.average_assessment_time_minutes).toBe(31.5);
    // 平均乖離率: (3.5+8.2)/2 = 5.85%
    expect(work_type_soil.average_deviation_rate_percent).toBe(5.85);
    // 合計乖離額: 145000+310000 = 455000円
    expect(work_type_soil.total_deviation_amount_yen).toBe(455000);
    // 平均一致度: (95+87)/2 = 91
    expect(work_type_soil.average_judgment_consistency_score).toBe(91);

    // 建築: 2件 (A003, A004)
    const work_type_building = aggregatedResult.by_work_type.find(
      (item: any) => item.work_type === "建築"
    );
    expect(work_type_building).toBeDefined();
    expect(work_type_building.count).toBe(2);
    // 平均査定時間: (42+31)/2 = 36.5分
    expect(work_type_building.average_assessment_time_minutes).toBe(36.5);
    // 平均乖離率: (2.1+5.7)/2 = 3.9%
    expect(work_type_building.average_deviation_rate_percent).toBe(3.9);
    // 合計乖離額: 178000+267000 = 445000円
    expect(work_type_building.total_deviation_amount_yen).toBe(445000);
    // 平均一致度: (98+91)/2 = 94.5
    expect(work_type_building.average_judgment_consistency_score).toBe(94.5);

    // 機械: 1件 (A005)
    const work_type_machine = aggregatedResult.by_work_type.find(
      (item: any) => item.work_type === "機械"
    );
    expect(work_type_machine).toBeDefined();
    expect(work_type_machine.count).toBe(1);
    expect(work_type_machine.average_assessment_time_minutes).toBe(22);
    expect(work_type_machine.average_deviation_rate_percent).toBe(1.3);
    expect(work_type_machine.total_deviation_amount_yen).toBe(52000);
    expect(work_type_machine.average_judgment_consistency_score).toBe(99);

    // === 【金額帯別集計の検証】 ===
    // 500-1000万: 1件 (A005)
    const amount_band_500_1000 = aggregatedResult.by_amount_band.find(
      (item: any) => item.amount_band === "500-1000万"
    );
    expect(amount_band_500_1000).toBeDefined();
    expect(amount_band_500_1000.count).toBe(1);
    expect(amount_band_500_1000.average_assessment_time_minutes).toBe(22);
    expect(amount_band_500_1000.average_deviation_rate_percent).toBe(1.3);
    expect(amount_band_500_1000.total_deviation_amount_yen).toBe(52000);
    expect(amount_band_500_1000.average_judgment_consistency_score).toBe(99);

    // 1000-5000万: 3件 (A001, A002, A004)
    const amount_band_1000_5000 = aggregatedResult.by_amount_band.find(
      (item: any) => item.amount_band === "1000-5000万"
    );
    expect(amount_band_1000_5000).toBeDefined();
    expect(amount_band_1000_5000.count).toBe(3);
    // 平均査定時間: (28+35+31)/3 = 31.33...分
    expect(amount_band_1000_5000.average_assessment_time_minutes).toBeCloseTo(
      31.33,
      2
    );
    // 平均乖離率: (3.5+8.2+5.7)/3 = 5.8%
    expect(amount_band_1000_5000.average_deviation_rate_percent).toBeCloseTo(
      5.8,
      1
    );
    // 合計乖離額: 145000+310000+267000 = 722000円
    expect(amount_band_1000_5000.total_deviation_amount_yen).toBe(722000);
    // 平均一致度: (95+87+91)/3 = 91
    expect(amount_band_1000_5000.average_judgment_consistency_score).toBe(91);

    // 5000-10000万: 1件 (A003)
    const amount_band_5000_10000 = aggregatedResult.by_amount_band.find(
      (item: any) => item.amount_band === "5000-10000万"
    );
    expect(amount_band_5000_10000).toBeDefined();
    expect(amount_band_5000_10000.count).toBe(1);
    expect(amount_band_5000_10000.average_assessment_time_minutes).toBe(42);
    expect(amount_band_5000_10000.average_deviation_rate_percent).toBe(2.1);
    expect(amount_band_5000_10000.total_deviation_amount_yen).toBe(178000);
    expect(amount_band_5000_10000.average_judgment_consistency_score).toBe(98);

    // === 【ダッシュボード表示用メタデータの検証】 ===
    // 集計実行時刻がISO形式で記録されていることを確認
    expect(aggregatedResult.aggregation_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // 集計対象月が正確に記録されている
    expect(aggregatedResult.target_year).toBe(2024);
    expect(aggregatedResult.target_month).toBe(11);

    // ダッシュボード描画に必要な構造体が整っている
    expect(aggregatedResult.dashboard_layout).toBeDefined();
    expect(aggregatedResult.dashboard_layout.main_metrics).toBeDefined();
    expect(aggregatedResult.dashboard_layout.main_metrics.total_count).toBe(5);
    expect(
      aggregatedResult.dashboard_layout.main_metrics.average_assessment_time
    ).toBe(31.6);
    expect(
      aggregatedResult.dashboard_layout.main_metrics.average_deviation_rate
    ).toBeCloseTo(4.16, 2);
    expect(
      aggregatedResult.dashboard_layout.main_metrics.total_deviation_amount
    ).toBe(952000);

    // === 【ダッシュボード表示の一貫性：複数回集計実行後の更新確認】 ===
    // 同じ入力で再度集計を実行
    const aggregatedResult_2nd = aggregateMonthlyAssessmentMetrics(
      monthlyAssessmentData
    );

    // 集計結果の数値が一致し、更新されていることを確認
    expect(aggregatedResult_2nd.total_count).toBe(aggregatedResult.total_count);
    expect(aggregatedResult_2nd.average_assessment_time_minutes).toBe(
      aggregatedResult.average_assessment_time_minutes
    );
    expect(aggregatedResult_2nd.average_deviation_rate_percent).toBeCloseTo(
      aggregatedResult.average_deviation_rate_percent,
      2
    );
    expect(aggregatedResult_2nd.total_deviation_amount_yen).toBe(
      aggregatedResult.total_deviation_amount_yen
    );

    // タイムスタンプは新しい時刻が記録される（リロード後の一貫性確認）
    expect(aggregatedResult_2nd.aggregation_timestamp).toBeDefined();
    expect(aggregatedResult_2nd.aggregation_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // === 【集計データの完全性と正確性】 ===
    // 返り値の構造が期待される形式を満たしている
    expect(aggregatedResult).toHaveProperty("total_count");
    expect(aggregatedResult).toHaveProperty("average_assessment_time_minutes");
    expect(aggregatedResult).toHaveProperty("average_deviation_rate_percent");
    expect(aggregatedResult).toHaveProperty("total_deviation_amount_yen");
    expect(aggregatedResult).toHaveProperty(
      "average_judgment_consistency_score"
    );
    expect(aggregatedResult).toHaveProperty("by_assessor");
    expect(aggregatedResult).toHaveProperty("by_work_type");
    expect(aggregatedResult).toHaveProperty("by_amount_band");
    expect(aggregatedResult).toHaveProperty("target_year");
    expect(aggregatedResult).toHaveProperty("target_month");
    expect(aggregatedResult).toHaveProperty("aggregation_timestamp");
    expect(aggregatedResult).toHaveProperty("dashboard_layout");

    // by_assessorが配列形式で、各要素が必須フィールドを持つ
    expect(Array.isArray(aggregatedResult.by_assessor)).toBe(true);
    aggregatedResult.by_assessor.forEach((assessor_stat: any) => {
      expect(assessor_stat).toHaveProperty("assessor_id");
      expect(assessor_stat).toHaveProperty("count");
      expect(assessor_stat).toHaveProperty("average_assessment_time_minutes");
      expect(assessor_stat).toHaveProperty("average_deviation_rate_percent");
      expect(assessor_stat).toHaveProperty("total_deviation_amount_yen");
      expect(assessor_stat).toHaveProperty(
        "average_judgment_consistency_score"
      );
    });

    // by_work_typeが配列形式で、各要素が必須フィールドを持つ
    expect(Array.isArray(aggregatedResult.by_work_type)).toBe(true);
    aggregatedResult.by_work_type.forEach((work_stat: any) => {
      expect(work_stat).toHaveProperty("work_type");
      expect(work_stat).toHaveProperty("count");
      expect(work_stat).toHaveProperty("average_assessment_time_minutes");
      expect(work_stat).toHaveProperty("average_deviation_rate_percent");
      expect(work_stat).toHaveProperty("total_deviation_amount_yen");
      expect(work_stat).toHaveProperty(
        "average_judgment_consistency_score"
      );
    });

    // by_amount_bandが配列形式で、各要素が必須フィールドを持つ
    expect(Array.isArray(aggregatedResult.by_amount_band)).toBe(true);
    aggregatedResult.by_amount_band.forEach((band_stat: any) => {
      expect(band_stat).toHaveProperty("amount_band");
      expect(band_stat).toHaveProperty("count");
      expect(band_stat).toHaveProperty("average_assessment_time_minutes");
      expect(band_stat).toHaveProperty("average_deviation_rate_percent");
      expect(band_stat).toHaveProperty("total_deviation_amount_yen");
      expect(band_stat).toHaveProperty(
        "average_judgment_consistency_score"
      );
    });

    // === 【期待結果：ダッシュボード表示の最新性と一貫性】 ===
    // 集計結果がダッシュボード表示用に適切に構造化されている
    expect(aggregatedResult.dashboard_layout.main_metrics.total_count).toBe(5);
    expect(
      aggregatedResult.dashboard_layout.main_metrics.average_assessment_time
    ).toBe(31.6);
    expect(
      aggregatedResult.dashboard_layout.main_metrics.total_deviation_amount
    ).toBe(952000);
    expect(
      aggregatedResult.dashboard_layout.main_metrics.average_judgment_consistency
    ).toBe(94);

    // 複数回実行後も表示が一貫性を保つ
    expect(aggregatedResult_2nd.dashboard_layout.main_metrics.total_count).toBe(
      aggregatedResult.dashboard_layout.main_metrics.total_count
    );
    expect(
      aggregatedResult_2nd.dashboard_layout.main_metrics.average_assessment_time
    ).toBe(
      aggregatedResult.dashboard_layout.main_metrics.average_assessment_time
    );
    expect(
      aggregatedResult_2nd.dashboard_layout.main_metrics.total_deviation_amount
    ).toBe(
      aggregatedResult.dashboard_layout.main_metrics.total_deviation_amount
    );
  });
});