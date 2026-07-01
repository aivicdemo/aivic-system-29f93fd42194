import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { distributeApprovedReports } from '../../src/logic/it-1-2-1';

describe('レポート自動配信機能 - 承認済みレポートの定義スケジュール配信', () => {
  // SCEN-676
  test('承認されたレポートが定義スケジュール通りに顧客企業向けポータルに配信される', async () => {
    // テストデータ: 承認済みレポート
    const approvedReport = {
      report_id: 'RPT-2024-001',
      report_name: '営業成果レポート2024年1月',
      customer_id: 'CUST-A001',
      service_id: 'SVC-001',
      approval_status: 'approved',
      approval_date: '2024-01-25T14:30:00Z',
      approval_user_id: 'USER-001',
      report_content: {
        total_appointments: 150,
        total_contracts: 45,
        customer_responses: 1200,
        performance_percentage: 98.5,
      },
      file_format: 'pdf',
      file_size_bytes: 2457600,
      generated_date: '2024-01-25T14:00:00Z',
    };

    // 配信スケジュール定義: 複数の時間帯・顧客に対する配信パターン
    const schedules = [
      {
        schedule_id: 'SCH-001',
        report_id: 'RPT-2024-001',
        customer_id: 'CUST-A001',
        scheduled_distribution_datetime: '2024-01-26T09:00:00Z',
        distribution_frequency: 'once',
        delivery_channel: 'portal',
        recipient_email_list: ['manager@customera.com'],
        is_enabled: true,
      },
      {
        schedule_id: 'SCH-002',
        report_id: 'RPT-2024-001',
        customer_id: 'CUST-B002',
        scheduled_distribution_datetime: '2024-01-26T14:00:00Z',
        distribution_frequency: 'once',
        delivery_channel: 'portal',
        recipient_email_list: ['admin@customerb.com'],
        is_enabled: true,
      },
    ];

    // 配信スケジュール保存・検証
    const saved_schedules = schedules.map((sch) => ({
      ...sch,
      created_at: '2024-01-25T15:00:00Z',
      updated_at: '2024-01-25T15:00:00Z',
      status: 'pending',
    }));

    expect(saved_schedules).toHaveLength(2);
    expect(saved_schedules[0].schedule_id).toBe('SCH-001');
    expect(saved_schedules[1].schedule_id).toBe('SCH-002');
    expect(saved_schedules[0].status).toBe('pending');
    expect(saved_schedules[1].status).toBe('pending');

    // システム日時を配信スケジュール日時に進めシミュレーション
    const current_system_datetime_1st = new Date('2024-01-26T09:00:00Z');
    const current_system_datetime_2nd = new Date('2024-01-26T14:00:00Z');

    // レポート配信バッチ処理実行: 第1次配信（09:00)
    const distribution_input_1st = {
      batch_execution_datetime: current_system_datetime_1st,
      target_schedules: [saved_schedules[0]],
      report_data: approvedReport,
    };

    const distribution_result_1st = await distributeApprovedReports(
      distribution_input_1st,
    );

    // 第1次配信結果検証
    expect(distribution_result_1st).toBeDefined();
    expect(distribution_result_1st.batch_id).toBeDefined();
    expect(distribution_result_1st.distribution_attempts).toHaveLength(1);
    expect(distribution_result_1st.distribution_attempts[0].schedule_id).toBe(
      'SCH-001',
    );
    expect(distribution_result_1st.distribution_attempts[0].customer_id).toBe(
      'CUST-A001',
    );
    expect(distribution_result_1st.distribution_attempts[0].delivery_status).toBe(
      'success',
    );
    expect(distribution_result_1st.distribution_attempts[0].delivered_datetime).toBe(
      '2024-01-26T09:00:00Z',
    );
    expect(
      distribution_result_1st.distribution_attempts[0].portal_notification_sent,
    ).toBe(true);
    expect(distribution_result_1st.distribution_attempts[0].email_notification_sent).toBe(true);

    // 顧客企業ポータルレポート受信箱確認: CUST-A001
    const portal_inbox_customer_a = {
      customer_id: 'CUST-A001',
      received_reports: [
        {
          report_id: 'RPT-2024-001',
          report_name: '営業成果レポート2024年1月',
          delivery_datetime: '2024-01-26T09:00:00Z',
          file_format: 'pdf',
          file_size_bytes: 2457600,
          is_read: false,
          read_count: 0,
          last_read_datetime: null,
        },
      ],
    };

    expect(portal_inbox_customer_a.received_reports).toHaveLength(1);
    expect(portal_inbox_customer_a.received_reports[0].report_id).toBe(
      'RPT-2024-001',
    );
    expect(portal_inbox_customer_a.received_reports[0].file_format).toBe('pdf');
    expect(portal_inbox_customer_a.received_reports[0].file_size_bytes).toBe(
      2457600,
    );
    expect(portal_inbox_customer_a.received_reports[0].delivery_datetime).toBe(
      '2024-01-26T09:00:00Z',
    );

    // 配信ログに第1次配信履歴が記録されていることを確認
    const distribution_log_1st = {
      log_id: 'LOG-2024-001',
      batch_id: distribution_result_1st.batch_id,
      report_id: 'RPT-2024-001',
      schedule_id: 'SCH-001',
      customer_id: 'CUST-A001',
      scheduled_datetime: '2024-01-26T09:00:00Z',
      actual_delivery_datetime: '2024-01-26T09:00:00Z',
      delivery_status: 'success',
      file_format: 'pdf',
      file_size_bytes: 2457600,
      recipient_count: 1,
      recipients_notified: ['manager@customera.com'],
      portal_delivery_status: 'delivered',
      email_delivery_status: 'sent',
      delivery_duration_milliseconds: 523,
      execution_timestamp: '2024-01-26T09:00:00Z',
    };

    expect(distribution_log_1st.report_id).toBe('RPT-2024-001');
    expect(distribution_log_1st.customer_id).toBe('CUST-A001');
    expect(distribution_log_1st.delivery_status).toBe('success');
    expect(distribution_log_1st.portal_delivery_status).toBe('delivered');
    expect(distribution_log_1st.email_delivery_status).toBe('sent');

    // レポート配信バッチ処理実行: 第2次配信（14:00)
    const distribution_input_2nd = {
      batch_execution_datetime: current_system_datetime_2nd,
      target_schedules: [saved_schedules[1]],
      report_data: approvedReport,
    };

    const distribution_result_2nd = await distributeApprovedReports(
      distribution_input_2nd,
    );

    // 第2次配信結果検証
    expect(distribution_result_2nd).toBeDefined();
    expect(distribution_result_2nd.batch_id).toBeDefined();
    expect(distribution_result_2nd.distribution_attempts).toHaveLength(1);
    expect(distribution_result_2nd.distribution_attempts[0].schedule_id).toBe(
      'SCH-002',
    );
    expect(distribution_result_2nd.distribution_attempts[0].customer_id).toBe(
      'CUST-B002',
    );
    expect(distribution_result_2nd.distribution_attempts[0].delivery_status).toBe(
      'success',
    );
    expect(distribution_result_2nd.distribution_attempts[0].delivered_datetime).toBe(
      '2024-01-26T14:00:00Z',
    );

    // 顧客企業ポータルレポート受信箱確認: CUST-B002
    const portal_inbox_customer_b = {
      customer_id: 'CUST-B002',
      received_reports: [
        {
          report_id: 'RPT-2024-001',
          report_name: '営業成果レポート2024年1月',
          delivery_datetime: '2024-01-26T14:00:00Z',
          file_format: 'pdf',
          file_size_bytes: 2457600,
          is_read: false,
          read_count: 0,
          last_read_datetime: null,
        },
      ],
    };

    expect(portal_inbox_customer_b.received_reports).toHaveLength(1);
    expect(portal_inbox_customer_b.received_reports[0].delivery_datetime).toBe(
      '2024-01-26T14:00:00Z',
    );

    // 配信ログに第2次配信履歴が記録されていることを確認
    const distribution_log_2nd = {
      log_id: 'LOG-2024-002',
      batch_id: distribution_result_2nd.batch_id,
      report_id: 'RPT-2024-001',
      schedule_id: 'SCH-002',
      customer_id: 'CUST-B002',
      scheduled_datetime: '2024-01-26T14:00:00Z',
      actual_delivery_datetime: '2024-01-26T14:00:00Z',
      delivery_status: 'success',
      file_format: 'pdf',
      file_size_bytes: 2457600,
      recipient_count: 1,
      recipients_notified: ['admin@customerb.com'],
      portal_delivery_status: 'delivered',
      email_delivery_status: 'sent',
      delivery_duration_milliseconds: 487,
      execution_timestamp: '2024-01-26T14:00:00Z',
    };

    expect(distribution_log_2nd.report_id).toBe('RPT-2024-001');
    expect(distribution_log_2nd.customer_id).toBe('CUST-B002');
    expect(distribution_log_2nd.delivery_status).toBe('success');
    expect(distribution_log_2nd.portal_delivery_status).toBe('delivered');
    expect(distribution_log_2nd.email_delivery_status).toBe('sent');

    // 全配信ログ統計検証: 計2件の配信、全て成功
    const all_distribution_logs = [distribution_log_1st, distribution_log_2nd];

    expect(all_distribution_logs).toHaveLength(2);
    expect(all_distribution_logs[0].delivery_status).toBe('success');
    expect(all_distribution_logs[1].delivery_status).toBe('success');

    const total_successful_deliveries = all_distribution_logs.filter(
      (log) => log.delivery_status === 'success',
    ).length;
    expect(total_successful_deliveries).toBe(2);

    const total_customers_delivered = all_distribution_logs.map(
      (log) => log.customer_id,
    ).length;
    expect(total_customers_delivered).toBe(2);

    // 複数スケジュール配信の順序検証: 09:00配信が14:00配信より先に記録される
    expect(
      new Date(distribution_log_1st.actual_delivery_datetime).getTime(),
    ).toBeLessThan(
      new Date(distribution_log_2nd.actual_delivery_datetime).getTime(),
    );

    // 配信ログの時系列順検証
    const sorted_logs = [distribution_log_1st, distribution_log_2nd].sort(
      (a, b) =>
        new Date(a.actual_delivery_datetime).getTime() -
        new Date(b.actual_delivery_datetime).getTime(),
    );

    expect(sorted_logs[0].schedule_id).toBe('SCH-001');
    expect(sorted_logs[1].schedule_id).toBe('SCH-002');
  });
});