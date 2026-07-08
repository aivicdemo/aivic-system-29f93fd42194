import { calculateAssessorProductivityMetrics } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-947: 査定員別処理能力指標自動算出機能 - 各査定員の平均処理時間、月間処理件数が正確に自動算出される", () => {
    // テストデータ: 査定員A の処理実績
    const assessor_a_records = [
      {
        assessor_id: "ASS001",
        assessor_name: "査定員A",
        case_id: "CASE001",
        start_time: new Date("2024-01-05T09:00:00Z"),
        end_time: new Date("2024-01-05T09:15:00Z"),
      },
      {
        assessor_id: "ASS001",
        assessor_name: "査定員A",
        case_id: "CASE002",
        start_time: new Date("2024-01-05T09:20:00Z"),
        end_time: new Date("2024-01-05T09:35:00Z"),
      },
      {
        assessor_id: "ASS001",
        assessor_name: "査定員A",
        case_id: "CASE003",
        start_time: new Date("2024-01-10T14:00:00Z"),
        end_time: new Date("2024-01-10T14:22:00Z"),
      },
    ];

    // テストデータ: 査定員B の処理実績
    const assessor_b_records = [
      {
        assessor_id: "ASS002",
        assessor_name: "査定員B",
        case_id: "CASE004",
        start_time: new Date("2024-01-08T10:00:00Z"),
        end_time: new Date("2024-01-08T10:18:00Z"),
      },
      {
        assessor_id: "ASS002",
        assessor_name: "査定員B",
        case_id: "CASE005",
        start_time: new Date("2024-01-08T10:25:00Z"),
        end_time: new Date("2024-01-08T10:40:00Z"),
      },
    ];

    // テストデータ: 査定員C の処理実績
    const assessor_c_records = [
      {
        assessor_id: "ASS003",
        assessor_name: "査定員C",
        case_id: "CASE006",
        start_time: new Date("2024-01-12T11:00:00Z"),
        end_time: new Date("2024-01-12T11:20:00Z"),
      },
      {
        assessor_id: "ASS003",
        assessor_name: "査定員C",
        case_id: "CASE007",
        start_time: new Date("2024-01-15T13:30:00Z"),
        end_time: new Date("2024-01-15T13:50:00Z"),
      },
      {
        assessor_id: "ASS003",
        assessor_name: "査定員C",
        case_id: "CASE008",
        start_time: new Date("2024-01-20T15:00:00Z"),
        end_time: new Date("2024-01-20T15:12:00Z"),
      },
    ];

    // 統合された処理実績データ
    const all_records = [
      ...assessor_a_records,
      ...assessor_b_records,
      ...assessor_c_records,
    ];

    // 入力: 当月（2024年1月）のデータ期間と処理実績レコード
    const input_data = {
      period_start_date: new Date("2024-01-01"),
      period_end_date: new Date("2024-01-31"),
      assessment_records: all_records,
    };

    // 関数実行
    const result = calculateAssessorProductivityMetrics(input_data);

    // ========== 期待値計算 ==========
    // 査定員A の期待値
    // 月間処理件数: 3件
    // 処理時間: (15分) + (15分) + (22分) = 52分
    // 平均処理時間: 52 / 3 = 17.333... 分
    const assessor_a_expected_monthly_count = 3;
    const assessor_a_total_minutes =
      (15 + 15 + 22) * 60 * 1000; // ミリ秒
    const assessor_a_expected_avg_time_ms = assessor_a_total_minutes / 3; // 31200000ms = 520分/3
    const assessor_a_expected_avg_time_seconds =
      (assessor_a_total_minutes / 3) / 1000; // 10400秒 ÷ 3 = 3466.67秒

    // 査定員B の期待値
    // 月間処理件数: 2件
    // 処理時間: (18分) + (15分) = 33分
    // 平均処理時間: 33 / 2 = 16.5 分
    const assessor_b_expected_monthly_count = 2;
    const assessor_b_total_minutes = (18 + 15) * 60 * 1000; // ミリ秒
    const assessor_b_expected_avg_time_ms = assessor_b_total_minutes / 2;
    const assessor_b_expected_avg_time_seconds =
      (assessor_b_total_minutes / 2) / 1000;

    // 査定員C の期待値
    // 月間処理件数: 3件
    // 処理時間: (20分) + (20分) + (12分) = 52分
    // 平均処理時間: 52 / 3 = 17.333... 分
    const assessor_c_expected_monthly_count = 3;
    const assessor_c_total_minutes = (20 + 20 + 12) * 60 * 1000; // ミリ秒
    const assessor_c_expected_avg_time_ms = assessor_c_total_minutes / 3;
    const assessor_c_expected_avg_time_seconds =
      (assessor_c_total_minutes / 3) / 1000;

    // ========== 査定員A の検証 ==========
    // 月間処理件数が実績と一致
    expect(result.assessors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assessor_id: "ASS001",
          assessor_name: "査定員A",
          monthly_case_count: assessor_a_expected_monthly_count,
        }),
      ])
    );

    // 平均処理時間（分単位）が正確に算出されている
    const assessor_a_result = result.assessors.find(
      (a: any) => a.assessor_id === "ASS001"
    );
    expect(assessor_a_result.average_processing_time_minutes).toBeCloseTo(
      52 / 3,
      1
    );

    // ========== 査定員B の検証 ==========
    expect(result.assessors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assessor_id: "ASS002",
          assessor_name: "査定員B",
          monthly_case_count: assessor_b_expected_monthly_count,
        }),
      ])
    );

    const assessor_b_result = result.assessors.find(
      (a: any) => a.assessor_id === "ASS002"
    );
    expect(assessor_b_result.average_processing_time_minutes).toBeCloseTo(
      33 / 2,
      1
    );

    // ========== 査定員C の検証 ==========
    expect(result.assessors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assessor_id: "ASS003",
          assessor_name: "査定員C",
          monthly_case_count: assessor_c_expected_monthly_count,
        }),
      ])
    );

    const assessor_c_result = result.assessors.find(
      (a: any) => a.assessor_id === "ASS003"
    );
    expect(assessor_c_result.average_processing_time_minutes).toBeCloseTo(
      52 / 3,
      1
    );

    // ========== 全体的な一貫性検証 ==========
    // 結果配列に3名の査定員が含まれている
    expect(result.assessors.length).toBe(3);

    // すべての査定員について月間処理件数が0より大きい
    result.assessors.forEach((assessor: any) => {
      expect(assessor.monthly_case_count).toBeGreaterThan(0);
      expect(assessor.average_processing_time_minutes).toBeGreaterThan(0);
    });

    // ========== 自動算出処理の実行記録検証 ==========
    expect(result.execution_record).toBeDefined();
    expect(result.execution_record.executed_at).toBeDefined();
    expect(result.execution_record.executed_by).toBe("system");
    expect(result.execution_record.status).toBe("success");
    expect(result.execution_record.processed_record_count).toBe(8); // 全8件のレコードを処理

    // ========== 複数回実行の一貫性確認 ==========
    // 同じ入力で再度実行
    const result_second_execution = calculateAssessorProductivityMetrics(
      input_data
    );

    // 同じ入力に対して結果が常に同じ
    const assessor_a_first = result.assessors.find(
      (a: any) => a.assessor_id === "ASS001"
    );
    const assessor_a_second = result_second_execution.assessors.find(
      (a: any) => a.assessor_id === "ASS001"
    );
    expect(assessor_a_first.monthly_case_count).toBe(
      assessor_a_second.monthly_case_count
    );
    expect(assessor_a_first.average_processing_time_minutes).toBeCloseTo(
      assessor_a_second.average_processing_time_minutes,
      5
    );

    // ========== 期間外データの除外検証 ==========
    // 期間外のレコードを追加テスト
    const out_of_period_records = [
      {
        assessor_id: "ASS001",
        assessor_name: "査定員A",
        case_id: "CASE999",
        start_time: new Date("2024-02-05T09:00:00Z"),
        end_time: new Date("2024-02-05T09:10:00Z"),
      },
    ];

    const input_with_out_of_period = {
      period_start_date: new Date("2024-01-01"),
      period_end_date: new Date("2024-01-31"),
      assessment_records: [...all_records, ...out_of_period_records],
    };

    const result_with_filter = calculateAssessorProductivityMetrics(
      input_with_out_of_period
    );

    // 期間外データが除外されたため、査定員Aの件数は変わらない
    const assessor_a_filtered = result_with_filter.assessors.find(
      (a: any) => a.assessor_id === "ASS001"
    );
    expect(assessor_a_filtered.monthly_case_count).toBe(
      assessor_a_expected_monthly_count
    );
  });
});