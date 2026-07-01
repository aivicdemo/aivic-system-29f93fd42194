import { extractBillableItems } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目の自動抽出・顧客別サービス別請求額集計', () => {
  // SCEN-1277
  test('抽出ルール適用外の異常データが含まれる場合、該当項目を除外し例外を検出する', () => {
    const salesData = [
      {
        salesDataId: 'SD-001',
        customerId: 'CUST-A',
        serviceId: 'SVC-1',
        appointmentCount: 5,
        contractCount: 2,
        amount: 100000,
        dataType: 'normal',
        recordDate: '2024-01-15',
      },
      {
        salesDataId: 'SD-002',
        customerId: 'CUST-A',
        serviceId: 'SVC-1',
        appointmentCount: 3,
        contractCount: 1,
        amount: 50000,
        dataType: 'normal',
        recordDate: '2024-01-20',
      },
      {
        salesDataId: 'SD-003',
        customerId: 'CUST-B',
        serviceId: 'SVC-2',
        appointmentCount: 8,
        contractCount: 4,
        amount: 200000,
        dataType: 'normal',
        recordDate: '2024-01-22',
      },
      {
        salesDataId: 'SD-004',
        customerId: 'CUST-A',
        serviceId: 'SVC-1',
        appointmentCount: null,
        contractCount: 1,
        amount: 75000,
        dataType: 'null_value',
        recordDate: '2024-01-25',
      },
      {
        salesDataId: 'SD-005',
        customerId: 'CUST-B',
        serviceId: 'SVC-2',
        appointmentCount: 2,
        contractCount: 0,
        amount: -50000,
        dataType: 'negative_amount',
        recordDate: '2024-01-26',
      },
      {
        salesDataId: 'SD-006',
        customerId: 'CUST-C',
        serviceId: 'SVC-3',
        appointmentCount: 999999999,
        contractCount: 5,
        amount: 500000,
        dataType: 'excessive_value',
        recordDate: '2024-01-27',
      },
      {
        salesDataId: 'SD-007',
        customerId: '',
        serviceId: 'SVC-1',
        appointmentCount: 4,
        contractCount: 2,
        amount: 80000,
        dataType: 'empty_customer',
        recordDate: '2024-01-28',
      },
      {
        salesDataId: 'SD-008',
        customerId: 'CUST-B',
        serviceId: 'SVC-2',
        appointmentCount: 6,
        contractCount: 3,
        amount: 120000,
        dataType: 'normal',
        recordDate: '2024-01-29',
      },
    ];

    const contractRules = {
      'CUST-A': {
        'SVC-1': { unitPrice: 20000, minAppointment: 1, maxAppointment: 100 },
      },
      'CUST-B': {
        'SVC-2': { unitPrice: 30000, minAppointment: 1, maxAppointment: 50 },
      },
      'CUST-C': {
        'SVC-3': { unitPrice: 25000, minAppointment: 1, maxAppointment: 100 },
      },
    };

    const result = extractBillableItems(salesData, contractRules);

    expect(result.billableItemsByCustomerService).toEqual({
      'CUST-A|SVC-1': {
        customerId: 'CUST-A',
        serviceId: 'SVC-1',
        totalAppointmentCount: 8,
        totalContractCount: 3,
        totalAmount: 150000,
        recordCount: 2,
      },
      'CUST-B|SVC-2': {
        customerId: 'CUST-B',
        serviceId: 'SVC-2',
        totalAppointmentCount: 14,
        totalContractCount: 7,
        totalAmount: 320000,
        recordCount: 2,
      },
    });

    expect(result.excludedRecords).toEqual([
      {
        salesDataId: 'SD-004',
        customerId: 'CUST-A',
        serviceId: 'SVC-1',
        reason: '必須項目欠落',
        detail: 'appointmentCount が null です',
      },
      {
        salesDataId: 'SD-005',
        customerId: 'CUST-B',
        serviceId: 'SVC-2',
        reason: '範囲外の値',
        detail: '金額が負数です',
      },
      {
        salesDataId: 'SD-006',
        customerId: 'CUST-C',
        serviceId: 'SVC-3',
        reason: '範囲外の値',
        detail: 'appointmentCount が上限 100 を超えています',
      },
      {
        salesDataId: 'SD-007',
        customerId: '',
        serviceId: 'SVC-1',
        reason: '必須項目欠落',
        detail: 'customerId が空文字列です',
      },
    ]);

    expect(result.excludedRecords.length).toBe(4);
    expect(result.processedRecordCount).toBe(8);
    expect(result.validRecordCount).toBe(4);
    expect(result.exclusionRate).toBe(0.5);
    expect(result.hasErrors).toBe(false);
    expect(result.status).toBe('completed');
  });
});