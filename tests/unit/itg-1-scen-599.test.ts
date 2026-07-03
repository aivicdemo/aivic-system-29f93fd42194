import { extractBillableItems } from '../../src/logic/it-1-2-1';

describe('請求対象項目抽出・分類機能', () => {
  // SCEN-599
  test('請求対象項目マッピングが未定義の場合にエラーが発生する', () => {
    const salesData = {
      customerId: 'CUST001',
      serviceId: 'SVC001',
      appointmentCount: 5,
      contractCount: 2,
      responseRate: 0.8,
      recordDate: '2024-01-15'
    };

    const billableItemMappings = undefined;

    expect(() => {
      extractBillableItems(salesData, billableItemMappings);
    }).toThrow(/請求対象項目マッピング/);
  });
});