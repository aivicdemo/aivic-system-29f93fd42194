import { validateBillingEntryInput } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-1095: [error] 請求書作成入力値検証 - 請求対象項目の必須フィールドが空の場合、エラーを検出・通知すること
  test('請求書作成時に必須フィールドが空の場合はバリデーションエラーを検出・通知し、請求書を作成しない', () => {
    // 正常なデータセット（ベースライン）
    const validBillingData = {
      customerId: 'CUST-001',
      customerName: '顧客A',
      billingAmount: 100000,
      billingDate: '2024-01-15',
      serviceType: 'Service-X',
      invoiceNumber: 'INV-2024-001',
    };

    // 成功パターン：すべての必須フィールドが入力されている場合
    const validResult = validateBillingEntryInput(validBillingData);
    expect(validResult).toEqual({
      isValid: true,
      errors: [],
    });

    // エラーパターン1：顧客名が空の場合
    const missingCustomerName = {
      ...validBillingData,
      customerName: '',
    };
    expect(() => validateBillingEntryInput(missingCustomerName)).toThrow(/顧客名/);

    // エラーパターン2：請求金額が空（null）の場合
    const missingBillingAmount = {
      ...validBillingData,
      billingAmount: null,
    };
    expect(() => validateBillingEntryInput(missingBillingAmount)).toThrow(/請求金額/);

    // エラーパターン3：請求日付が空の場合
    const missingBillingDate = {
      ...validBillingData,
      billingDate: '',
    };
    expect(() => validateBillingEntryInput(missingBillingDate)).toThrow(/請求日/);

    // エラーパターン4：顧客IDが空の場合
    const missingCustomerId = {
      ...validBillingData,
      customerId: '',
    };
    expect(() => validateBillingEntryInput(missingCustomerId)).toThrow(/顧客ID/);

    // エラーパターン5：サービス種別が空の場合
    const missingServiceType = {
      ...validBillingData,
      serviceType: '',
    };
    expect(() => validateBillingEntryInput(missingServiceType)).toThrow(/サービス種別/);

    // エラーパターン6：請求金額が0以下の場合（範囲チェック）
    const invalidBillingAmount = {
      ...validBillingData,
      billingAmount: 0,
    };
    expect(() => validateBillingEntryInput(invalidBillingAmount)).toThrow(/金額/);

    // エラーパターン7：請求日付の形式が不正な場合
    const invalidBillingDateFormat = {
      ...validBillingData,
      billingDate: '2024/01/15', // ISO形式ではない
    };
    expect(() => validateBillingEntryInput(invalidBillingDateFormat)).toThrow(/日付形式/);

    // エラーパターン8：複数の必須フィールドが空の場合
    const multipleMissingFields = {
      customerId: '',
      customerName: '',
      billingAmount: null,
      billingDate: '',
      serviceType: 'Service-X',
      invoiceNumber: 'INV-2024-001',
    };
    expect(() => validateBillingEntryInput(multipleMissingFields)).toThrow(/必須項目/);

    // 境界値テスト：金額が最小有効値の場合
    const minValidAmount = {
      ...validBillingData,
      billingAmount: 1,
    };
    const minResult = validateBillingEntryInput(minValidAmount);
    expect(minResult).toEqual({
      isValid: true,
      errors: [],
    });

    // 境界値テスト：金額が大きい場合
    const largeAmount = {
      ...validBillingData,
      billingAmount: 9999999,
    };
    const largeResult = validateBillingEntryInput(largeAmount);
    expect(largeResult).toEqual({
      isValid: true,
      errors: [],
    });

    // 日付が有効な ISO 形式の場合
    const validIsoDate = {
      ...validBillingData,
      billingDate: '2024-12-31',
    };
    const dateResult = validateBillingEntryInput(validIsoDate);
    expect(dateResult).toEqual({
      isValid: true,
      errors: [],
    });

    // 請求番号が空の場合（オプション項目の場合はスキップ）
    // 注：invoiceNumber が必須と仮定した場合
    const missingInvoiceNumber = {
      customerId: 'CUST-001',
      customerName: '顧客A',
      billingAmount: 100000,
      billingDate: '2024-01-15',
      serviceType: 'Service-X',
      invoiceNumber: '',
    };
    expect(() => validateBillingEntryInput(missingInvoiceNumber)).toThrow(/請求番号/);
  });
});