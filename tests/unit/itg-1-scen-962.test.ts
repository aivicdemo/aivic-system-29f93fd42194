import { calculateContractBillingAmount } from '../../src/logic/it-1-2-1';

describe('契約別請求額計算機能 - 割引率検証', () => {
  // SCEN-962
  test('割引率が100%を超える不正な入力値に対してエラーを返す', () => {
    const invalid_discount_rates = [150, 200, 999, 101, 110];

    invalid_discount_rates.forEach((discount_rate) => {
      expect(() =>
        calculateContractBillingAmount({
          contract_id: 'CTR-001',
          service_id: 'SVC-001',
          base_amount: 100000,
          discount_rate: discount_rate,
          quantity: 1,
          unit_price: 100000,
        })
      ).toThrow(/割引率/);
    });

    // 正常系: 割引率が100%以下の場合は処理される
    const result = calculateContractBillingAmount({
      contract_id: 'CTR-001',
      service_id: 'SVC-001',
      base_amount: 100000,
      discount_rate: 20,
      quantity: 1,
      unit_price: 100000,
    });

    expect(result).toEqual({
      contract_id: 'CTR-001',
      service_id: 'SVC-001',
      base_amount: 100000,
      discount_rate: 20,
      discount_amount: 20000,
      billing_amount: 80000,
    });

    // 境界値: 割引率が0%の場合
    const result_zero_discount = calculateContractBillingAmount({
      contract_id: 'CTR-002',
      service_id: 'SVC-002',
      base_amount: 50000,
      discount_rate: 0,
      quantity: 1,
      unit_price: 50000,
    });

    expect(result_zero_discount.billing_amount).toBe(50000);

    // 境界値: 割引率が100%の場合
    const result_full_discount = calculateContractBillingAmount({
      contract_id: 'CTR-003',
      service_id: 'SVC-003',
      base_amount: 75000,
      discount_rate: 100,
      quantity: 1,
      unit_price: 75000,
    });

    expect(result_full_discount.billing_amount).toBe(0);
  });
});