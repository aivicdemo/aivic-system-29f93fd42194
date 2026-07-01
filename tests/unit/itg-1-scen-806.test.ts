import { searchMailHistoriesByFilters } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - メール履歴検索・フィルタリング', () => {
  // SCEN-806: [normal] メール履歴検索・フィルタリング機能 - 顧客ID・契約ID・日付範囲の条件に合致するメール履歴が抽出される
  test('should extract mail histories matching all specified filter conditions (customer_id, contract_id, date range)', () => {
    const mock_mail_histories = [
      {
        mail_history_id: 'MH001',
        customer_id: 'C001',
        contract_id: 'CT001',
        sent_date: new Date('2024-01-15T10:30:00Z'),
        sender: 'sales@company.com',
        recipient: 'customer1@example.com',
        subject: 'Contract Update Notification',
        body: 'Your contract has been updated.',
      },
      {
        mail_history_id: 'MH002',
        customer_id: 'C001',
        contract_id: 'CT001',
        sent_date: new Date('2024-01-20T14:00:00Z'),
        sender: 'sales@company.com',
        recipient: 'customer1@example.com',
        subject: 'Delivery Notice',
        body: 'Deliverable ready for review.',
      },
      {
        mail_history_id: 'MH003',
        customer_id: 'C001',
        contract_id: 'CT002',
        sent_date: new Date('2024-01-25T09:00:00Z'),
        sender: 'sales@company.com',
        recipient: 'customer1@example.com',
        subject: 'Invoice Notification',
        body: 'Your invoice is ready.',
      },
      {
        mail_history_id: 'MH004',
        customer_id: 'C002',
        contract_id: 'CT001',
        sent_date: new Date('2024-01-18T11:00:00Z'),
        sender: 'sales@company.com',
        recipient: 'customer2@example.com',
        subject: 'Contract Update Notification',
        body: 'Your contract has been updated.',
      },
      {
        mail_history_id: 'MH005',
        customer_id: 'C001',
        contract_id: 'CT001',
        sent_date: new Date('2024-02-05T16:30:00Z'),
        sender: 'sales@company.com',
        recipient: 'customer1@example.com',
        subject: 'Monthly Report',
        body: 'Your monthly sales report is attached.',
      },
    ];

    const filter_params = {
      customer_id: 'C001',
      contract_id: 'CT001',
      start_date: new Date('2024-01-10T00:00:00Z'),
      end_date: new Date('2024-01-31T23:59:59Z'),
    };

    const result = searchMailHistoriesByFilters(mock_mail_histories, filter_params);

    // Expected: MH001, MH002 (both match C001, CT001, and fall within 2024-01-10 to 2024-01-31)
    // Not expected: MH003 (different CT002), MH004 (different C002), MH005 (outside date range 2024-02-05)

    expect(result).toEqual([
      {
        mail_history_id: 'MH001',
        customer_id: 'C001',
        contract_id: 'CT001',
        sent_date: new Date('2024-01-15T10:30:00Z'),
        sender: 'sales@company.com',
        recipient: 'customer1@example.com',
        subject: 'Contract Update Notification',
        body: 'Your contract has been updated.',
      },
      {
        mail_history_id: 'MH002',
        customer_id: 'C001',
        contract_id: 'CT001',
        sent_date: new Date('2024-01-20T14:00:00Z'),
        sender: 'sales@company.com',
        recipient: 'customer1@example.com',
        subject: 'Delivery Notice',
        body: 'Deliverable ready for review.',
      },
    ]);

    expect(result.length).toBe(2);

    result.forEach((mail) => {
      expect(mail.customer_id).toBe('C001');
      expect(mail.contract_id).toBe('CT001');
      expect(mail.sent_date.getTime()).toBeGreaterThanOrEqual(filter_params.start_date.getTime());
      expect(mail.sent_date.getTime()).toBeLessThanOrEqual(filter_params.end_date.getTime());
    });

    const unmatched_ids = ['MH003', 'MH004', 'MH005'];
    result.forEach((mail) => {
      expect(unmatched_ids).not.toContain(mail.mail_history_id);
    });
  });
});