import { approveInvoiceInfo } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1270
  test('[normal] 請求情報最終承認機能 - 承認済みステータスで会計システムへのAPI連携へ進む', async () => {
    const fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();
    fetchMock.resetMocks();

    const input_invoice_info = {
      invoice_id: 'INV-2024-001-CUST-A-SRV-X',
      customer_id: 'CUST-A',
      service_id: 'SRV-X',
      billing_period_start: '2024-01-01',
      billing_period_end: '2024-01-31',
      base_amount: 100000,
      discount_amount: 10000,
      final_amount: 90000,
      status: 'pending_approval',
      approved_by: null,
      approved_at: null,
      api_sync_status: 'not_synced',
    };

    const expected_accounting_system_payload = {
      invoice_id: 'INV-2024-001-CUST-A-SRV-X',
      customer_id: 'CUST-A',
      service_id: 'SRV-X',
      billing_period_start: '2024-01-01',
      billing_period_end: '2024-01-31',
      final_amount: 90000,
      sync_timestamp: expect.any(String),
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        sync_id: 'SYNC-2024-001-001',
        received_at: '2024-02-05T09:00:00Z',
      }),
      { status: 200 }
    );

    const result = await approveInvoiceInfo({
      invoice_id: input_invoice_info.invoice_id,
      customer_id: input_invoice_info.customer_id,
      service_id: input_invoice_info.service_id,
      billing_period_start: input_invoice_info.billing_period_start,
      billing_period_end: input_invoice_info.billing_period_end,
      base_amount: input_invoice_info.base_amount,
      discount_amount: input_invoice_info.discount_amount,
      final_amount: input_invoice_info.final_amount,
      current_status: input_invoice_info.status,
      approved_by_user_id: 'USR-REP-001',
      approval_timestamp: '2024-02-05T08:30:00Z',
    });

    expect(result.status).toBe('approval_success');
    expect(result.invoice_status).toBe('approved');
    expect(result.approved_by_user_id).toBe('USR-REP-001');
    expect(result.approved_at).toBe('2024-02-05T08:30:00Z');

    expect(result.api_sync_initiated).toBe(true);
    expect(result.api_sync_status).toBe('syncing');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call_args = fetchMock.mock.calls[0];
    expect(call_args[0]).toBe('https://accounting-system.example.com/api/v1/invoices/sync');
    expect(call_args[1].method).toBe('POST');
    expect(call_args[1].headers['Content-Type']).toBe('application/json');

    const sent_payload = JSON.parse(call_args[1].body);
    expect(sent_payload.invoice_id).toBe(expected_accounting_system_payload.invoice_id);
    expect(sent_payload.customer_id).toBe(expected_accounting_system_payload.customer_id);
    expect(sent_payload.service_id).toBe(expected_accounting_system_payload.service_id);
    expect(sent_payload.final_amount).toBe(expected_accounting_system_payload.final_amount);
    expect(sent_payload.sync_timestamp).toBeDefined();

    expect(result.accounting_system_response.success).toBe(true);
    expect(result.accounting_system_response.sync_id).toBe('SYNC-2024-001-001');
    expect(result.accounting_system_response.received_at).toBe('2024-02-05T09:00:00Z');

    expect(result.final_amount).toBe(90000);
    expect(result.discount_amount).toBe(10000);
  });
});