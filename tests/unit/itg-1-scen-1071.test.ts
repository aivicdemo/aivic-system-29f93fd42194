import { notifyContractOrDeliverableChange } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-1071
  test('契約内容または成果物納期の変更を検知し、顧客企業営業責任者へメール通知が送信される', () => {
    const existing_contract = {
      contract_id: 'CT-2024-001',
      customer_name: 'テスト顧客企業',
      contract_amount: 1000000,
      delivery_date: '2024-06-30',
      responsible_email: 'sales@customer.example.com',
      responsible_name: '営業責任者 太郎',
    };

    const change_data_contract_amount = {
      contract_id: 'CT-2024-001',
      field_name: 'contract_amount',
      old_value: 1000000,
      new_value: 1500000,
      changed_at: '2024-05-15T10:30:00Z',
      changed_by: 'operator@company.example.com',
    };

    const change_data_delivery_date = {
      contract_id: 'CT-2024-001',
      field_name: 'delivery_date',
      old_value: '2024-06-30',
      new_value: '2024-07-31',
      changed_at: '2024-05-15T11:00:00Z',
      changed_by: 'operator@company.example.com',
    };

    const mail_result_contract = notifyContractOrDeliverableChange(
      existing_contract,
      change_data_contract_amount
    );

    expect(mail_result_contract).toEqual({
      success: true,
      mail_sent: true,
      recipient_email: 'sales@customer.example.com',
      recipient_name: '営業責任者 太郎',
      subject: '【契約内容変更通知】CT-2024-001 テスト顧客企業',
      change_field: 'contract_amount',
      old_value: 1000000,
      new_value: 1500000,
      changed_at: '2024-05-15T10:30:00Z',
      mail_body_contains: ['契約金額', '100万円', '150万円', '2024-05-15'],
      notification_id: expect.any(String),
      sent_timestamp: expect.any(String),
    });

    const mail_result_delivery = notifyContractOrDeliverableChange(
      existing_contract,
      change_data_delivery_date
    );

    expect(mail_result_delivery).toEqual({
      success: true,
      mail_sent: true,
      recipient_email: 'sales@customer.example.com',
      recipient_name: '営業責任者 太郎',
      subject: '【成果物納期変更通知】CT-2024-001 テスト顧客企業',
      change_field: 'delivery_date',
      old_value: '2024-06-30',
      new_value: '2024-07-31',
      changed_at: '2024-05-15T11:00:00Z',
      mail_body_contains: [
        '納期',
        '2024年6月30日',
        '2024年7月31日',
        '2024-05-15',
      ],
      notification_id: expect.any(String),
      sent_timestamp: expect.any(String),
    });

    expect(mail_result_contract.mail_sent).toBe(true);
    expect(mail_result_delivery.mail_sent).toBe(true);
    expect(mail_result_contract.recipient_email).toBe(
      'sales@customer.example.com'
    );
    expect(mail_result_delivery.recipient_email).toBe(
      'sales@customer.example.com'
    );
  });
});