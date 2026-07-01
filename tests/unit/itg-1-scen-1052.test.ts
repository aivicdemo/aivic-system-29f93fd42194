import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの品質検証 - 必須項目検証', () => {
  test('SCEN-1052: 必須項目が空欄のときエラーが検出されて入力が拒否される', () => {
    // ========== 必須項目が揃っている正常系ケース ==========
    const validData = {
      customerName: '株式会社A',
      productName: '営業支援ツール',
      amount: 500000,
      transactionDate: '2024-01-15',
    };
    const validResult = validateSalesData(validData);
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toEqual([]);

    // ========== 必須項目「顧客名」が空欄のケース ==========
    const missingCustomerName = {
      customerName: '',
      productName: '営業支援ツール',
      amount: 500000,
      transactionDate: '2024-01-15',
    };
    expect(() => validateSalesData(missingCustomerName)).toThrow(/顧客名/);

    // ========== 必須項目「商品名」が空欄のケース ==========
    const missingProductName = {
      customerName: '株式会社A',
      productName: '',
      amount: 500000,
      transactionDate: '2024-01-15',
    };
    expect(() => validateSalesData(missingProductName)).toThrow(/商品名/);

    // ========== 必須項目「金額」が空欄のケース ==========
    const missingAmount = {
      customerName: '株式会社A',
      productName: '営業支援ツール',
      amount: null,
      transactionDate: '2024-01-15',
    };
    expect(() => validateSalesData(missingAmount)).toThrow(/金額/);

    // ========== 必須項目「取引日」が空欄のケース ==========
    const missingTransactionDate = {
      customerName: '株式会社A',
      productName: '営業支援ツール',
      amount: 500000,
      transactionDate: '',
    };
    expect(() => validateSalesData(missingTransactionDate)).toThrow(/取引日/);

    // ========== 複数の必須項目が空欄のケース ==========
    const multipleErrors = {
      customerName: '',
      productName: '',
      amount: 500000,
      transactionDate: '2024-01-15',
    };
    expect(() => validateSalesData(multipleErrors)).toThrow(/顧客名/);

    // ========== データ型の不整合ケース（金額が文字列） ==========
    const invalidAmount = {
      customerName: '株式会社A',
      productName: '営業支援ツール',
      amount: 'abc',
      transactionDate: '2024-01-15',
    };
    expect(() => validateSalesData(invalidAmount)).toThrow(/金額/);

    // ========== 取引日の形式が不正なケース ==========
    const invalidDate = {
      customerName: '株式会社A',
      productName: '営業支援ツール',
      amount: 500000,
      transactionDate: '2024/01/15',
    };
    expect(() => validateSalesData(invalidDate)).toThrow(/取引日/);

    // ========== 金額が負の値のケース（値の範囲外） ==========
    const negativeAmount = {
      customerName: '株式会社A',
      productName: '営業支援ツール',
      amount: -100000,
      transactionDate: '2024-01-15',
    };
    expect(() => validateSalesData(negativeAmount)).toThrow(/金額/);

    // ========== すべての必須項目が入力されている場合は成功 ==========
    const allFieldsFilled = {
      customerName: '株式会社B',
      productName: 'CRMシステム',
      amount: 1000000,
      transactionDate: '2024-02-20',
    };
    const successResult = validateSalesData(allFieldsFilled);
    expect(successResult.isValid).toBe(true);
    expect(successResult.errors).toEqual([]);
  });
});