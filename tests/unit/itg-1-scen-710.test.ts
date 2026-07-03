import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-710: [edge] 営業データ品質基準チェック判定機能 - 形式チェック（金額が999999999など上限値）で合格・不合格の境界が正確に判定される
  test('金額フィールドの境界値チェック: 上限値999999999は合格、1000000000は不合格、負の値は不合格', () => {
    // 金額フィールドに999999998を入力してチェック実行 → 合格
    const result_999999998 = validateSalesDataQuality({
      customerId: 'CUST001',
      serviceName: 'Service_A',
      appointmentCount: 5,
      contractCount: 3,
      amount: 999999998,
      transactionDate: '2024-01-15',
      salesPerson: 'Sales_Rep_001'
    });
    expect(result_999999998.status).toBe('PASS');

    // 金額フィールドに999999999（上限値）を入力してチェック実行 → 合格
    const result_999999999 = validateSalesDataQuality({
      customerId: 'CUST001',
      serviceName: 'Service_A',
      appointmentCount: 5,
      contractCount: 3,
      amount: 999999999,
      transactionDate: '2024-01-15',
      salesPerson: 'Sales_Rep_001'
    });
    expect(result_999999999.status).toBe('PASS');

    // 金額フィールドに1000000000（上限値を超える値）を入力してチェック実行 → 不合格
    const result_1000000000 = validateSalesDataQuality({
      customerId: 'CUST001',
      serviceName: 'Service_A',
      appointmentCount: 5,
      contractCount: 3,
      amount: 1000000000,
      transactionDate: '2024-01-15',
      salesPerson: 'Sales_Rep_001'
    });
    expect(result_1000000000.status).toBe('FAIL');
    expect(result_1000000000.errors).toContain(
      expect.objectContaining({
        field: 'amount',
        message: expect.stringMatching(/上限値/)
      })
    );

    // 金額フィールドに0を入力してチェック実行 → 合格
    const result_zero = validateSalesDataQuality({
      customerId: 'CUST001',
      serviceName: 'Service_A',
      appointmentCount: 5,
      contractCount: 3,
      amount: 0,
      transactionDate: '2024-01-15',
      salesPerson: 'Sales_Rep_001'
    });
    expect(result_zero.status).toBe('PASS');

    // 金額フィールドに-1（負の値）を入力してチェック実行 → 不合格
    const result_negative = validateSalesDataQuality({
      customerId: 'CUST001',
      serviceName: 'Service_A',
      appointmentCount: 5,
      contractCount: 3,
      amount: -1,
      transactionDate: '2024-01-15',
      salesPerson: 'Sales_Rep_001'
    });
    expect(result_negative.status).toBe('FAIL');
    expect(result_negative.errors).toContain(
      expect.objectContaining({
        field: 'amount',
        message: expect.stringMatching(/負の値/)
      })
    );
  });
});