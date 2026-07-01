import { validateBillingAmountInput } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-1096: [error] 請求書作成入力値検証 - 請求額が負の値である場合、不正な値として検出・通知すること
  test('請求額が負の値の場合、バリデーションエラーを発生させること', () => {
    const input = {
      customerId: 'CUST-001',
      customerName: '株式会社サンプル',
      billingDate: '2024-01-15',
      productCode: 'PROD-A001',
      productName: 'コンサルティングサービス',
      quantity: 1,
      unitPrice: 100000,
      billingAmount: -10000,
    };

    expect(() => validateBillingAmountInput(input)).toThrow(/請求額/);
  });

  test('請求額が0の場合、バリデーションエラーを発生させること', () => {
    const input = {
      customerId: 'CUST-002',
      customerName: '株式会社テスト',
      billingDate: '2024-01-15',
      productCode: 'PROD-B001',
      productName: 'サポートサービス',
      quantity: 2,
      unitPrice: 50000,
      billingAmount: 0,
    };

    expect(() => validateBillingAmountInput(input)).toThrow(/請求額/);
  });

  test('請求額が正の値の場合、検証に成功すること', () => {
    const input = {
      customerId: 'CUST-003',
      customerName: '株式会社正常',
      billingDate: '2024-01-15',
      productCode: 'PROD-C001',
      productName: '開発サービス',
      quantity: 1,
      unitPrice: 150000,
      billingAmount: 150000,
    };

    const result = validateBillingAmountInput(input);
    expect(result).toEqual({
      isValid: true,
      customerId: 'CUST-003',
      customerName: '株式会社正常',
      billingDate: '2024-01-15',
      productCode: 'PROD-C001',
      productName: '開発サービス',
      quantity: 1,
      unitPrice: 150000,
      billingAmount: 150000,
      validationStatus: 'approved',
    });
  });

  test('請求額が小数点を含む正の値の場合、検証に成功すること', () => {
    const input = {
      customerId: 'CUST-004',
      customerName: '株式会社小数',
      billingDate: '2024-01-15',
      productCode: 'PROD-D001',
      productName: 'メンテナンスサービス',
      quantity: 3,
      unitPrice: 33333.33,
      billingAmount: 99999.99,
    };

    const result = validateBillingAmountInput(input);
    expect(result.isValid).toBe(true);
    expect(result.billingAmount).toBe(99999.99);
    expect(result.validationStatus).toBe('approved');
  });
});