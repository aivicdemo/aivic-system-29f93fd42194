import { getDeliverableCustomers } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1166
  test('全顧客企業が配信不可条件に該当する場合、空の配列が返される', () => {
    const customers = [
      {
        customerId: 'CUST001',
        customerName: '顧客A',
        contractEndDate: '2023-12-31',
        deliveryStopFlag: true,
        blacklistFlag: false,
      },
      {
        customerId: 'CUST002',
        customerName: '顧客B',
        contractEndDate: '2024-01-15',
        deliveryStopFlag: false,
        blacklistFlag: true,
      },
      {
        customerId: 'CUST003',
        customerName: '顧客C',
        contractEndDate: '2023-11-30',
        deliveryStopFlag: true,
        blacklistFlag: true,
      },
    ];

    const currentDate = new Date('2025-01-20T09:00:00Z');

    const result = getDeliverableCustomers(customers, currentDate);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
    expect(result).toEqual([]);
  });
});