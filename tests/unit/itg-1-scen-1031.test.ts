import { describe, test, expect } from '@jest/globals';
import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-1031: [normal] 営業データ自動検証ルール定義と異常検出 - 営業データが全ての必須項目を正常に満たす場合、検証OK と判定される
  test('営業データが全必須項目を正常に満たす場合、検証ステータスがOKと判定される', () => {
    const sales_data = {
      customer_name: '株式会社テスト営業',
      product_name: 'クラウドサービスプラン',
      amount: 150000,
      transaction_date: '2024-01-15',
      sales_person: '田中太郎'
    };

    const result = validateSalesData(sales_data);

    expect(result.validation_status).toBe('検証OK');
    expect(result.is_valid).toBe(true);
    expect(result.error_count).toBe(0);
    expect(result.errors).toEqual([]);
    expect(result.has_check_mark).toBe(true);
    expect(result.error_message_display).toBe(false);
  });

  test('営業データから必須項目の顧客名が欠落している場合、エラーが検出される', () => {
    const sales_data = {
      customer_name: '',
      product_name: 'クラウドサービスプラン',
      amount: 150000,
      transaction_date: '2024-01-15',
      sales_person: '田中太郎'
    };

    const result = validateSalesData(sales_data);

    expect(result.validation_status).toBe('検証NG');
    expect(result.is_valid).toBe(false);
    expect(result.error_count).toBeGreaterThan(0);
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: 'customer_name',
      message: expect.stringMatching(/顧客名/)
    }));
  });

  test('営業データから必須項目の商品名が欠落している場合、エラーが検出される', () => {
    const sales_data = {
      customer_name: '株式会社テスト営業',
      product_name: '',
      amount: 150000,
      transaction_date: '2024-01-15',
      sales_person: '田中太郎'
    };

    const result = validateSalesData(sales_data);

    expect(result.validation_status).toBe('検証NG');
    expect(result.is_valid).toBe(false);
    expect(result.error_count).toBeGreaterThan(0);
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: 'product_name',
      message: expect.stringMatching(/商品名/)
    }));
  });

  test('営業データの金額がマイナス値の場合、異常値として検出される', () => {
    const sales_data = {
      customer_name: '株式会社テスト営業',
      product_name: 'クラウドサービスプラン',
      amount: -50000,
      transaction_date: '2024-01-15',
      sales_person: '田中太郎'
    };

    const result = validateSalesData(sales_data);

    expect(result.validation_status).toBe('検証NG');
    expect(result.is_valid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: 'amount',
      message: expect.stringMatching(/金額/)
    }));
  });

  test('営業データの取引日付が不正な形式の場合、データ型エラーが検出される', () => {
    const sales_data = {
      customer_name: '株式会社テスト営業',
      product_name: 'クラウドサービスプラン',
      amount: 150000,
      transaction_date: '2024/01/15',
      sales_person: '田中太郎'
    };

    const result = validateSalesData(sales_data);

    expect(result.validation_status).toBe('検証NG');
    expect(result.is_valid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: 'transaction_date',
      message: expect.stringMatching(/日付|形式/)
    }));
  });

  test('営業データから営業担当者が欠落している場合、エラーが検出される', () => {
    const sales_data = {
      customer_name: '株式会社テスト営業',
      product_name: 'クラウドサービスプラン',
      amount: 150000,
      transaction_date: '2024-01-15',
      sales_person: ''
    };

    const result = validateSalesData(sales_data);

    expect(result.validation_status).toBe('検証NG');
    expect(result.is_valid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: 'sales_person',
      message: expect.stringMatching(/営業担当者/)
    }));
  });

  test('営業データが複数の必須項目欠落を持つ場合、すべてのエラーが検出される', () => {
    const sales_data = {
      customer_name: '',
      product_name: '',
      amount: 150000,
      transaction_date: '2024-01-15',
      sales_person: ''
    };

    const result = validateSalesData(sales_data);

    expect(result.validation_status).toBe('検証NG');
    expect(result.is_valid).toBe(false);
    expect(result.error_count).toBe(3);
    expect(result.errors.length).toBe(3);
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: 'customer_name'
    }));
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: 'product_name'
    }));
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: 'sales_person'
    }));
  });

  test('営業データの金額が0の場合、異常値として検出される', () => {
    const sales_data = {
      customer_name: '株式会社テスト営業',
      product_name: 'クラウドサービスプラン',
      amount: 0,
      transaction_date: '2024-01-15',
      sales_person: '田中太郎'
    };

    const result = validateSalesData(sales_data);

    expect(result.validation_status).toBe('検証NG');
    expect(result.is_valid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: 'amount',
      message: expect.stringMatching(/金額/)
    }));
  });

  test('営業データの全必須項目が正常で、検証結果画面に緑色チェックマークが表示される', () => {
    const sales_data = {
      customer_name: '株式会社テスト営業',
      product_name: 'クラウドサービスプラン',
      amount: 250000,
      transaction_date: '2024-01-20',
      sales_person: '鈴木花子'
    };

    const result = validateSalesData(sales_data);

    expect(result.validation_status).toBe('検証OK');
    expect(result.is_valid).toBe(true);
    expect(result.error_count).toBe(0);
    expect(result.errors).toEqual([]);
    expect(result.has_check_mark).toBe(true);
    expect(result.check_mark_color).toBe('green');
    expect(result.error_message_display).toBe(false);
  });

  test('営業データが必須項目を満たさない場合、エラーメッセージが表示される', () => {
    const sales_data = {
      customer_name: '株式会社テスト営業',
      product_name: '',
      amount: 150000,
      transaction_date: '2024-01-15',
      sales_person: '田中太郎'
    };

    const result = validateSalesData(sales_data);

    expect(result.error_message_display).toBe(true);
    expect(result.validation_status).toBe('検証NG');
    expect(result.is_valid).toBe(false);
  });
});