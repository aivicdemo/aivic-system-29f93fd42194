import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ検証ルール実行機能', () => {
  // SCEN-1294: [normal] 営業データ検証ルール実行機能 - 営業データが全ての検証ルール条件を満たす場合、検証が完了し通過ステータスが返却される
  test('全ての検証ルール条件を満たす営業データの場合、通過ステータスと検証結果OKが返却される', () => {
    const valid_sales_data = {
      customer_name: '株式会社ABC',
      contact_date: '2024-01-15',
      contact_time: '10:30',
      business_content: '営業活動記録',
      appointment_status: '確定',
      amount: 150000,
      sales_staff_name: '佐藤太郎',
      service_type: 'サービスA',
    };

    const result = validateSalesData(valid_sales_data);

    expect(result.status).toBe('通過');
    expect(result.validation_result).toBe('OK');
    expect(result.error_message).toBeNull();
    expect(result.error_details).toEqual([]);
    expect(result.validation_log).toBe('合格');
  });

  test('必須項目が欠落している場合、不合格ステータスとエラー詳細が返却される', () => {
    const invalid_sales_data_missing_field = {
      customer_name: '株式会社ABC',
      contact_date: '2024-01-15',
      contact_time: '10:30',
      business_content: '',
      appointment_status: '確定',
      amount: 150000,
      sales_staff_name: '佐藤太郎',
      service_type: 'サービスA',
    };

    const result = validateSalesData(invalid_sales_data_missing_field);

    expect(result.status).toBe('不合格');
    expect(result.validation_result).not.toBe('OK');
    expect(result.error_message).toContain('営業内容');
    expect(result.error_details.length).toBeGreaterThan(0);
    expect(result.validation_log).toBe('不合格');
  });

  test('金額が負の値である場合、不合格ステータスと金額エラーが返却される', () => {
    const invalid_sales_data_negative_amount = {
      customer_name: '株式会社ABC',
      contact_date: '2024-01-15',
      contact_time: '10:30',
      business_content: '営業活動記録',
      appointment_status: '確定',
      amount: -50000,
      sales_staff_name: '佐藤太郎',
      service_type: 'サービスA',
    };

    const result = validateSalesData(invalid_sales_data_negative_amount);

    expect(result.status).toBe('不合格');
    expect(result.error_message).toContain('金額');
  });

  test('日付形式が不正である場合、不合格ステータスと日付エラーが返却される', () => {
    const invalid_sales_data_invalid_date = {
      customer_name: '株式会社ABC',
      contact_date: '2024/01/15',
      contact_time: '10:30',
      business_content: '営業活動記録',
      appointment_status: '確定',
      amount: 150000,
      sales_staff_name: '佐藤太郎',
      service_type: 'サービスA',
    };

    const result = validateSalesData(invalid_sales_data_invalid_date);

    expect(result.status).toBe('不合格');
    expect(result.error_message).toContain('日付');
  });

  test('営業担当者名が空文字列の場合、不合格ステータスと営業担当者エラーが返却される', () => {
    const invalid_sales_data_empty_staff = {
      customer_name: '株式会社ABC',
      contact_date: '2024-01-15',
      contact_time: '10:30',
      business_content: '営業活動記録',
      appointment_status: '確定',
      amount: 150000,
      sales_staff_name: '',
      service_type: 'サービスA',
    };

    const result = validateSalesData(invalid_sales_data_empty_staff);

    expect(result.status).toBe('不合格');
    expect(result.error_message).toContain('営業担当者');
  });

  test('顧客名が空文字列の場合、不合格ステータスと顧客名エラーが返却される', () => {
    const invalid_sales_data_empty_customer = {
      customer_name: '',
      contact_date: '2024-01-15',
      contact_time: '10:30',
      business_content: '営業活動記録',
      appointment_status: '確定',
      amount: 150000,
      sales_staff_name: '佐藤太郎',
      service_type: 'サービスA',
    };

    const result = validateSalesData(invalid_sales_data_empty_customer);

    expect(result.status).toBe('不合格');
    expect(result.error_message).toContain('顧客名');
  });

  test('アポ確定状況が無効な値の場合、不合格ステータスとステータスエラーが返却される', () => {
    const invalid_sales_data_invalid_appointment = {
      customer_name: '株式会社ABC',
      contact_date: '2024-01-15',
      contact_time: '10:30',
      business_content: '営業活動記録',
      appointment_status: '無効な状態',
      amount: 150000,
      sales_staff_name: '佐藤太郎',
      service_type: 'サービスA',
    };

    const result = validateSalesData(invalid_sales_data_invalid_appointment);

    expect(result.status).toBe('不合格');
    expect(result.error_message).toContain('アポ確定状況');
  });

  test('複数の検証ルール違反がある場合、全てのエラーが詳細に返却される', () => {
    const invalid_sales_data_multiple_errors = {
      customer_name: '',
      contact_date: '2024/01/15',
      contact_time: '10:30',
      business_content: '',
      appointment_status: '無効',
      amount: -50000,
      sales_staff_name: '',
      service_type: 'サービスA',
    };

    const result = validateSalesData(invalid_sales_data_multiple_errors);

    expect(result.status).toBe('不合格');
    expect(result.validation_result).not.toBe('OK');
    expect(result.error_details.length).toBeGreaterThanOrEqual(4);
    expect(result.validation_log).toBe('不合格');
  });

  test('金額が最大値を超える場合、不合格ステータスと金額上限エラーが返却される', () => {
    const invalid_sales_data_amount_over_limit = {
      customer_name: '株式会社ABC',
      contact_date: '2024-01-15',
      contact_time: '10:30',
      business_content: '営業活動記録',
      appointment_status: '確定',
      amount: 99999999999,
      sales_staff_name: '佐藤太郎',
      service_type: 'サービスA',
    };

    const result = validateSalesData(invalid_sales_data_amount_over_limit);

    expect(result.status).toBe('不合格');
    expect(result.error_message).toContain('金額');
  });

  test('時間形式が不正である場合、不合格ステータスと時間エラーが返却される', () => {
    const invalid_sales_data_invalid_time = {
      customer_name: '株式会社ABC',
      contact_date: '2024-01-15',
      contact_time: '25:90',
      business_content: '営業活動記録',
      appointment_status: '確定',
      amount: 150000,
      sales_staff_name: '佐藤太郎',
      service_type: 'サービスA',
    };

    const result = validateSalesData(invalid_sales_data_invalid_time);

    expect(result.status).toBe('不合格');
    expect(result.error_message).toContain('時間');
  });
});