import { extractAndAggregateChargeableItems } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-748: [normal] 請求対象項目の自動抽出と請求額集計 - 同一顧客・同一サービスの複数営業レコードが月次集計対象の場合、請求対象項目の合計値が正確に集計される
  test('同一顧客・同一サービスの複数営業レコードから請求対象項目を正確に集計', () => {
    // 月次集計対象期間: 2024-01-01 ～ 2024-01-31
    const aggregationPeriodStart = new Date('2024-01-01T00:00:00Z');
    const aggregationPeriodEnd = new Date('2024-01-31T23:59:59Z');

    // 営業レコードデータ (同一顧客ID: cust_001, 同一サービスID: svc_A)
    const sales_records = [
      {
        id: 'sales_001',
        customer_id: 'cust_001',
        service_id: 'svc_A',
        activity_date: new Date('2024-01-05T10:00:00Z'),
        charge_amount: 50000,
        fee_amount: 5000,
        other_cost: 1000,
        is_chargeable: true,
        activity_type: 'appointment'
      },
      {
        id: 'sales_002',
        customer_id: 'cust_001',
        service_id: 'svc_A',
        activity_date: new Date('2024-01-12T14:30:00Z'),
        charge_amount: 75000,
        fee_amount: 7500,
        other_cost: 2000,
        is_chargeable: true,
        activity_type: 'contract'
      },
      {
        id: 'sales_003',
        customer_id: 'cust_001',
        service_id: 'svc_A',
        activity_date: new Date('2024-01-25T09:15:00Z'),
        charge_amount: 60000,
        fee_amount: 6000,
        other_cost: 1500,
        is_chargeable: true,
        activity_type: 'appointment'
      },
      // 請求対象外レコード (is_chargeable: false)
      {
        id: 'sales_004',
        customer_id: 'cust_001',
        service_id: 'svc_A',
        activity_date: new Date('2024-01-18T11:00:00Z'),
        charge_amount: 10000,
        fee_amount: 1000,
        other_cost: 200,
        is_chargeable: false,
        activity_type: 'inquiry'
      },
      // 集計対象外レコード (期間外: 2024-02-01)
      {
        id: 'sales_005',
        customer_id: 'cust_001',
        service_id: 'svc_A',
        activity_date: new Date('2024-02-01T10:00:00Z'),
        charge_amount: 30000,
        fee_amount: 3000,
        other_cost: 500,
        is_chargeable: true,
        activity_type: 'appointment'
      }
    ];

    // 集計実行
    const result = extractAndAggregateChargeableItems(
      sales_records,
      aggregationPeriodStart,
      aggregationPeriodEnd
    );

    // 期待値の手動計算
    // 請求対象: sales_001, sales_002, sales_003 のみ
    // charge_amount: 50000 + 75000 + 60000 = 185000
    // fee_amount: 5000 + 7500 + 6000 = 18500
    // other_cost: 1000 + 2000 + 1500 = 4500

    expect(result.customer_id).toBe('cust_001');
    expect(result.service_id).toBe('svc_A');
    expect(result.chargeable_count).toBe(3);
    expect(result.total_charge_amount).toBe(185000);
    expect(result.total_fee_amount).toBe(18500);
    expect(result.total_other_cost).toBe(4500);
    expect(result.aggregation_period_start).toEqual(aggregationPeriodStart);
    expect(result.aggregation_period_end).toEqual(aggregationPeriodEnd);
    expect(result.excluded_non_chargeable_count).toBe(1);
    expect(result.excluded_out_of_period_count).toBe(1);
    expect(result.records_included).toEqual(['sales_001', 'sales_002', 'sales_003']);
    expect(result.records_excluded).toEqual(['sales_004', 'sales_005']);
  });
});