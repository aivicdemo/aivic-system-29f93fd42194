import { validateReportIntegrity } from '../../src/logic/it-1781935279444-2-2-1';

describe('レポート完全性・正確性の自動検証', () => {
  test('SCEN-1153: 顧客合計と明細の合算値に矛盾がある場合、正確性エラーとして検出される', () => {
    const report_id = 'RPT-20240115-001';
    const customer_details = [
      {
        customer_id: 'CUST-A',
        customer_name: '顧客A',
        amount: 100000,
      },
      {
        customer_id: 'CUST-B',
        customer_name: '顧客B',
        amount: 50000,
      },
      {
        customer_id: 'CUST-C',
        customer_name: '顧客C',
        amount: 75000,
      },
    ];
    const reported_total = 230000; // 計算値 225,000 に対して 5,000 の誤差
    const expected_total = 225000; // 100,000 + 50,000 + 75,000

    const result = validateReportIntegrity({
      report_id,
      customer_details,
      reported_total,
    });

    expect(result.is_valid).toBe(false);
    expect(result.error_code).toBe('INTEGRITY_MISMATCH');
    expect(result.error_message).toMatch(/顧客合計と明細の合算値に矛盾/);
    expect(result.discrepancy_amount).toBe(5000);
    expect(result.reported_total).toBe(230000);
    expect(result.calculated_total).toBe(225000);
    expect(result.target_report_id).toBe('RPT-20240115-001');
    expect(result.error_log).toBeDefined();
  });
});