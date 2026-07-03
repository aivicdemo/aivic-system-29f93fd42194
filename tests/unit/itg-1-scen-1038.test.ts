import { aggregateBillingItems } from '../../src/logic/it-1-2-1';

describe('営業データから請求対象項目の自動抽出と請求額集計', () => {
  // SCEN-1038: [edge] 同一顧客・同一サービスのデータが複数件存在する場合、合計金額として正確に集計される
  test('同一顧客・同一サービスの複数件営業データが正確に集計される', () => {
    const salesData = [
      {
        recordId: 'REC-001',
        customerId: 'CUST-001',
        serviceCode: 'SVC-A',
        amount: 10000,
        appointmentCount: 2,
        contractDate: '2024-01-10',
        period: '2024-01',
      },
      {
        recordId: 'REC-002',
        customerId: 'CUST-001',
        serviceCode: 'SVC-A',
        amount: 15000,
        appointmentCount: 3,
        contractDate: '2024-01-15',
        period: '2024-01',
      },
      {
        recordId: 'REC-003',
        customerId: 'CUST-001',
        serviceCode: 'SVC-A',
        amount: 25000,
        appointmentCount: 5,
        contractDate: '2024-01-20',
        period: '2024-01',
      },
    ];

    const result = aggregateBillingItems(salesData);

    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(result[0].customerId).toBe('CUST-001');
    expect(result[0].serviceCode).toBe('SVC-A');
    expect(result[0].totalAmount).toBe(50000);
    expect(result[0].totalAppointmentCount).toBe(10);
    expect(result[0].period).toBe('2024-01');
    expect(result[0].sourceRecordIds).toEqual(['REC-001', 'REC-002', 'REC-003']);
    expect(result[0].aggregatedCount).toBe(3);
    expect(result[0].isConsolidated).toBe(true);
  });
});