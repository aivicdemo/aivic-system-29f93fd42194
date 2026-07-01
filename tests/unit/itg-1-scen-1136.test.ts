import { detectAnomaliesAndMissingData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質チェック - 異常値・欠落データ自動検出', () => {
  // SCEN-1136
  test('金額がゼロの場合、異常値判定の対象外として扱われ通知されない', () => {
    const sales_records = [
      {
        id: 'sales_001',
        customer_id: 'cust_001',
        service_id: 'svc_001',
        appointment_count: 5,
        contract_count: 2,
        amount: 0,
        transaction_date: '2024-01-15',
        status: 'completed'
      },
      {
        id: 'sales_002',
        customer_id: 'cust_002',
        service_id: 'svc_002',
        appointment_count: 3,
        contract_count: 1,
        amount: 50000,
        transaction_date: '2024-01-16',
        status: 'completed'
      }
    ];

    const result = detectAnomaliesAndMissingData(sales_records);

    expect(result.anomalies).toHaveLength(0);
    expect(result.missing_data_issues).toHaveLength(0);
    expect(result.detected_records).toEqual([]);
    expect(result.notification_sent).toBe(false);
    expect(result.anomaly_flag).toBe(false);
    expect(result.records_with_zero_amount).toEqual(['sales_001']);
    expect(result.total_records_scanned).toBe(2);
    expect(result.excluded_from_validation).toBe(1);
  });
});