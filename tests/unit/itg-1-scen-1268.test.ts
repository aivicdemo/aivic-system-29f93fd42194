import { calculateBillingAmountByCustomerAndService } from '../../src/logic/it-1-2-1';

describe('顧客別・サービス別請求額計算機能', () => {
  // SCEN-1268
  test('請求対象項目が0件の場合、計算エラーが返される', () => {
    const input = {
      customerId: 'CUST001',
      serviceName: 'ServiceA',
      billingItems: [],
      unitPrice: 10000,
      quantity: 5,
    };

    expect(() => calculateBillingAmountByCustomerAndService(input)).toThrow(
      /請求対象項目/
    );
  });
});