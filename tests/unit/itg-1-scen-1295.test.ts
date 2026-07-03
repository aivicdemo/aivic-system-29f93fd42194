import { describe, it, expect, beforeEach } from '@jest/globals';
import { validateSalesDataWithRules } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1295
  it('営業データが必須項目を欠落している場合、検証エラーが検出され不足データとして通知される', () => {
    // 【前提】営業データ検証ルールが定義されている状態、必須項目（顧客ID、商品名、金額、請求日）のうち1つ以上が欠落しているテストデータ
    const incompleteData = {
      customerId: 'C001',
      productName: undefined, // 商品名が欠落
      amount: 50000,
      billingDate: '2024-01-15',
    };

    // 【発生条件】営業データ検証ルール実行機能に上記のテストデータを入力し、検証ルール実行処理を実行する
    const validationRules = [
      { field: 'customerId', required: true, type: 'string' },
      { field: 'productName', required: true, type: 'string' },
      { field: 'amount', required: true, type: 'number', minValue: 1 },
      { field: 'billingDate', required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
    ];

    const result = validateSalesDataWithRules(incompleteData, validationRules);

    // 【期待結果】検証ルール実行により、欠落している必須項目が特定され、検証エラーが検出される
    expect(result.isValid).toBe(false);
    expect(result.status).toBe('FAILED');

    // エラーメッセージには不足項目の内容が明記され、不足データとして通知される
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toEqual(
      expect.objectContaining({
        field: 'productName',
        errorType: 'MISSING_REQUIRED_FIELD',
      })
    );
    expect(result.errors[0].message).toMatch(/商品名/);

    // 戻り値として検証失敗ステータスが返却される
    expect(result.notificationRequired).toBe(true);
    expect(result.missingFields).toEqual(['productName']);
  });

  // SCEN-1295 (境界値テスト: 複数の必須項目が欠落)
  it('複数の必須項目が欠落している場合、すべての欠落項目がエラーとして検出される', () => {
    const incompleteData = {
      customerId: undefined, // 顧客IDが欠落
      productName: undefined, // 商品名が欠落
      amount: 50000,
      billingDate: undefined, // 請求日が欠落
    };

    const validationRules = [
      { field: 'customerId', required: true, type: 'string' },
      { field: 'productName', required: true, type: 'string' },
      { field: 'amount', required: true, type: 'number', minValue: 1 },
      { field: 'billingDate', required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
    ];

    const result = validateSalesDataWithRules(incompleteData, validationRules);

    expect(result.isValid).toBe(false);
    expect(result.status).toBe('FAILED');
    expect(result.errors.length).toBe(3);
    expect(result.missingFields.sort()).toEqual(['billingDate', 'customerId', 'productName'].sort());
    expect(result.notificationRequired).toBe(true);
  });

  // SCEN-1295 (境界値テスト: データ型不整合)
  it('データ型が不整合の場合、型エラーが検出される', () => {
    const invalidTypeData = {
      customerId: 'C001',
      productName: 'Product A',
      amount: '50000', // 数値型ではなく文字列型
      billingDate: '2024-01-15',
    };

    const validationRules = [
      { field: 'customerId', required: true, type: 'string' },
      { field: 'productName', required: true, type: 'string' },
      { field: 'amount', required: true, type: 'number', minValue: 1 },
      { field: 'billingDate', required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
    ];

    const result = validateSalesDataWithRules(invalidTypeData, validationRules);

    expect(result.isValid).toBe(false);
    expect(result.status).toBe('FAILED');
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'amount',
          errorType: 'TYPE_MISMATCH',
        }),
      ])
    );
  });

  // SCEN-1295 (境界値テスト: 異常値)
  it('金額が範囲外（負数または0）の場合、異常値エラーが検出される', () => {
    const anomalousData = {
      customerId: 'C001',
      productName: 'Product A',
      amount: 0, // 範囲外：0以下
      billingDate: '2024-01-15',
    };

    const validationRules = [
      { field: 'customerId', required: true, type: 'string' },
      { field: 'productName', required: true, type: 'string' },
      { field: 'amount', required: true, type: 'number', minValue: 1 },
      { field: 'billingDate', required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
    ];

    const result = validateSalesDataWithRules(anomalousData, validationRules);

    expect(result.isValid).toBe(false);
    expect(result.status).toBe('FAILED');
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'amount',
          errorType: 'VALUE_OUT_OF_RANGE',
        }),
      ])
    );
  });

  // SCEN-1295 (ハッピーパス: すべて正常)
  it('すべての必須項目が正常に入力されている場合、検証に合格する', () => {
    const validData = {
      customerId: 'C001',
      productName: 'Product A',
      amount: 50000,
      billingDate: '2024-01-15',
    };

    const validationRules = [
      { field: 'customerId', required: true, type: 'string' },
      { field: 'productName', required: true, type: 'string' },
      { field: 'amount', required: true, type: 'number', minValue: 1 },
      { field: 'billingDate', required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
    ];

    const result = validateSalesDataWithRules(validData, validationRules);

    expect(result.isValid).toBe(true);
    expect(result.status).toBe('PASSED');
    expect(result.errors.length).toBe(0);
    expect(result.notificationRequired).toBe(false);
    expect(result.missingFields.length).toBe(0);
  });
});