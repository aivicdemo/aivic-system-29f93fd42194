import { validateSalesDataCompletenessAndAccuracy } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する', () => {
  // SCEN-644: [error] 月次営業データの完全性・正確性検証機能 - データ型不一致（例：文字列フィールドに数値入力）はエラーとして検出される
  test('文字列フィールドへの数値入力および数値フィールドへの文字列入力でデータ型不一致エラーが検出される', () => {
    // テスト1: 文字列フィールド（顧客名）に数値データを入力するケース
    const invalidStringFieldData = {
      customerId: '001',
      customerName: 12345, // 数値を文字列フィールドに入力
      contactDate: '2024-01-15',
      product: 'Service A',
      appointmentStatus: 'confirmed',
      amount: 50000,
      description: 'Test appointment',
    };

    const resultStringFieldError = validateSalesDataCompletenessAndAccuracy(
      invalidStringFieldData
    );

    expect(resultStringFieldError.valid).toBe(false);
    expect(resultStringFieldError.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'customerName',
          errorType: 'データ型不一致',
        }),
      ])
    );
    expect(resultStringFieldError.errors[0].message).toMatch(/データ型/);

    // テスト2: 数値フィールド（金額）に文字列データを入力するケース
    const invalidNumberFieldData = {
      customerId: '002',
      customerName: 'Customer B',
      contactDate: '2024-01-16',
      product: 'Service B',
      appointmentStatus: 'confirmed',
      amount: 'abc', // 文字列を数値フィールドに入力
      description: 'Another test appointment',
    };

    const resultNumberFieldError = validateSalesDataCompletenessAndAccuracy(
      invalidNumberFieldData
    );

    expect(resultNumberFieldError.valid).toBe(false);
    expect(resultNumberFieldError.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'amount',
          errorType: 'データ型不一致',
        }),
      ])
    );
    expect(resultNumberFieldError.errors[0].message).toMatch(/データ型/);

    // テスト3: 複数フィールドの型不一致が同時に発生するケース
    const multipleTypeErrorData = {
      customerId: '003',
      customerName: 99999, // 数値を文字列フィールドに
      contactDate: '2024-01-17',
      product: 'Service C',
      appointmentStatus: 'confirmed',
      amount: 'xyz', // 文字列を数値フィールドに
      description: 'Multiple type errors test',
    };

    const resultMultipleErrors = validateSalesDataCompletenessAndAccuracy(
      multipleTypeErrorData
    );

    expect(resultMultipleErrors.valid).toBe(false);
    expect(resultMultipleErrors.errors.length).toBeGreaterThanOrEqual(2);
    expect(resultMultipleErrors.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'customerName',
          errorType: 'データ型不一致',
        }),
        expect.objectContaining({
          field: 'amount',
          errorType: 'データ型不一致',
        }),
      ])
    );

    // テスト4: 正常なデータが入力された場合は検証に合格するケース
    const validData = {
      customerId: '004',
      customerName: 'Valid Customer',
      contactDate: '2024-01-18',
      product: 'Service D',
      appointmentStatus: 'confirmed',
      amount: 75000,
      description: 'Valid data test',
    };

    const resultValid = validateSalesDataCompletenessAndAccuracy(validData);

    expect(resultValid.valid).toBe(true);
    expect(resultValid.errors).toEqual([]);

    // テスト5: エラーがスロー（throw）される場合
    const nullData = null;

    expect(() => {
      validateSalesDataCompletenessAndAccuracy(nullData as any);
    }).toThrow(/入力データ/);
  });
});