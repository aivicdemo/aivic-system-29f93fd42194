import { filterDeliverableCustomers } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1163
  test('顧客企業別配信リスト確認・配信可能顧客特定 - 契約状態が有効で配信停止フラグが無効な顧客企業が配信可能として正確に特定される', () => {
    const testCustomers = [
      {
        customerId: 'CUST001',
        contractStatus: 'active',
        stopDeliveryFlag: false,
        name: 'Company A',
      },
      {
        customerId: 'CUST002',
        contractStatus: 'active',
        stopDeliveryFlag: false,
        name: 'Company B',
      },
      {
        customerId: 'CUST003',
        contractStatus: 'inactive',
        stopDeliveryFlag: false,
        name: 'Company C',
      },
      {
        customerId: 'CUST004',
        contractStatus: 'active',
        stopDeliveryFlag: true,
        name: 'Company D',
      },
      {
        customerId: 'CUST005',
        contractStatus: 'inactive',
        stopDeliveryFlag: true,
        name: 'Company E',
      },
      {
        customerId: 'CUST006',
        contractStatus: 'active',
        stopDeliveryFlag: false,
        name: 'Company F',
      },
    ];

    const result = filterDeliverableCustomers(testCustomers);

    expect(result).toEqual([
      {
        customerId: 'CUST001',
        contractStatus: 'active',
        stopDeliveryFlag: false,
        name: 'Company A',
      },
      {
        customerId: 'CUST002',
        contractStatus: 'active',
        stopDeliveryFlag: false,
        name: 'Company B',
      },
      {
        customerId: 'CUST006',
        contractStatus: 'active',
        stopDeliveryFlag: false,
        name: 'Company F',
      },
    ]);

    expect(result.length).toBe(3);

    result.forEach((customer) => {
      expect(customer.contractStatus).toBe('active');
      expect(customer.stopDeliveryFlag).toBe(false);
    });

    const deliverableIds = result.map((c) => c.customerId);
    expect(deliverableIds).toContain('CUST001');
    expect(deliverableIds).toContain('CUST002');
    expect(deliverableIds).toContain('CUST006');
    expect(deliverableIds).not.toContain('CUST003');
    expect(deliverableIds).not.toContain('CUST004');
    expect(deliverableIds).not.toContain('CUST005');
  });
});