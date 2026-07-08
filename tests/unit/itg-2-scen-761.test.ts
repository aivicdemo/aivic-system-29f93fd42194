import { detectAnomalousAssessors } from "../../src/logic/it-6-2-1-1";

describe("査定員別生産性の異常値自動判定機能", () => {
  test("SCEN-761: 月次データから査定員ごとの処理時間・件数の異常値を自動判定し、除外対象と改善対象を分類する", () => {
    // テストデータ: 複数の査定員による月次の処理時間・件数データ
    // 正常範囲の例: 平均処理時間 30分、標準偏差 5分 → 20〜40分が正常
    // 異常値: 処理時間が 15分（著しく短い = 除外対象候補）
    //       処理時間が 60分（著しく長い = 改善対象候補）
    const input = {
      monthly_assessor_data: [
        {
          assessor_id: "A001",
          assessor_name: "田中太郎",
          total_processed_count: 150,
          average_processing_time_minutes: 30,
          total_processing_time_minutes: 4500,
          processing_time_variance: 25,
          feedback_count: 2,
          system_downtime_minutes: 0,
          vacation_days: 0,
          note: "normal",
        },
        {
          assessor_id: "A002",
          assessor_name: "佐藤花子",
          total_processed_count: 148,
          average_processing_time_minutes: 31,
          total_processing_time_minutes: 4588,
          processing_time_variance: 28,
          feedback_count: 1,
          system_downtime_minutes: 0,
          vacation_days: 0,
          note: "normal",
        },
        {
          assessor_id: "A003",
          assessor_name: "鈴木次郎",
          total_processed_count: 142,
          average_processing_time_minutes: 29,
          total_processing_time_minutes: 4118,
          processing_time_variance: 22,
          feedback_count: 3,
          system_downtime_minutes: 0,
          vacation_days: 0,
          note: "normal",
        },
        {
          assessor_id: "A004",
          assessor_name: "山田新人",
          total_processed_count: 80,
          average_processing_time_minutes: 60,
          total_processing_time_minutes: 4800,
          processing_time_variance: 150,
          feedback_count: 15,
          system_downtime_minutes: 0,
          vacation_days: 0,
          note: "new_employee",
        },
        {
          assessor_id: "A005",
          assessor_name: "伊藤速人",
          total_processed_count: 200,
          average_processing_time_minutes: 15,
          total_processing_time_minutes: 3000,
          processing_time_variance: 5,
          feedback_count: 0,
          system_downtime_minutes: 120,
          vacation_days: 0,
          note: "system_issue",
        },
        {
          assessor_id: "A006",
          assessor_name: "中村順子",
          total_processed_count: 110,
          average_processing_time_minutes: 35,
          total_processing_time_minutes: 3850,
          processing_time_variance: 35,
          feedback_count: 8,
          system_downtime_minutes: 0,
          vacation_days: 5,
          note: "vacation",
        },
      ],
      statistical_threshold_std_dev_multiplier: 2.0,
    };

    const result = detectAnomalousAssessors(input);

    // 期待結果の検証
    // 1. 結果オブジェクトが正しい構造を持つ
    expect(result).toHaveProperty("total_assessors");
    expect(result).toHaveProperty("anomalous_assessor_count");
    expect(result).toHaveProperty("excluded_count");
    expect(result).toHaveProperty("improvement_target_count");
    expect(result).toHaveProperty("anomalous_assessors");
    expect(result).toHaveProperty("statistics");
    expect(result).toHaveProperty("report_timestamp");

    // 2. 集計値が正確であること
    expect(result.total_assessors).toBe(6);

    // 3. 統計基準の計算
    // 正常データ（A001, A002, A003）の平均処理時間: (30 + 31 + 29) / 3 = 30分
    // 正常データの標準偏差を計算
    // 分散: ((30-30)^2 + (31-30)^2 + (29-30)^2) / 3 = 2/3 ≈ 0.667
    // 標準偏差: sqrt(0.667) ≈ 0.816
    // 閾値 = 平均 ± (標準偏差 × 2.0) = 30 ± (0.816 × 2) = 30 ± 1.632
    // 正常範囲: 約28.4〜31.6分

    // A004（処理時間60分）：正常範囲外、高値 → 改善対象
    // A005（処理時間15分）：正常範囲外、低値、システムダウンタイムあり → 除外対象
    // A006（処理時間35分）：正常範囲外（可能性）だが、休暇5日 → 除外対象

    expect(result.anomalous_assessor_count).toBe(3);
    expect(result.excluded_count).toBe(2); // A005, A006
    expect(result.improvement_target_count).toBe(1); // A004

    // 4. 異常値の詳細検証
    const anomalous_assessors = result.anomalous_assessors;
    expect(anomalous_assessors.length).toBe(3);

    // A004（改善対象）の検証
    const a004_result = anomalous_assessors.find(
      (a: any) => a.assessor_id === "A004"
    );
    expect(a004_result).toBeDefined();
    expect(a004_result.classification).toBe("improvement_target");
    expect(a004_result.anomaly_type).toBe("high_processing_time");
    expect(a004_result.has_improvement_flag).toBe(true);
    expect(a004_result.excluded_from_statistics).toBe(false);

    // A005（除外対象）の検証
    const a005_result = anomalous_assessors.find(
      (a: any) => a.assessor_id === "A005"
    );
    expect(a005_result).toBeDefined();
    expect(a005_result.classification).toBe("excluded");
    expect(a005_result.exclusion_reason).toBe("system_downtime");
    expect(a005_result.excluded_from_statistics).toBe(true);

    // A006（除外対象）の検証
    const a006_result = anomalous_assessors.find(
      (a: any) => a.assessor_id === "A006"
    );
    expect(a006_result).toBeDefined();
    expect(a006_result.classification).toBe("excluded");
    expect(a006_result.exclusion_reason).toBe("vacation");
    expect(a006_result.excluded_from_statistics).toBe(true);

    // 5. 統計情報の検証
    expect(result.statistics).toHaveProperty("normal_range_min");
    expect(result.statistics).toHaveProperty("normal_range_max");
    expect(result.statistics).toHaveProperty("mean_processing_time");
    expect(result.statistics).toHaveProperty("standard_deviation");

    // 統計値は正常データからのみ計算される（A001, A002, A003）
    expect(result.statistics.mean_processing_time).toBe(30);
    expect(
      result.statistics.standard_deviation
    ).toBeCloseTo(0.816, 2);
    expect(result.statistics.normal_range_min).toBeCloseTo(27.368, 2);
    expect(result.statistics.normal_range_max).toBeCloseTo(32.632, 2);

    // 6. レポートのタイムスタンプが ISO 形式であること
    expect(result.report_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // 7. 改善対象フラグが正しく付与されていること
    const improvement_targets = result.anomalous_assessors.filter(
      (a: any) => a.classification === "improvement_target"
    );
    improvement_targets.forEach((assessor: any) => {
      expect(assessor.has_improvement_flag).toBe(true);
      expect(assessor.excluded_from_statistics).toBe(false);
    });

    // 8. 除外対象フラグが正しく付与されていること
    const excluded_assessors = result.anomalous_assessors.filter(
      (a: any) => a.classification === "excluded"
    );
    excluded_assessors.forEach((assessor: any) => {
      expect(assessor.excluded_from_statistics).toBe(true);
      expect([
        "system_downtime",
        "vacation",
        "technical_issue",
      ]).toContain(assessor.exclusion_reason);
    });

    // 9. 月次データの処理完了状態の確認
    expect(result).toHaveProperty("processing_complete");
    expect(result.processing_complete).toBe(true);

    // 10. レポート出力可能な形式で保存されていることの確認
    expect(result).toHaveProperty("export_format");
    expect(["json", "csv"]).toContain(result.export_format);
  });
});