import { aggregateMonthlyCaseAssessmentDashboard } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  test("SCEN-826: 月次査定実績ダッシュボード自動集計・可視化機能 - 月次査定データが不完全または欠落している場合、集計が失敗してアラートが発生する", () => {
    // 期待値計算に必要な定数定義
    const EXPECTED_INCOMPLETE_RECORD_COUNT = 3;
    const EXPECTED_MISSING_FIELDS = [
      "assessment_date",
      "assessment_amount",
      "case_id"
    ];
    const EXPECTED_ALERT_MESSAGE =
      "データが不完全です。該当レコード：3件";
    const EXPECTED_ERROR_STATUS = "VALIDATION_ERROR";

    // テストデータ: 必須フィールド欠落を含む月次査定実績レコード
    const incompleteMonthlyAssessmentData = {
      assessment_month: "2024-10",
      assessment_department: "査定部1",
      assessor_records: [
        {
          assessor_id: "ASR001",
          assessor_name: "査定員A",
          assessment_date: "2024-10-01",
          assessment_amount: 1500000,
          case_id: "CASE001",
          divergence_rate: 5.2,
          processing_time_minutes: 25,
          accuracy_score: 92
        },
        {
          assessor_id: "ASR002",
          assessor_name: "査定員B",
          // assessment_date が欠落
          assessment_amount: 2000000,
          case_id: "CASE002",
          divergence_rate: 3.1,
          processing_time_minutes: 30,
          accuracy_score: 88
        },
        {
          assessor_id: "ASR003",
          assessor_name: "査定員C",
          assessment_date: "2024-10-03",
          // assessment_amount が欠落
          case_id: "CASE003",
          divergence_rate: 7.5,
          processing_time_minutes: 35,
          accuracy_score: 85
        },
        {
          assessor_id: "ASR004",
          assessor_name: "査定員D",
          assessment_date: "2024-10-04",
          assessment_amount: 1800000,
          // case_id が欠落
          divergence_rate: 2.8,
          processing_time_minutes: 28,
          accuracy_score: 91
        },
        {
          assessor_id: "ASR005",
          assessor_name: "査定員E",
          assessment_date: "2024-10-05",
          assessment_amount: 2200000,
          case_id: "CASE005",
          divergence_rate: 4.6,
          processing_time_minutes: 32,
          accuracy_score: 89
        }
      ]
    };

    // aggregateMonthlyCaseAssessmentDashboard を呼び出し
    const result = aggregateMonthlyCaseAssessmentDashboard(
      incompleteMonthlyAssessmentData
    );

    // Assertion: 集計処理が失敗し、エラーステータスが返される
    expect(result.status).toBe(EXPECTED_ERROR_STATUS);

    // Assertion: アラート通知メッセージが正確に生成される
    expect(result.alert_message).toBe(EXPECTED_ALERT_MESSAGE);

    // Assertion: 不完全なレコード件数が正確に検出される
    expect(result.incomplete_record_count).toBe(EXPECTED_INCOMPLETE_RECORD_COUNT);

    // Assertion: 欠落フィールド一覧が正確に特定される
    expect(result.missing_fields).toEqual(
      expect.arrayContaining(EXPECTED_MISSING_FIELDS)
    );

    // Assertion: エラー詳細に不完全なレコードの行情報が記録されている
    expect(result.error_details).toBeDefined();
    expect(result.error_details.length).toBe(EXPECTED_INCOMPLETE_RECORD_COUNT);

    // Assertion: エラー詳細の最初のレコードが正確に記録されている
    expect(result.error_details[0]).toEqual({
      record_index: 1,
      assessor_id: "ASR002",
      missing_fields_in_record: ["assessment_date"]
    });

    // Assertion: エラー詳細の第二のレコードが正確に記録されている
    expect(result.error_details[1]).toEqual({
      record_index: 2,
      assessor_id: "ASR003",
      missing_fields_in_record: ["assessment_amount"]
    });

    // Assertion: エラー詳細の第三のレコードが正確に記録されている
    expect(result.error_details[2]).toEqual({
      record_index: 3,
      assessor_id: "ASR004",
      missing_fields_in_record: ["case_id"]
    });

    // Assertion: ダッシュボード集計結果が空値で返される（エラー状態）
    expect(result.dashboard_aggregation).toBeNull();

    // Assertion: エラーログが生成される
    expect(result.error_log).toBeDefined();
    expect(result.error_log).toMatch(/データ検証エラー/);

    // Assertion: 処理完了タイムスタンプが記録される
    expect(result.processed_timestamp).toBeDefined();
    expect(typeof result.processed_timestamp).toBe("string");

    // Assertion: 完全なレコード件数（5件中2件が完全）が正確に記録される
    expect(result.valid_record_count).toBe(2);

    // Assertion: エラー状態で集計がスキップされたことを確認
    expect(result.aggregation_skipped).toBe(true);
  });
});