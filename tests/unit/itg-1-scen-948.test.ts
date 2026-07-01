import { describe, test, expect } from '@jest/globals';
import { distributeBillingReportToMultipleRecipients } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-948: 複数の配信先が設定されている場合、全配信先に正しく配信される', () => {
    // テストデータ: 複数の配信先メールアドレス（3件以上）を設定した請求書
    const billing_document_id = 'DOC-2024-001';
    const document_content = {
      invoice_number: 'INV-2024-001',
      customer_id: 'CUST-001',
      service_id: 'SVC-001',
      amount: 100000,
      currency: 'JPY',
      issue_date: '2024-01-15',
      due_date: '2024-02-15',
      items: [
        { description: 'Service A', quantity: 10, unit_price: 10000 }
      ]
    };

    const recipient_list = [
      {
        email: 'primary@example.com',
        recipient_type: 'to',
        recipient_name: 'Primary Recipient'
      },
      {
        email: 'cc@example.com',
        recipient_type: 'cc',
        recipient_name: 'CC Recipient'
      },
      {
        email: 'bcc@example.com',
        recipient_type: 'bcc',
        recipient_name: 'BCC Recipient'
      }
    ];

    const distribution_request = {
      billing_document_id,
      document_content,
      recipient_list,
      send_timestamp: '2024-01-15T09:00:00Z',
      document_format: 'pdf'
    };

    // 期待結果1: 全配信先への配信が成功しログに記録される
    const result = distributeBillingReportToMultipleRecipients(distribution_request);

    expect(result.status).toBe('success');
    expect(result.total_recipients).toBe(3);
    expect(result.successful_deliveries).toBe(3);
    expect(result.failed_deliveries).toBe(0);

    // 期待結果2: 各配信先で受信ファイルの内容が完全に一致する
    expect(result.delivery_logs).toHaveLength(3);
    result.delivery_logs.forEach((log: any) => {
      expect(log.document_content_hash).toBe(result.delivery_logs[0].document_content_hash);
      expect(log.status).toBe('delivered');
    });

    // 期待結果3: 配信タイミングがほぼ同時であること（1秒以内の差分）
    const timestamps = result.delivery_logs.map((log: any) => new Date(log.delivery_timestamp).getTime());
    const time_diff_max = Math.max(...timestamps) - Math.min(...timestamps);
    expect(time_diff_max).toBeLessThanOrEqual(1000);

    // 期待結果4: 配信先タイプが正確に保存されている
    const to_recipient = result.delivery_logs.find((log: any) => log.recipient_type === 'to');
    const cc_recipient = result.delivery_logs.find((log: any) => log.recipient_type === 'cc');
    const bcc_recipient = result.delivery_logs.find((log: any) => log.recipient_type === 'bcc');

    expect(to_recipient).toBeDefined();
    expect(cc_recipient).toBeDefined();
    expect(bcc_recipient).toBeDefined();
    expect(to_recipient?.email).toBe('primary@example.com');
    expect(cc_recipient?.email).toBe('cc@example.com');
    expect(bcc_recipient?.email).toBe('bcc@example.com');

    // テスト: 配信先リストが空の場合のエラーハンドリング
    const empty_recipient_request = {
      billing_document_id: 'DOC-2024-002',
      document_content,
      recipient_list: [],
      send_timestamp: '2024-01-15T10:00:00Z',
      document_format: 'pdf'
    };

    expect(() => {
      distributeBillingReportToMultipleRecipients(empty_recipient_request);
    }).toThrow(/配信先/);

    // テスト: 無効なメールアドレスを含む場合の動作
    const mixed_recipient_list = [
      {
        email: 'valid@example.com',
        recipient_type: 'to',
        recipient_name: 'Valid Recipient'
      },
      {
        email: 'invalid-email',
        recipient_type: 'to',
        recipient_name: 'Invalid Recipient'
      },
      {
        email: 'another@example.com',
        recipient_type: 'cc',
        recipient_name: 'Another Recipient'
      }
    ];

    const mixed_request = {
      billing_document_id: 'DOC-2024-003',
      document_content,
      recipient_list: mixed_recipient_list,
      send_timestamp: '2024-01-15T11:00:00Z',
      document_format: 'pdf'
    };

    const mixed_result = distributeBillingReportToMultipleRecipients(mixed_request);

    expect(mixed_result.total_recipients).toBe(3);
    expect(mixed_result.successful_deliveries).toBe(2);
    expect(mixed_result.failed_deliveries).toBe(1);
    expect(mixed_result.delivery_logs).toHaveLength(3);

    const failed_log = mixed_result.delivery_logs.find((log: any) => log.status === 'failed');
    expect(failed_log?.email).toBe('invalid-email');
    expect(failed_log?.error_reason).toBe('無効なメールアドレス');

    // 無効なメールアドレスを含む場合でも、他の配信先への配信は継続される
    const valid_logs = mixed_result.delivery_logs.filter((log: any) => log.status === 'delivered');
    expect(valid_logs).toHaveLength(2);
    expect(valid_logs.some((log: any) => log.email === 'valid@example.com')).toBe(true);
    expect(valid_logs.some((log: any) => log.email === 'another@example.com')).toBe(true);

    // テスト: 配信先数の上限値付近（制限値の95%以上）での配信
    const max_recipients = 1000;
    const near_limit_count = Math.floor(max_recipients * 0.95); // 950件
    const near_limit_recipient_list = Array.from({ length: near_limit_count }, (_, index) => ({
      email: `recipient${index}@example.com`,
      recipient_type: 'to',
      recipient_name: `Recipient ${index}`
    }));

    const near_limit_request = {
      billing_document_id: 'DOC-2024-004',
      document_content,
      recipient_list: near_limit_recipient_list,
      send_timestamp: '2024-01-15T12:00:00Z',
      document_format: 'pdf'
    };

    const near_limit_result = distributeBillingReportToMultipleRecipients(near_limit_request);

    expect(near_limit_result.status).toBe('success');
    expect(near_limit_result.total_recipients).toBe(near_limit_count);
    expect(near_limit_result.successful_deliveries).toBe(near_limit_count);
    expect(near_limit_result.failed_deliveries).toBe(0);
    expect(near_limit_result.delivery_logs).toHaveLength(near_limit_count);

    // 上限値を超える場合のエラーハンドリング
    const over_limit_recipient_list = Array.from({ length: max_recipients + 1 }, (_, index) => ({
      email: `recipient${index}@example.com`,
      recipient_type: 'to',
      recipient_name: `Recipient ${index}`
    }));

    const over_limit_request = {
      billing_document_id: 'DOC-2024-005',
      document_content,
      recipient_list: over_limit_recipient_list,
      send_timestamp: '2024-01-15T13:00:00Z',
      document_format: 'pdf'
    };

    expect(() => {
      distributeBillingReportToMultipleRecipients(over_limit_request);
    }).toThrow(/配信先数上限/);

    // 期待結果: 全配信先への配信完了の確認
    expect(result.completion_status).toBe('all_recipients_delivered');
    expect(result.delivery_logs.every((log: any) => log.status === 'delivered')).toBe(true);
  });
});