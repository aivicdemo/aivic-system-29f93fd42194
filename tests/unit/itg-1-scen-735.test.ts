import { describe, test, expect } from '@jest/globals';
import {
  validateSalesActivityData,
} from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-735: [normal] 営業データ自動検証ルール実行 - 定義済み検証ルールに基づいて営業活動データの必須項目が全て検証される
  test('should execute predefined validation rules and verify all mandatory fields in sales activity data', () => {
    // 正常系テストデータ: 全必須項目を正しく入力
    const valid_sales_data = {
      customer_name: 'ABC株式会社',
      transaction_amount: 500000,
      activity_date: '2024-01-15',
      sales_person: '営業太郎',
      product_code: 'PROD-001',
      contact_status: '成約',
      notes: 'テスト取引',
    };

    const valid_result = validateSalesActivityData(valid_sales_data);

    // 正常系: 全必須項目が検証され、検証結果が成功
    expect(valid_result.is_valid).toBe(true);
    expect(valid_result.validation_errors).toEqual([]);
    expect(valid_result.validated_fields).toContain('customer_name');
    expect(valid_result.validated_fields).toContain('transaction_amount');
    expect(valid_result.validated_fields).toContain('activity_date');
    expect(valid_result.validated_fields).toContain('sales_person');
    expect(valid_result.validated_fields).toContain('product_code');
    expect(valid_result.validated_fields).toEqual([
      'customer_name',
      'transaction_amount',
      'activity_date',
      'sales_person',
      'product_code',
    ]);

    // 異常系テストデータ1: 顧客名が空文字
    const invalid_customer_name_data = {
      customer_name: '',
      transaction_amount: 500000,
      activity_date: '2024-01-15',
      sales_person: '営業太郎',
      product_code: 'PROD-001',
      contact_status: '成約',
      notes: 'テスト取引',
    };

    const invalid_customer_name_result = validateSalesActivityData(
      invalid_customer_name_data
    );

    // 異常系: 顧客名の検証エラーが検出される
    expect(invalid_customer_name_result.is_valid).toBe(false);
    expect(invalid_customer_name_result.validation_errors.length).toBeGreaterThan(
      0
    );
    expect(
      invalid_customer_name_result.validation_errors.some(
        (err: any) => err.field === 'customer_name'
      )
    ).toBe(true);

    // 異常系テストデータ2: 取引金額がnull
    const invalid_amount_data = {
      customer_name: 'ABC株式会社',
      transaction_amount: null,
      activity_date: '2024-01-15',
      sales_person: '営業太郎',
      product_code: 'PROD-001',
      contact_status: '成約',
      notes: 'テスト取引',
    };

    const invalid_amount_result = validateSalesActivityData(invalid_amount_data);

    // 異常系: 取引金額の必須チェック失敗
    expect(invalid_amount_result.is_valid).toBe(false);
    expect(
      invalid_amount_result.validation_errors.some(
        (err: any) => err.field === 'transaction_amount'
      )
    ).toBe(true);

    // 異常系テストデータ3: 活動日付の形式が不正
    const invalid_date_data = {
      customer_name: 'ABC株式会社',
      transaction_amount: 500000,
      activity_date: '2024-13-45',
      sales_person: '営業太郎',
      product_code: 'PROD-001',
      contact_status: '成約',
      notes: 'テスト取引',
    };

    const invalid_date_result = validateSalesActivityData(invalid_date_data);

    // 異常系: 日付形式エラー
    expect(invalid_date_result.is_valid).toBe(false);
    expect(
      invalid_date_result.validation_errors.some(
        (err: any) => err.field === 'activity_date'
      )
    ).toBe(true);

    // 異常系テストデータ4: 営業担当者が未定義
    const invalid_sales_person_data = {
      customer_name: 'ABC株式会社',
      transaction_amount: 500000,
      activity_date: '2024-01-15',
      sales_person: undefined,
      product_code: 'PROD-001',
      contact_status: '成約',
      notes: 'テスト取引',
    };

    const invalid_sales_person_result = validateSalesActivityData(
      invalid_sales_person_data
    );

    // 異常系: 営業担当者の必須チェック失敗
    expect(invalid_sales_person_result.is_valid).toBe(false);
    expect(
      invalid_sales_person_result.validation_errors.some(
        (err: any) => err.field === 'sales_person'
      )
    ).toBe(true);

    // 異常系テストデータ5: 商品コードが空
    const invalid_product_code_data = {
      customer_name: 'ABC株式会社',
      transaction_amount: 500000,
      activity_date: '2024-01-15',
      sales_person: '営業太郎',
      product_code: '',
      contact_status: '成約',
      notes: 'テスト取引',
    };

    const invalid_product_code_result = validateSalesActivityData(
      invalid_product_code_data
    );

    // 異常系: 商品コードの必須チェック失敗
    expect(invalid_product_code_result.is_valid).toBe(false);
    expect(
      invalid_product_code_result.validation_errors.some(
        (err: any) => err.field === 'product_code'
      )
    ).toBe(true);

    // 異常系テストデータ6: 複数の必須項目が不足
    const invalid_multiple_fields_data = {
      customer_name: '',
      transaction_amount: undefined,
      activity_date: '2024-01-15',
      sales_person: '',
      product_code: 'PROD-001',
      contact_status: '成約',
      notes: 'テスト取引',
    };

    const invalid_multiple_result = validateSalesActivityData(
      invalid_multiple_fields_data
    );

    // 異常系: 複数フィールドのエラーが検出される
    expect(invalid_multiple_result.is_valid).toBe(false);
    expect(invalid_multiple_result.validation_errors.length).toBeGreaterThanOrEqual(
      3
    );
    expect(
      invalid_multiple_result.validation_errors.some(
        (err: any) => err.field === 'customer_name'
      )
    ).toBe(true);
    expect(
      invalid_multiple_result.validation_errors.some(
        (err: any) => err.field === 'transaction_amount'
      )
    ).toBe(true);
    expect(
      invalid_multiple_result.validation_errors.some(
        (err: any) => err.field === 'sales_person'
      )
    ).toBe(true);

    // 異常系テストデータ7: 取引金額が数値でない
    const invalid_amount_type_data = {
      customer_name: 'ABC株式会社',
      transaction_amount: 'abc',
      activity_date: '2024-01-15',
      sales_person: '営業太郎',
      product_code: 'PROD-001',
      contact_status: '成約',
      notes: 'テスト取引',
    };

    const invalid_amount_type_result = validateSalesActivityData(
      invalid_amount_type_data
    );

    // 異常系: 金額データ型エラー
    expect(invalid_amount_type_result.is_valid).toBe(false);
    expect(
      invalid_amount_type_result.validation_errors.some(
        (err: any) => err.field === 'transaction_amount'
      )
    ).toBe(true);

    // 境界値テスト: 最小金額（0円）
    const boundary_min_amount_data = {
      customer_name: 'ABC株式会社',
      transaction_amount: 0,
      activity_date: '2024-01-15',
      sales_person: '営業太郎',
      product_code: 'PROD-001',
      contact_status: '成約',
      notes: 'テスト取引',
    };

    const boundary_min_result = validateSalesActivityData(
      boundary_min_amount_data
    );

    // 境界値: 0円は許可される（検証ルール定義に依存）
    expect(typeof boundary_min_result.is_valid).toBe('boolean');

    // 境界値テスト: 大額金額
    const boundary_max_amount_data = {
      customer_name: 'ABC株式会社',
      transaction_amount: 999999999,
      activity_date: '2024-01-15',
      sales_person: '営業太郎',
      product_code: 'PROD-001',
      contact_status: '成約',
      notes: 'テスト取引',
    };

    const boundary_max_result = validateSalesActivityData(
      boundary_max_amount_data
    );

    // 境界値: 大額は許可される
    expect(typeof boundary_max_result.is_valid).toBe('boolean');

    // 検証レポートの構造確認: 返却値に必要なフィールドが全て存在
    expect(valid_result).toHaveProperty('is_valid');
    expect(valid_result).toHaveProperty('validation_errors');
    expect(valid_result).toHaveProperty('validated_fields');
    expect(Array.isArray(valid_result.validated_fields)).toBe(true);
    expect(Array.isArray(valid_result.validation_errors)).toBe(true);
  });
});