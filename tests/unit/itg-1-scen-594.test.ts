import { calculateBillingAmount } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-594: [error] 請求額の計算と検証 - 単価情報が登録されていない場合、計算エラーが検出される
  test('単価情報が登録されていない場合、エラーがスローされ、適切なエラーメッセージとエラーコードを含むエラーオブジェクトが返却される', () => {
    const billingData = {
      customerId: 'CUST001',
      serviceId: 'SVC001',
      quantity: 5,
      unitPrice: null,
      discountRate: 0,
    };

    const calculateWithMissingPrice = () => {
      return calculateBillingAmount(billingData);
    };

    expect(calculateWithMissingPrice).toThrow(/単価情報/);
  });
});