import { extractAndAggregateInvoiceItems } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-737
  test('マッピングルールが定義されていない項目についてはスキップされ、処理が継続される', () => {
    const salesData = {
      customerId: 'CUST-001',
      serviceId: 'SVC-A',
      appointmentCount: 5,
      contractCount: 3,
      customerReaction: 'positive',
      undefinedMetric: 120,
    };

    const mappingRules = [
      {
        sourceField: 'appointmentCount',
        targetField: 'invoiceItem_appointments',
        unitPrice: 1000,
        enabled: true,
      },
      {
        sourceField: 'contractCount',
        targetField: 'invoiceItem_contracts',
        unitPrice: 5000,
        enabled: true,
      },
    ];

    const result = extractAndAggregateInvoiceItems({
      salesData,
      mappingRules,
      customerId: 'CUST-001',
      serviceId: 'SVC-A',
    });

    expect(result.status).toBe('success');
    expect(result.invoiceItems).toEqual([
      {
        targetField: 'invoiceItem_appointments',
        quantity: 5,
        unitPrice: 1000,
        amount: 5000,
      },
      {
        targetField: 'invoiceItem_contracts',
        quantity: 3,
        unitPrice: 5000,
        amount: 15000,
      },
    ]);
    expect(result.totalAmount).toBe(20000);
    expect(result.skippedItems).toContain('undefinedMetric');
    expect(result.logs).toEqual(
      expect.arrayContaining([
        expect.stringContaining('undefinedMetric'),
        expect.stringContaining('skipped'),
      ])
    );
  });
});