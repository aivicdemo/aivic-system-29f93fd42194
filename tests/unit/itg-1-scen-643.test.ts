import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateSalesDataCompleteness } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性検証', () => {
  // SCEN-643: [error] 月次営業データの完全性・正確性検証機能 - 必須項目が欠落しているデータ行は検証エラーとして検出される
  test('必須項目が欠落しているデータ行は検証エラーとして検出される', () => {
    const input_data_rows = [
      {
        row_number: 1,
        customer_id: 'CUST001',
        transaction_date: '2024-01-15',
        amount: 10000,
        product_code: 'PROD_A'
      },
      {
        row_number: 2,
        customer_id: 'CUST002',
        transaction_date: '2024-01-16',
        amount: null,
        product_code: 'PROD_B'
      },
      {
        row_number: 3,
        customer_id: null,
        transaction_date: '2024-01-17',
        amount: 15000,
        product_code: 'PROD_C'
      },
      {
        row_number: 4,
        customer_id: 'CUST004',
        transaction_date: '',
        amount: 20000,
        product_code: 'PROD_D'
      },
      {
        row_number: 5,
        customer_id: 'CUST005',
        transaction_date: '2024-01-19',
        amount: 25000,
        product_code: 'PROD_E'
      }
    ];

    const required_fields = [
      'customer_id',
      'transaction_date',
      'amount',
      'product_code'
    ];

    const result = validateSalesDataCompleteness({
      data_rows: input_data_rows,
      required_fields: required_fields
    });

    // エラーステータスが表示される
    expect(result.validation_status).toBe('error');

    // エラー件数が正確にカウントされる（行2:金額欠落、行3:顧客ID欠落、行4:取引日欠落）
    expect(result.error_count).toBe(3);

    // エラー行の詳細が返される
    expect(result.error_details).toEqual([
      {
        row_number: 2,
        missing_fields: ['amount'],
        error_message: '必須項目「金額」が欠落しています'
      },
      {
        row_number: 3,
        missing_fields: ['customer_id'],
        error_message: '必須項目「顧客ID」が欠落しています'
      },
      {
        row_number: 4,
        missing_fields: ['transaction_date'],
        error_message: '必須項目「取引日」が欠落しています'
      }
    ]);

    // 成功した行数が返される
    expect(result.success_count).toBe(2);

    // 処理中断フラグが設定される
    expect(result.processing_halted).toBe(true);

    // エラーメッセージが含まれる
    expect(result.summary_message).toMatch(/必須項目/);
  });
});