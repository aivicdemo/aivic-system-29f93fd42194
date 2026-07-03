import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-695
  test('顧客名フィールドに数値が入力された場合にデータ型不整合が検出される', () => {
    const inputData = {
      customerId: 'CUST001',
      customerName: 123456,
      contactDate: '2024-01-15T10:00:00Z',
      serviceType: 'sales_call',
      appointmentStatus: 'confirmed',
      outcome: 'success',
    };

    expect(() => validateSalesData(inputData)).toThrow(/データ型/);
  });
});