import { detectSalesAnomalies } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-700: [error] 営業データ異常値検出機能 - 過去の実績から著しく乖離した営業金額を異常値として検出する
  test('過去12ヶ月の営業金額実績から平均値±3標準偏差を超える異常値を検出し、HIGH警告とともに返却する', () => {
    // 過去12ヶ月の営業金額実績データを準備（月平均100万円、標準偏差10万円）
    const historical_data = [
      { month: '2023-01', amount: 990000 },
      { month: '2023-02', amount: 1010000 },
      { month: '2023-03', amount: 1005000 },
      { month: '2023-04', amount: 995000 },
      { month: '2023-05', amount: 1002000 },
      { month: '2023-06', amount: 998000 },
      { month: '2023-07', amount: 1008000 },
      { month: '2023-08', amount: 992000 },
      { month: '2023-09', amount: 1015000 },
      { month: '2023-10', amount: 987000 },
      { month: '2023-11', amount: 1020000 },
      { month: '2023-12', amount: 983000 },
    ];

    // 統計値の計算
    const mean = 1000000;
    const std_dev = 10000;
    const threshold_upper = mean + 3 * std_dev; // 1030000
    const threshold_lower = mean - 3 * std_dev; // 970000

    // 異常値検出ルール設定：平均値±3標準偏差を閾値とする
    const anomaly_rule = {
      detection_method: 'statistical',
      threshold_type: 'standard_deviation',
      deviation_multiplier: 3,
      historical_mean: mean,
      historical_std_dev: std_dev,
      threshold_upper: threshold_upper,
      threshold_lower: threshold_lower,
    };

    // 著しく乖離した営業金額（500万円）を新規データとして入力
    const new_sales_data = {
      month: '2024-01',
      amount: 5000000,
      customer_id: 'CUST-001',
      service_type: 'commission',
    };

    // 異常値検出機能を実行
    const result = detectSalesAnomalies(new_sales_data, anomaly_rule, historical_data);

    // レスポンスステータスを確認
    expect(result.status_code).toBe(200);

    // 異常値フラグが正しく設定されていることを検証
    expect(result.is_anomaly).toBe(true);

    // 検出された異常値の詳細情報を確認
    expect(result.anomaly_details).toBeDefined();
    expect(result.anomaly_details.detected_amount).toBe(5000000);
    expect(result.anomaly_details.threshold_upper).toBe(1030000);
    expect(result.anomaly_details.threshold_lower).toBe(970000);

    // 乖離率の計算検証：(5000000 - 1000000) / 1000000 = 4.0 = 400%
    expect(result.anomaly_details.deviation_percentage).toBe(400);

    // 警告レベルが HIGH として設定されていることを検証
    expect(result.anomaly_details.alert_level).toBe('HIGH');

    // システムログに異常値検出イベントが記録されていることを確認
    expect(result.log_entry).toBeDefined();
    expect(result.log_entry.event_type).toBe('anomaly_detected');
    expect(result.log_entry.customer_id).toBe('CUST-001');
    expect(result.log_entry.service_type).toBe('commission');
    expect(result.log_entry.detected_at).toBeDefined();
    expect(typeof result.log_entry.detected_at).toBe('string');
  });
});