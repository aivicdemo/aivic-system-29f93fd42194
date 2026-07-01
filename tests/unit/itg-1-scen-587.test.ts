import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証', () => {
  // SCEN-587: [edge] 営業データの品質検証実行 - 営業データの数値項目が範囲の境界値（最小値・最大値）である場合、合格と判定される
  test('should pass validation when numeric fields are at boundary values (min/max)', () => {
    // テストデータ：数値項目が範囲の最小値を設定した営業データ
    const salesDataWithMinValue = {
      appointmentCount: 0,
      contractCount: 0,
      customerResponse: 0,
      serviceType: 'basic',
      customerId: 'CUST001',
      month: '2024-01',
      dataSource: 'crm_system'
    };

    const resultMinValue = validateSalesDataQuality(salesDataWithMinValue);
    expect(resultMinValue.status).toBe('pass');
    expect(resultMinValue.isValid).toBe(true);
    expect(resultMinValue.errors).toEqual([]);

    // テストデータ：数値項目が範囲の最大値を設定した営業データ
    const salesDataWithMaxValue = {
      appointmentCount: 999,
      contractCount: 999,
      customerResponse: 100,
      serviceType: 'premium',
      customerId: 'CUST002',
      month: '2024-01',
      dataSource: 'crm_system'
    };

    const resultMaxValue = validateSalesDataQuality(salesDataWithMaxValue);
    expect(resultMaxValue.status).toBe('pass');
    expect(resultMaxValue.isValid).toBe(true);
    expect(resultMaxValue.errors).toEqual([]);

    // テストデータ：数値項目が範囲の最小値と最大値の両方を含む複数の営業データを一括入力
    const batchSalesData = [
      {
        appointmentCount: 0,
        contractCount: 0,
        customerResponse: 0,
        serviceType: 'basic',
        customerId: 'CUST003',
        month: '2024-01',
        dataSource: 'crm_system'
      },
      {
        appointmentCount: 999,
        contractCount: 999,
        customerResponse: 100,
        serviceType: 'premium',
        customerId: 'CUST004',
        month: '2024-01',
        dataSource: 'crm_system'
      },
      {
        appointmentCount: 500,
        contractCount: 250,
        customerResponse: 50,
        serviceType: 'standard',
        customerId: 'CUST005',
        month: '2024-01',
        dataSource: 'crm_system'
      }
    ];

    const batchResults = batchSalesData.map(data => validateSalesDataQuality(data));
    
    batchResults.forEach((result, index) => {
      expect(result.status).toBe('pass');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    // すべてのデータの検証結果が「合格」と判定されることを確認
    const allPassed = batchResults.every(result => result.status === 'pass' && result.isValid === true);
    expect(allPassed).toBe(true);
  });
});