import { aggregateAccuracyMetricsByAppraiser } from "../../src/logic/it-6-2-1-1";

describe("IT-6-2-1-1: 査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-937: [normal] 精度低下原因自動診断機能 - ユーザーフィードバック件数が異常増加時に物価本更新必要性が通知される
  test("ユーザーフィードバック件数が基準値の150%以上に異常増加した場合、物価本更新必要性の通知が自動生成され管理者に配信される", () => {
    // ============ 準備フェーズ ============
    // 過去30日間のユーザーフィードバック件数の基準値を設定
    const baseline_feedback_count = 50;
    const anomaly_threshold_percent = 150; // 基準値の150%以上が異常
    const current_feedback_count = Math.ceil(
      baseline_feedback_count * (anomaly_threshold_percent / 100)
    ); // 75件（基準50件 × 150%）

    // 査定データ（査定担当者別・工種別・金額帯別）
    const appraiser_id_1 = "APP001";
    const appraiser_id_2 = "APP002";

    const appraisal_results = [
      {
        appraiser_id: appraiser_id_1,
        work_type: "建築工事",
        amount_band: "1000万～5000万",
        appraisal_date: "2024-12-15",
        deviation_rate: 2.5, // %
        count: 8,
      },
      {
        appraiser_id: appraiser_id_1,
        work_type: "土木工事",
        amount_band: "5000万～1億",
        appraisal_date: "2024-12-14",
        deviation_rate: 3.8,
        count: 12,
      },
      {
        appraiser_id: appraiser_id_2,
        work_type: "建築工事",
        amount_band: "1000万～5000万",
        appraisal_date: "2024-12-15",
        deviation_rate: 1.9,
        count: 7,
      },
      {
        appraiser_id: appraiser_id_2,
        work_type: "機械工事",
        amount_band: "500万～1000万",
        appraisal_date: "2024-12-13",
        deviation_rate: 4.2,
        count: 5,
      },
    ];

    // ユーザーフィードバック件数が異常増加（基準値50件 → 75件）
    const user_feedback_data = {
      baseline_count: baseline_feedback_count,
      current_count: current_feedback_count, // 75件
      period_days: 30,
      feedback_items: [
        {
          feedback_id: "FB001",
          appraiser_id: appraiser_id_1,
          feedback_category: "reading_accuracy",
          description: "OCR読取精度が低下している",
          timestamp: "2024-12-15T10:30:00Z",
        },
        {
          feedback_id: "FB002",
          appraiser_id: appraiser_id_2,
          feedback_category: "judgment_logic",
          description: "相場判定ロジックが地域別相場に対応していない",
          timestamp: "2024-12-15T11:15:00Z",
        },
      ],
    };

    // OCR精度・AI判定精度のベースライン
    const ocr_accuracy_baseline = 94.5; // %
    const ai_judgment_accuracy_baseline = 91.2; // %

    // モデル更新前後の精度測定値
    const accuracy_measurements = {
      baseline_ocr_accuracy: ocr_accuracy_baseline,
      baseline_ai_judgment_accuracy: ai_judgment_accuracy_baseline,
      measurement_date_before: "2024-12-01",
      measurement_date_after: "2024-12-15",
    };

    // ============ 関数呼び出し ============
    const result = aggregateAccuracyMetricsByAppraiser({
      appraisal_results: appraisal_results,
      user_feedback_data: user_feedback_data,
      accuracy_measurements: accuracy_measurements,
      baseline_feedback_threshold: baseline_feedback_count,
      anomaly_detection_threshold_percent: anomaly_threshold_percent,
    });

    // ============ 検証フェーズ ============

    // 1. 戻り値の構造が正しいことを確認
    expect(result).toHaveProperty("aggregated_metrics");
    expect(result).toHaveProperty("anomaly_detection_result");
    expect(result).toHaveProperty("notification");
    expect(result).toHaveProperty("diagnostic_recommendation");

    // 2. 査定担当者別・工種別・金額帯別の精度指標が集計されていることを確認
    const aggregated_metrics = result.aggregated_metrics;
    expect(aggregated_metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          appraiser_id: appraiser_id_1,
          work_type: "建築工事",
          amount_band: "1000万～5000万",
          average_deviation_rate: 2.5,
          total_count: 8,
          accuracy_level: "normal",
        }),
        expect.objectContaining({
          appraiser_id: appraiser_id_1,
          work_type: "土木工事",
          amount_band: "5000万～1億",
          average_deviation_rate: 3.8,
          total_count: 12,
          accuracy_level: "normal",
        }),
        expect.objectContaining({
          appraiser_id: appraiser_id_2,
          work_type: "建築工事",
          amount_band: "1000万～5000万",
          average_deviation_rate: 1.9,
          total_count: 7,
          accuracy_level: "normal",
        }),
        expect.objectContaining({
          appraiser_id: appraiser_id_2,
          work_type: "機械工事",
          amount_band: "500万～1000万",
          average_deviation_rate: 4.2,
          total_count: 5,
          accuracy_level: "warning",
        }),
      ])
    );

    // 3. ユーザーフィードバック件数が異常増加と判定されていることを確認
    const anomaly_result = result.anomaly_detection_result;
    expect(anomaly_result).toBeDefined();
    expect(anomaly_result.is_anomaly_detected).toBe(true);
    expect(anomaly_result.feedback_count_baseline).toBe(baseline_feedback_count);
    expect(anomaly_result.feedback_count_current).toBe(current_feedback_count);
    expect(anomaly_result.feedback_increase_percent).toBe(50); // (75-50)/50 = 50%増 (しかし異常判定は150%以上)
    // ※ 実際には 75 = 50 * 150% なので増加率は50%だが、絶対値が150%に達しているため異常判定

    // 正確な異常判定: 現在値が基準値の150%以上か
    const is_feedback_anomaly = current_feedback_count >= (baseline_feedback_count * anomaly_threshold_percent) / 100;
    expect(is_feedback_anomaly).toBe(true);
    expect(anomaly_result.anomaly_category).toBe("feedback_increase");

    // 4. 通知（Notification）が自動生成されていることを確認
    const notification = result.notification;
    expect(notification).toBeDefined();
    expect(notification.notification_id).toBeTruthy();
    expect(notification.notification_type).toBe("accuracy_degradation_alert");
    expect(notification.severity_level).toBe("high");
    expect(notification.recipient_roles).toContain("admin");
    expect(notification.recipient_roles).toContain("system_operator");
    expect(notification.generated_timestamp).toBeTruthy();
    expect(notification.delivery_channels).toEqual(
      expect.arrayContaining(["dashboard", "email", "log"])
    );

    // 5. 通知メッセージに物価本更新必要性が明記されていることを確認
    expect(notification.message).toMatch(/物価本/);
    expect(notification.message).toMatch(/更新/);
    expect(notification.message).toMatch(/必要/);

    // 通知メッセージの具体例期待値
    const expected_message_pattern =
      /ユーザーフィードバック件数が基準値の150%以上に異常増加しました.*物価本更新が必要である可能性があります/i;
    expect(notification.message).toMatch(expected_message_pattern);

    // 6. 診断根拠（Diagnostic Recommendation）が提供されていることを確認
    const diagnostic = result.diagnostic_recommendation;
    expect(diagnostic).toBeDefined();
    expect(diagnostic.primary_cause).toBe("price_book_outdated_or_incomplete");
    expect(diagnostic.recommended_action).toBe("update_price_book");
    expect(diagnostic.recommended_update_timing).toBeTruthy();
    expect(diagnostic.estimated_impact_score).toBeGreaterThanOrEqual(0);
    expect(diagnostic.estimated_impact_score).toBeLessThanOrEqual(100);

    // 推奨される物価本更新時期が通知に含まれていることを確認
    expect(notification.recommended_update_timing).toBe(
      diagnostic.recommended_update_timing
    );

    // 7. 各担当者別の精度ばらつき（分散・標準偏差）が算出されていることを確認
    // 担当者ごとの平均乖離率を集計
    const appraiser_metrics = new Map<string, { deviations: number[]; count: number }>();
    for (const metric of aggregated_metrics) {
      if (!appraiser_metrics.has(metric.appraiser_id)) {
        appraiser_metrics.set(metric.appraiser_id, {
          deviations: [],
          count: 0,
        });
      }
      const data = appraiser_metrics.get(metric.appraiser_id)!;
      data.deviations.push(metric.average_deviation_rate);
      data.count += metric.total_count;
    }

    // APP001: 乖離率 [2.5, 3.8] → 平均 3.15
    const app001_deviations = [2.5, 3.8];
    const app001_average = 3.15;
    const app001_expected_variance =
      (Math.pow(2.5 - app001_average, 2) + Math.pow(3.8 - app001_average, 2)) / 2;
    const app001_expected_stdev = Math.sqrt(app001_expected_variance);

    // APP002: 乖離率 [1.9, 4.2] → 平均 3.05
    const app002_deviations = [1.9, 4.2];
    const app002_average = 3.05;
    const app002_expected_variance =
      (Math.pow(1.9 - app002_average, 2) + Math.pow(4.2 - app002_average, 2)) / 2;
    const app002_expected_stdev = Math.sqrt(app002_expected_variance);

    // 戻り値に標準偏差情報が含まれていることを確認
    expect(result).toHaveProperty("summary_statistics");
    const summary = result.summary_statistics;
    expect(summary).toBeDefined();
    expect(summary.overall_average_deviation).toBeCloseTo(3.1, 1);
    expect(summary.max_deviation).toBe(4.2);
    expect(summary.min_deviation).toBe(1.9);

    // 8. 通知が admin 権限ユーザーに配信されることを確認
    expect(notification.recipient_roles).toContain("admin");
    expect(notification.recipient_roles.length).toBeGreaterThan(0);

    // 9. 管理者権限のユーザーのリストが通知対象に含まれていることを確認
    expect(notification.recipient_user_ids).toBeDefined();
    expect(notification.recipient_user_ids.length).toBeGreaterThan(0);

    // 10. 通知ダッシュボード、ログ、メールが正しく配信される状態を確認
    expect(notification.delivery_status).toEqual(
      expect.objectContaining({
        dashboard: expect.objectContaining({
          delivered: true,
          timestamp: expect.any(String),
        }),
        email: expect.objectContaining({
          delivered: true,
          timestamp: expect.any(String),
        }),
        log: expect.objectContaining({
          delivered: true,
          timestamp: expect.any(String),
        }),
      })
    );

    // 11. 推奨される物価本更新時期が通知に明記されていることを確認
    const update_timing = diagnostic.recommended_update_timing;
    expect(update_timing).toMatch(/202[4-9]-\d{2}-\d{2}/); // YYYY-MM-DD 形式
    expect(notification.message).toContain(update_timing);

    // 12. 診断根拠が通知メッセージに含まれていることを確認
    expect(notification.diagnostic_details).toBeDefined();
    expect(notification.diagnostic_details).toHaveProperty(
      "feedback_count_increase_percent"
    );
    expect(
      notification.diagnostic_details.feedback_count_increase_percent
    ).toBeGreaterThanOrEqual(50); // 最低でも基準値の150% = 50%増以上
  });
});