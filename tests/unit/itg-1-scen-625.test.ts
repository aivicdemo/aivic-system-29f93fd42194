import { approveAndConfirmBillingContent } from '../../src/logic/it-1-2-1';

describe('SCEN-625: 請求内容承認・請求額確定', () => {
  test('顧客企業の営業責任者が請求内容を承認した場合、請求額が確定し支払い処理フローへ自動移行される', () => {
    // SCEN-625
    const billing_id = 'BILL-2024-001';
    const customer_id = 'CUST-A001';
    const service_id = 'SVC-APPTASK';
    const billing_amount = 150000;
    const status_before = '承認待ち';
    const status_after = '確定';
    const approval_timestamp = new Date('2024-01-15T10:30:00Z');

    const billing_content = {
      billing_id: billing_id,
      customer_id: customer_id,
      service_id: service_id,
      billing_amount: billing_amount,
      status: status_before,
      appointment_count: 50,
      contract_count: 10,
      base_unit_price: 3000,
      discount_rate: 0,
      items: [
        {
          item_id: 'ITEM-001',
          item_name: 'アポ数',
          quantity: 50,
          unit_price: 3000,
          subtotal: 150000,
        },
      ],
      created_at: new Date('2024-01-01T09:00:00Z'),
      approval_timestamp: null,
      approved_by_user_id: null,
    };

    const result = approveAndConfirmBillingContent({
      billing_id: billing_id,
      customer_id: customer_id,
      approved_by_user_id: 'USER-RESP-001',
      approval_timestamp: approval_timestamp,
    });

    expect(result.billing_id).toBe(billing_id);
    expect(result.customer_id).toBe(customer_id);
    expect(result.status).toBe(status_after);
    expect(result.approved_by_user_id).toBe('USER-RESP-001');
    expect(result.approval_timestamp).toEqual(approval_timestamp);
    expect(result.billing_amount).toBe(billing_amount);

    expect(result.payment_flow_entry).toBeDefined();
    expect(result.payment_flow_entry.payment_flow_id).toBeDefined();
    expect(result.payment_flow_entry.billing_id).toBe(billing_id);
    expect(result.payment_flow_entry.customer_id).toBe(customer_id);
    expect(result.payment_flow_entry.amount).toBe(billing_amount);
    expect(result.payment_flow_entry.status).toBe('待機中');
    expect(result.payment_flow_entry.created_at).toBeDefined();

    expect(result.system_log_entries).toBeDefined();
    expect(result.system_log_entries.length).toBeGreaterThanOrEqual(2);

    const approval_log = result.system_log_entries.find(
      (log) => log.event_type === '請求承認'
    );
    expect(approval_log).toBeDefined();
    expect(approval_log?.billing_id).toBe(billing_id);
    expect(approval_log?.user_id).toBe('USER-RESP-001');
    expect(approval_log?.timestamp).toBeDefined();

    const transition_log = result.system_log_entries.find(
      (log) => log.event_type === '支払い処理フロー自動移行'
    );
    expect(transition_log).toBeDefined();
    expect(transition_log?.billing_id).toBe(billing_id);
    expect(transition_log?.new_status).toBe('確定');
    expect(transition_log?.timestamp).toBeDefined();

    expect(result.success).toBe(true);
    expect(result.message).toBeDefined();
  });
});