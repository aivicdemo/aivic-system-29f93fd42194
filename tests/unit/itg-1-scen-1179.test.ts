import { determineReportDistributionSuccess } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-1179
  test('レポートが全顧客に正常配信された場合、配信成功と判定される', () => {
    // テストデータ: 複数顧客レコード（3件以上）
    const customers = [
      {
        customer_id: 'CUST001',
        customer_name: '顧客A',
        email: 'contact_a@example.com',
        contract_status: 'active',
      },
      {
        customer_id: 'CUST002',
        customer_name: '顧客B',
        email: 'contact_b@example.com',
        contract_status: 'active',
      },
      {
        customer_id: 'CUST003',
        customer_name: '顧客C',
        email: 'contact_c@example.com',
        contract_status: 'active',
      },
    ];

    // 各顧客に対するレポート配信ログ（全て成功）
    const distribution_logs = [
      {
        log_id: 'LOG001',
        customer_id: 'CUST001',
        report_id: 'RPT202501001',
        distribution_date: new Date('2025-01-31T09:00:00Z'),
        delivery_status: 'success',
        status_code: 200,
        error_message: null,
        retry_count: 0,
      },
      {
        log_id: 'LOG002',
        customer_id: 'CUST002',
        report_id: 'RPT202501001',
        distribution_date: new Date('2025-01-31T09:05:00Z'),
        delivery_status: 'success',
        status_code: 200,
        error_message: null,
        retry_count: 0,
      },
      {
        log_id: 'LOG003',
        customer_id: 'CUST003',
        report_id: 'RPT202501001',
        distribution_date: new Date('2025-01-31T09:10:00Z'),
        delivery_status: 'success',
        status_code: 200,
        error_message: null,
        retry_count: 0,
      },
    ];

    // レポート配信実行
    const distribution_input = {
      customers,
      distribution_logs,
      report_id: 'RPT202501001',
      distribution_period_start: new Date('2025-01-31T00:00:00Z'),
      distribution_period_end: new Date('2025-01-31T23:59:59Z'),
    };

    // 配信成功判定ロジックを実行
    const result = determineReportDistributionSuccess(distribution_input);

    // 配信成功フラグが『true』に設定されたことを検証
    expect(result.is_distribution_success).toBe(true);

    // 配信成功ステータス
    expect(result.distribution_status).toBe('全配信成功');

    // 全顧客へのレポート配信が完了
    expect(result.total_customers).toBe(3);
    expect(result.successful_distributions).toBe(3);
    expect(result.failed_distributions).toBe(0);

    // 配信成功率が 100%
    expect(result.success_rate).toBe(100);

    // 配信成功に関連するアラートが生成されていない
    expect(result.alerts).toEqual([]);

    // 各顧客の配信ステータスが『成功』
    expect(result.customer_delivery_statuses).toEqual([
      {
        customer_id: 'CUST001',
        delivery_status: 'success',
        error_message: null,
      },
      {
        customer_id: 'CUST002',
        delivery_status: 'success',
        error_message: null,
      },
      {
        customer_id: 'CUST003',
        delivery_status: 'success',
        error_message: null,
      },
    ]);

    // 配信成功ログが記録されたことを確認
    expect(result.completion_log).toBeDefined();
    expect(result.completion_log.completion_timestamp).toBeTruthy();
    expect(result.completion_log.completion_status).toBe('成功');
  });
});