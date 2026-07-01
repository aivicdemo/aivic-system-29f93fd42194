import { describe, test, expect } from '@jest/globals';
import { validateSalesDataCompleteness } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性自動検証', () => {
  // SCEN-1339
  test('必須項目が欠落したデータが不完全として検出される', () => {
    // ========================================
    // テストシナリオの前提条件
    // ========================================
    // 営業システムに営業データが入力され、営業データ品質管理・請求自動化システムにアクセスする状態
    // 必須項目（顧客ID、売上金額、取引日付）のいずれかが欠落したレコード

    // ========================================
    // テストデータ準備
    // ========================================
    // 顧客IDが欠落したケース
    const incompleteDataMissingCustomerId = {
      customerId: null,
      salesAmount: 50000,
      transactionDate: '2024-01-15',
    };

    // 売上金額が欠落したケース
    const incompleteDataMissingSalesAmount = {
      customerId: 'CUST001',
      salesAmount: null,
      transactionDate: '2024-01-15',
    };

    // 取引日付が欠落したケース
    const incompleteDataMissingTransactionDate = {
      customerId: 'CUST001',
      salesAmount: 50000,
      transactionDate: null,
    };

    // ========================================
    // テスト実行 - 顧客IDが欠落
    // ========================================
    const resultMissingCustomerId = validateSalesDataCompleteness(
      incompleteDataMissingCustomerId
    );

    expect(resultMissingCustomerId.isComplete).toBe(false);
    expect(resultMissingCustomerId.status).toBe('incomplete');
    expect(resultMissingCustomerId.missingFields).toContain('customerId');
    expect(resultMissingCustomerId.errorMessage).toMatch(/customerId/);

    // ========================================
    // テスト実行 - 売上金額が欠落
    // ========================================
    const resultMissingSalesAmount = validateSalesDataCompleteness(
      incompleteDataMissingSalesAmount
    );

    expect(resultMissingSalesAmount.isComplete).toBe(false);
    expect(resultMissingSalesAmount.status).toBe('incomplete');
    expect(resultMissingSalesAmount.missingFields).toContain('salesAmount');
    expect(resultMissingSalesAmount.errorMessage).toMatch(/salesAmount/);

    // ========================================
    // テスト実行 - 取引日付が欠落
    // ========================================
    const resultMissingTransactionDate = validateSalesDataCompleteness(
      incompleteDataMissingTransactionDate
    );

    expect(resultMissingTransactionDate.isComplete).toBe(false);
    expect(resultMissingTransactionDate.status).toBe('incomplete');
    expect(resultMissingTransactionDate.missingFields).toContain(
      'transactionDate'
    );
    expect(resultMissingTransactionDate.errorMessage).toMatch(
      /transactionDate/
    );

    // ========================================
    // テスト実行 - 複数項目が欠落
    // ========================================
    const incompleteDataMultipleMissing = {
      customerId: null,
      salesAmount: null,
      transactionDate: '2024-01-15',
    };

    const resultMultipleMissing = validateSalesDataCompleteness(
      incompleteDataMultipleMissing
    );

    expect(resultMultipleMissing.isComplete).toBe(false);
    expect(resultMultipleMissing.status).toBe('incomplete');
    expect(resultMultipleMissing.missingFields).toContain('customerId');
    expect(resultMultipleMissing.missingFields).toContain('salesAmount');
    expect(resultMultipleMissing.missingFields.length).toBe(2);
    expect(resultMultipleMissing.errorMessage).toMatch(/customerId/);
    expect(resultMultipleMissing.errorMessage).toMatch(/salesAmount/);

    // ========================================
    // テスト実行 - すべて必須項目が揃った正常なケース
    // ========================================
    const completeData = {
      customerId: 'CUST001',
      salesAmount: 50000,
      transactionDate: '2024-01-15',
    };

    const resultComplete = validateSalesDataCompleteness(completeData);

    expect(resultComplete.isComplete).toBe(true);
    expect(resultComplete.status).toBe('complete');
    expect(resultComplete.missingFields).toEqual([]);
    expect(resultComplete.errorMessage).toBe('');

    // ========================================
    // テスト実行 - エラーケース：型が不正な場合
    // ========================================
    const invalidTypeData = {
      customerId: 'CUST001',
      salesAmount: 'invalid_amount',
      transactionDate: '2024-01-15',
    };

    expect(() => validateSalesDataCompleteness(invalidTypeData)).toThrow(
      /salesAmount/
    );

    // ========================================
    // テスト実行 - エラーケース：日付形式が不正な場合
    // ========================================
    const invalidDateFormatData = {
      customerId: 'CUST001',
      salesAmount: 50000,
      transactionDate: 'invalid-date',
    };

    expect(() => validateSalesDataCompleteness(invalidDateFormatData)).toThrow(
      /transactionDate/
    );
  });
});