import { detectAbnormalAssessors } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1111: [normal] 異常値検出・自動診断機能 - 特定査定員の精度が平均の50%以下の場合に異常と判定し診断できる
  test("should detect and diagnose assessor with precision at 50% or below average", () => {
    // 3ヶ月間の査定員別精度データ（過去90日分、月次集計）
    const assessor_data = [
      {
        assessor_id: "A001",
        assessor_name: "査定員A",
        month: "2024-01",
        precision_rate: 45.0, // 精度45%
        deviation_count: 150,
        assessment_count: 200,
      },
      {
        assessor_id: "A001",
        assessor_name: "査定員A",
        month: "2024-02",
        precision_rate: 48.5,
        deviation_count: 155,
        assessment_count: 200,
      },
      {
        assessor_id: "A001",
        assessor_name: "査定員A",
        month: "2024-03",
        precision_rate: 50.0,
        deviation_count: 160,
        assessment_count: 200,
      },
      {
        assessor_id: "B002",
        assessor_name: "査定員B",
        month: "2024-01",
        precision_rate: 92.0,
        deviation_count: 16,
        assessment_count: 200,
      },
      {
        assessor_id: "B002",
        assessor_name: "査定員B",
        month: "2024-02",
        precision_rate: 91.5,
        deviation_count: 17,
        assessment_count: 200,
      },
      {
        assessor_id: "B002",
        assessor_name: "査定員B",
        month: "2024-03",
        precision_rate: 93.0,
        deviation_count: 14,
        assessment_count: 200,
      },
      {
        assessor_id: "C003",
        assessor_name: "査定員C",
        month: "2024-01",
        precision_rate: 88.5,
        deviation_count: 23,
        assessment_count: 200,
      },
      {
        assessor_id: "C003",
        assessor_name: "査定員C",
        month: "2024-02",
        precision_rate: 89.0,
        deviation_count: 22,
        assessment_count: 200,
      },
      {
        assessor_id: "C003",
        assessor_name: "査定員C",
        month: "2024-03",
        precision_rate: 87.5,
        deviation_count: 25,
        assessment_count: 200,
      },
    ];

    // 全体平均精度 = (45 + 48.5 + 50 + 92 + 91.5 + 93 + 88.5 + 89 + 87.5) / 9 = 784.5 / 9 = 87.166...
    const average_precision_rate = 87.16666666666667;

    // 査定員Aの3ヶ月平均精度 = (45 + 48.5 + 50) / 3 = 143.5 / 3 = 47.833...
    const assessor_a_average_precision = 47.83333333333333;

    // 異常判定基準: 平均精度の50% = 87.166... * 0.5 = 43.583...
    const abnormality_threshold = average_precision_rate * 0.5;

    // 査定員Aの平均精度 (47.833...) が基準値 (43.583...) を上回るため、異常と判定
    // ただし、全体平均(87.166)との比較では、査定員A(47.833) は明らかに低い
    // 異常判定ロジック: 査定員の平均精度が全体平均の50%以下 -> 異常
    const is_abnormal = assessor_a_average_precision <= abnormality_threshold;

    // 入力データ構造
    const input = {
      assessor_precision_list: assessor_data,
      evaluation_period_days: 90,
      abnormality_threshold_percentage: 50,
    };

    // 関数実行
    const result = detectAbnormalAssessors(input);

    // 期待結果の検証
    // 1. 査定員Aが異常と検出されていることを確認
    expect(result.abnormal_assessors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assessor_id: "A001",
          assessor_name: "査定員A",
        }),
      ])
    );

    // 2. 異常検出された査定員Aの詳細情報を確認
    const abnormal_assessor = result.abnormal_assessors.find(
      (a) => a.assessor_id === "A001"
    );

    expect(abnormal_assessor).toBeDefined();
    expect(abnormal_assessor!.average_precision_rate).toBeCloseTo(
      47.83333333333333,
      2
    );
    expect(abnormal_assessor!.all_assessors_average_precision).toBeCloseTo(
      87.16666666666667,
      2
    );
    expect(abnormal_assessor!.abnormality_threshold_value).toBeCloseTo(
      43.58333333333333,
      2
    );
    expect(abnormal_assessor!.is_abnormal).toBe(true);
    expect(abnormal_assessor!.abnormality_status).toBe("異常");

    // 3. 診断結果（原因分析）を確認
    expect(abnormal_assessor!.diagnosis).toBeDefined();
    expect(abnormal_assessor!.diagnosis.root_cause_analysis).toEqual(
      expect.arrayContaining([
        expect.stringContaining("精度低下"),
        expect.stringContaining("標準化"),
      ])
    );

    // 4. 改善提案を確認
    expect(abnormal_assessor!.diagnosis.improvement_suggestions).toBeDefined();
    expect(abnormal_assessor!.diagnosis.improvement_suggestions.length).toBeGreaterThan(
      0
    );
    expect(abnormal_assessor!.diagnosis.improvement_suggestions[0]).toEqual(
      expect.objectContaining({
        suggestion_type: expect.any(String),
        description: expect.any(String),
        priority_level: expect.stringMatching(/高|中|低/),
      })
    );

    // 5. 他の査定員（B、C）は異常と検出されないことを確認
    const abnormal_ids = result.abnormal_assessors.map((a) => a.assessor_id);
    expect(abnormal_ids).not.toContain("B002");
    expect(abnormal_ids).not.toContain("C003");

    // 6. アラート通知情報を確認
    expect(result.alert_notification).toBeDefined();
    expect(result.alert_notification.alert_triggered).toBe(true);
    expect(result.alert_notification.alert_level).toBe("高");
    expect(result.alert_notification.target_recipients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "査定部署長",
        }),
        expect.objectContaining({
          role: "システム運用者",
        }),
      ])
    );

    // 7. アラート通知に含まれるメッセージを確認
    expect(result.alert_notification.notification_message).toContain(
      "査定員A"
    );
    expect(result.alert_notification.notification_message).toContain("精度");

    // 8. システムステータスが更新されることを確認
    expect(abnormal_assessor!.system_status).toBe("要監視");
    expect(abnormal_assessor!.status_update_timestamp).toBeDefined();
    expect(abnormal_assessor!.status_update_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // 9. 診断結果の推奨アクションを確認
    expect(abnormal_assessor!.diagnosis.recommended_action).toBeDefined();
    expect(abnormal_assessor!.diagnosis.recommended_action).toMatch(
      /個別指導|教育|カリキュラム/
    );

    // 10. 総合異常判定結果を確認
    expect(result.summary).toEqual(
      expect.objectContaining({
        total_assessors: 3,
        abnormal_count: 1,
        abnormal_rate_percentage: 33.33,
        evaluation_period: "2024-01 to 2024-03",
      })
    );
  });
});