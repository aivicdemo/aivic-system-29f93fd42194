import { describe, test, expect } from '@jest/globals';
import { extractAndAggregateInvoiceItems } from '../../src/logic/it-1-2-1';

describe('請求対象項目の自動抽出・集計機能', () => {
  // SCEN-736
  test('品質基準を通過した営業データから請求対象項目を顧客ごと・サービスごとに正確に抽出・集計する', () => {
    const salesData = [
      {
        id: 'sales_001',
        customerId: 'cust_A',
        serviceId: 'svc_01',
        appointmentCount: 5,
        contractCount: 2,
        revenueAmount: 100000,
        qualityCheckStatus: 'passed',
        qualityCheckDate: '2024-01-15T09:00:00Z',
      },
      {
        id: 'sales_002',
        customerId: 'cust_A',
        serviceId: 'svc_01',
        appointmentCount: 3,
        contractCount: 1,
        revenueAmount: 60000,
        qualityCheckStatus: 'passed',
        qualityCheckDate: '2024-01-15T10:00:00Z',
      },
      {
        id: 'sales_003',
        customerId: 'cust_A',
        serviceId: 'svc_02',
        appointmentCount: 4,
        contractCount: 2,
        revenueAmount: 80000,
        qualityCheckStatus: 'passed',
        qualityCheckDate: '2024-01-15T11:00:00Z',
      },
      {
        id: 'sales_004',
        customerId: 'cust_B',
        serviceId: 'svc_01',
        appointmentCount: 6,
        contractCount: 3,
        revenueAmount: 150000,
        qualityCheckStatus: 'passed',
        qualityCheckDate: '2024-01-15T12:00:00Z',
      },
      {
        id: 'sales_005',
        customerId: 'cust_B',
        serviceId: 'svc_03',
        appointmentCount: 2,
        contractCount: 1,
        revenueAmount: 50000,
        qualityCheckStatus: 'passed',
        qualityCheckDate: '2024-01-15T13:00:00Z',
      },
      {
        id: 'sales_006',
        customerId: 'cust_C',
        serviceId: 'svc_02',
        appointmentCount: null,
        contractCount: 0,
        revenueAmount: 0,
        qualityCheckStatus: 'failed',
        qualityCheckDate: '2024-01-15T14:00:00Z',
      },
    ];

    const contractRules = [
      {
        customerId: 'cust_A',
        serviceId: 'svc_01',
        unitPrice: 10000,
        discountRate: 0.1,
      },
      {
        customerId: 'cust_A',
        serviceId: 'svc_02',
        unitPrice: 12000,
        discountRate: 0.05,
      },
      {
        customerId: 'cust_B',
        serviceId: 'svc_01',
        unitPrice: 15000,
        discountRate: 0.0,
      },
      {
        customerId: 'cust_B',
        serviceId: 'svc_03',
        unitPrice: 20000,
        discountRate: 0.15,
      },
      {
        customerId: 'cust_C',
        serviceId: 'svc_02',
        unitPrice: 12000,
        discountRate: 0.05,
      },
    ];

    const result = extractAndAggregateInvoiceItems({
      salesData,
      contractRules,
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
    });

    expect(result).toEqual({
      status: 'success',
      aggregatedByCustomerAndService: [
        {
          customerId: 'cust_A',
          serviceId: 'svc_01',
          totalAppointmentCount: 8,
          totalContractCount: 3,
          totalRevenueAmount: 160000,
          invoiceLineItems: [
            {
              itemId: 'item_cust_A_svc_01_01',
              customerId: 'cust_A',
              serviceId: 'svc_01',
              itemType: 'appointment',
              quantity: 8,
              unitPrice: 10000,
              subtotalBeforeDiscount: 80000,
              discountRate: 0.1,
              discountAmount: 8000,
              subtotalAfterDiscount: 72000,
            },
            {
              itemId: 'item_cust_A_svc_01_02',
              customerId: 'cust_A',
              serviceId: 'svc_01',
              itemType: 'contract',
              quantity: 3,
              unitPrice: 10000,
              subtotalBeforeDiscount: 30000,
              discountRate: 0.1,
              discountAmount: 3000,
              subtotalAfterDiscount: 27000,
            },
          ],
          serviceSubtotalBeforeDiscount: 110000,
          serviceDiscountAmount: 11000,
          serviceSubtotalAfterDiscount: 99000,
        },
        {
          customerId: 'cust_A',
          serviceId: 'svc_02',
          totalAppointmentCount: 4,
          totalContractCount: 2,
          totalRevenueAmount: 80000,
          invoiceLineItems: [
            {
              itemId: 'item_cust_A_svc_02_01',
              customerId: 'cust_A',
              serviceId: 'svc_02',
              itemType: 'appointment',
              quantity: 4,
              unitPrice: 12000,
              subtotalBeforeDiscount: 48000,
              discountRate: 0.05,
              discountAmount: 2400,
              subtotalAfterDiscount: 45600,
            },
            {
              itemId: 'item_cust_A_svc_02_02',
              customerId: 'cust_A',
              serviceId: 'svc_02',
              itemType: 'contract',
              quantity: 2,
              unitPrice: 12000,
              subtotalBeforeDiscount: 24000,
              discountRate: 0.05,
              discountAmount: 1200,
              subtotalAfterDiscount: 22800,
            },
          ],
          serviceSubtotalBeforeDiscount: 72000,
          serviceDiscountAmount: 3600,
          serviceSubtotalAfterDiscount: 68400,
        },
        {
          customerId: 'cust_B',
          serviceId: 'svc_01',
          totalAppointmentCount: 6,
          totalContractCount: 3,
          totalRevenueAmount: 150000,
          invoiceLineItems: [
            {
              itemId: 'item_cust_B_svc_01_01',
              customerId: 'cust_B',
              serviceId: 'svc_01',
              itemType: 'appointment',
              quantity: 6,
              unitPrice: 15000,
              subtotalBeforeDiscount: 90000,
              discountRate: 0.0,
              discountAmount: 0,
              subtotalAfterDiscount: 90000,
            },
            {
              itemId: 'item_cust_B_svc_01_02',
              customerId: 'cust_B',
              serviceId: 'svc_01',
              itemType: 'contract',
              quantity: 3,
              unitPrice: 15000,
              subtotalBeforeDiscount: 45000,
              discountRate: 0.0,
              discountAmount: 0,
              subtotalAfterDiscount: 45000,
            },
          ],
          serviceSubtotalBeforeDiscount: 135000,
          serviceDiscountAmount: 0,
          serviceSubtotalAfterDiscount: 135000,
        },
        {
          customerId: 'cust_B',
          serviceId: 'svc_03',
          totalAppointmentCount: 2,
          totalContractCount: 1,
          totalRevenueAmount: 50000,
          invoiceLineItems: [
            {
              itemId: 'item_cust_B_svc_03_01',
              customerId: 'cust_B',
              serviceId: 'svc_03',
              itemType: 'appointment',
              quantity: 2,
              unitPrice: 20000,
              subtotalBeforeDiscount: 40000,
              discountRate: 0.15,
              discountAmount: 6000,
              subtotalAfterDiscount: 34000,
            },
            {
              itemId: 'item_cust_B_svc_03_02',
              customerId: 'cust_B',
              serviceId: 'svc_03',
              itemType: 'contract',
              quantity: 1,
              unitPrice: 20000,
              subtotalBeforeDiscount: 20000,
              discountRate: 0.15,
              discountAmount: 3000,
              subtotalAfterDiscount: 17000,
            },
          ],
          serviceSubtotalBeforeDiscount: 60000,
          serviceDiscountAmount: 9000,
          serviceSubtotalAfterDiscount: 51000,
        },
      ],
      customerTotals: [
        {
          customerId: 'cust_A',
          customerSubtotalBeforeDiscount: 182000,
          customerDiscountAmount: 14600,
          customerInvoiceTotal: 167400,
        },
        {
          customerId: 'cust_B',
          customerSubtotalBeforeDiscount: 195000,
          customerDiscountAmount: 9000,
          customerInvoiceTotal: 186000,
        },
      ],
      excludedRecords: [
        {
          recordId: 'sales_006',
          customerId: 'cust_C',
          serviceId: 'svc_02',
          excludeReason: 'quality_check_failed',
          qualityCheckStatus: 'failed',
        },
      ],
      summary: {
        totalProcessedRecords: 5,
        totalExcludedRecords: 1,
        grandTotalBeforeDiscount: 377000,
        grandTotalDiscountAmount: 23600,
        grandTotalInvoiceAmount: 353400,
        processingTimestamp: expect.any(String),
      },
    });

    expect(result.status).toBe('success');
    expect(result.aggregatedByCustomerAndService).toHaveLength(4);
    expect(result.customerTotals).toHaveLength(2);
    expect(result.excludedRecords).toHaveLength(1);
    expect(result.summary.totalProcessedRecords).toBe(5);
    expect(result.summary.totalExcludedRecords).toBe(1);
    expect(result.summary.grandTotalInvoiceAmount).toBe(353400);
    expect(result.excludedRecords[0].excludeReason).toBe('quality_check_failed');
  });
});