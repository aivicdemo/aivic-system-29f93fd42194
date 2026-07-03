import { describe, it, expect, beforeEach } from '@jest/globals';
import { calculateAndAggregateInvoiceItems } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1141: [normal] 請求額自動計算・集計機能 - 営業データから請求対象項目が正しく抽出される
  it('営業データから請求対象項目のみが正確に抽出され、抽出条件と集計値が期待値と一致すること', () => {
    const sales_data = [
      {
        transaction_id: 'TXN001',
        customer_id: 'CUST_A',
        service_id: 'SVC_BASIC',
        transaction_type: 'SALE',
        transaction_date: '2024-01-10',
        quantity: 5,
        unit_price: 1000,
        amount: 5000,
        status: 'CONFIRMED'
      },
      {
        transaction_id: 'TXN002',
        customer_id: 'CUST_A',
        service_id: 'SVC_PREMIUM',
        transaction_type: 'SALE',
        transaction_date: '2024-01-15',
        quantity: 3,
        unit_price: 2000,
        amount: 6000,
        status: 'CONFIRMED'
      },
      {
        transaction_id: 'TXN003',
        customer_id: 'CUST_A',
        service_id: 'SVC_BASIC',
        transaction_type: 'RETURN',
        transaction_date: '2024-01-20',
        quantity: 2,
        unit_price: 1000,
        amount: -2000,
        status: 'CONFIRMED'
      },
      {
        transaction_id: 'TXN004',
        customer_id: 'CUST_B',
        service_id: 'SVC_BASIC',
        transaction_type: 'SALE',
        transaction_date: '2024-01-12',
        quantity: 10,
        unit_price: 1000,
        amount: 10000,
        status: 'CONFIRMED'
      },
      {
        transaction_id: 'TXN005',
        customer_id: 'CUST_B',
        service_id: 'SVC_PREMIUM',
        transaction_type: 'SALE',
        transaction_date: '2024-01-18',
        quantity: 2,
        unit_price: 2000,
        amount: 4000,
        status: 'PENDING'
      },
      {
        transaction_id: 'TXN006',
        customer_id: 'CUST_A',
        service_id: 'SVC_BASIC',
        transaction_type: 'CANCEL',
        transaction_date: '2024-01-22',
        quantity: 1,
        unit_price: 1000,
        amount: -1000,
        status: 'CONFIRMED'
      }
    ];

    const invoice_rules = {
      SALE: { billable: true, priority: 1 },
      RETURN: { billable: true, priority: 2 },
      CANCEL: { billable: false, priority: 0 },
      ADJUSTMENT: { billable: true, priority: 3 }
    };

    const status_rules = {
      CONFIRMED: { billable: true },
      PENDING: { billable: false },
      CANCELLED: { billable: false }
    };

    const period_config = {
      start_date: '2024-01-01',
      end_date: '2024-01-31'
    };

    const result = calculateAndAggregateInvoiceItems({
      sales_data,
      invoice_rules,
      status_rules,
      period_config
    });

    // 抽出対象: TXN001, TXN002, TXN003, TXN004
    // 除外対象: TXN005 (PENDING), TXN006 (CANCEL)
    expect(result.extracted_transactions).toHaveLength(4);
    expect(result.extracted_transactions.map((t: any) => t.transaction_id)).toEqual([
      'TXN001',
      'TXN002',
      'TXN003',
      'TXN004'
    ]);

    // 除外理由の確認
    expect(result.excluded_transactions).toHaveLength(2);
    const excluded_txn_005 = result.excluded_transactions.find(
      (e: any) => e.transaction_id === 'TXN005'
    );
    expect(excluded_txn_005.reason).toBe('status');
    expect(excluded_txn_005.detail).toBe('PENDING');

    const excluded_txn_006 = result.excluded_transactions.find(
      (e: any) => e.transaction_id === 'TXN006'
    );
    expect(excluded_txn_006.reason).toBe('transaction_type');
    expect(excluded_txn_006.detail).toBe('CANCEL');

    // 顧客別・サービス別集計値の検証
    // CUST_A: SVC_BASIC = 5000 - 2000 - 1000 = 2000 (TXN001, TXN003, TXN006除外)
    // CUST_A: SVC_PREMIUM = 6000 (TXN002)
    // CUST_B: SVC_BASIC = 10000 (TXN004)
    // CUST_B: SVC_PREMIUM = 除外
    
    expect(result.aggregated_by_customer_service).toEqual({
      CUST_A: {
        SVC_BASIC: {
          total_amount: 2000,
          transaction_count: 2,
          transactions: [
            { transaction_id: 'TXN001', amount: 5000 },
            { transaction_id: 'TXN003', amount: -2000 }
          ]
        },
        SVC_PREMIUM: {
          total_amount: 6000,
          transaction_count: 1,
          transactions: [{ transaction_id: 'TXN002', amount: 6000 }]
        }
      },
      CUST_B: {
        SVC_BASIC: {
          total_amount: 10000,
          transaction_count: 1,
          transactions: [{ transaction_id: 'TXN004', amount: 10000 }]
        }
      }
    });

    // 顧客別集計値
    expect(result.aggregated_by_customer).toEqual({
      CUST_A: {
        total_amount: 8000,
        transaction_count: 3,
        service_breakdown: {
          SVC_BASIC: 2000,
          SVC_PREMIUM: 6000
        }
      },
      CUST_B: {
        total_amount: 10000,
        transaction_count: 1,
        service_breakdown: {
          SVC_BASIC: 10000
        }
      }
    });

    // 全体集計値
    expect(result.total_invoice_amount).toBe(18000);
    expect(result.total_transaction_count).toBe(4);
    expect(result.extraction_summary).toEqual({
      total_records_input: 6,
      records_extracted: 4,
      records_excluded: 2,
      extraction_rate: 66.67
    });

    // 期間内すべてのデータが処理されたことを確認
    expect(result.period_applied).toEqual({
      start_date: '2024-01-01',
      end_date: '2024-01-31'
    });

    // 抽出データが期間内であることを確認
    const all_extracted_dates = result.extracted_transactions.map(
      (t: any) => t.transaction_date
    );
    expect(
      all_extracted_dates.every((d: string) => d >= '2024-01-01' && d <= '2024-01-31')
    ).toBe(true);
  });
});