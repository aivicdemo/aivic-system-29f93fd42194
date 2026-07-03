import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-683: [normal] 営業データ品質自動検証・通知機能 - 必須項目欠落・データ型不整合・金額異常値が自動検出される
  test('必須項目欠落・データ型不整合・金額異常値が自動検出され、詳細なエラー内容が記載された通知が送信される', () => {
    // テストデータ: 必須項目欠落
    const data_missing_required = {
      record_id: 1,
      customer_id: null, // 欠落
      product_code: 'PROD-001',
      amount: 100000,
      transaction_date: '2024-01-15',
    };

    // テストデータ: データ型不整合
    const data_type_mismatch = {
      record_id: 2,
      customer_id: 'CUST-001',
      product_code: 'PROD-002',
      amount: 'invalid_amount', // 数値型であるべき
      transaction_date: '2024-01-15',
    };

    // テストデータ: 金額異常値（極端に大きい金額）
    const data_amount_abnormal_high = {
      record_id: 3,
      customer_id: 'CUST-003',
      product_code: 'PROD-003',
      amount: 999999999, // 通常範囲外（上限: 10000000）
      transaction_date: '2024-01-15',
    };

    // テストデータ: 金額異常値（極端に小さい金額）
    const data_amount_abnormal_low = {
      record_id: 4,
      customer_id: 'CUST-004',
      product_code: 'PROD-004',
      amount: -50000, // 負の金額
      transaction_date: '2024-01-15',
    };

    // テストデータ: 正常なレコード
    const data_valid = {
      record_id: 5,
      customer_id: 'CUST-005',
      product_code: 'PROD-005',
      amount: 250000,
      transaction_date: '2024-01-15',
    };

    const test_data = [
      data_missing_required,
      data_type_mismatch,
      data_amount_abnormal_high,
      data_amount_abnormal_low,
      data_valid,
    ];

    const validation_result = validateSalesData(test_data);

    // 検証結果の構造確認
    expect(validation_result).toBeDefined();
    expect(validation_result.is_valid).toBe(false);
    expect(validation_result.errors).toBeDefined();
    expect(Array.isArray(validation_result.errors)).toBe(true);

    // エラー数の確認: 4 件のエラー (正常なレコード 1 件は除外)
    expect(validation_result.errors.length).toBe(4);

    // 必須項目欠落の検出確認
    const missing_required_error = validation_result.errors.find(
      (e: any) => e.record_id === 1
    );
    expect(missing_required_error).toBeDefined();
    expect(missing_required_error.error_type).toBe('REQUIRED_FIELD_MISSING');
    expect(missing_required_error.field_name).toBe('customer_id');
    expect(missing_required_error.message).toMatch(/customer_id/);

    // データ型不整合の検出確認
    const type_mismatch_error = validation_result.errors.find(
      (e: any) => e.record_id === 2
    );
    expect(type_mismatch_error).toBeDefined();
    expect(type_mismatch_error.error_type).toBe('DATA_TYPE_MISMATCH');
    expect(type_mismatch_error.field_name).toBe('amount');
    expect(type_mismatch_error.expected_type).toBe('number');
    expect(type_mismatch_error.actual_type).toBe('string');
    expect(type_mismatch_error.message).toMatch(/amount/);

    // 金額異常値（上限超過）の検出確認
    const amount_high_error = validation_result.errors.find(
      (e: any) => e.record_id === 3
    );
    expect(amount_high_error).toBeDefined();
    expect(amount_high_error.error_type).toBe('AMOUNT_OUT_OF_RANGE');
    expect(amount_high_error.field_name).toBe('amount');
    expect(amount_high_error.actual_value).toBe(999999999);
    expect(amount_high_error.max_allowed).toBe(10000000);
    expect(amount_high_error.message).toMatch(/amount/);

    // 金額異常値（負の値）の検出確認
    const amount_low_error = validation_result.errors.find(
      (e: any) => e.record_id === 4
    );
    expect(amount_low_error).toBeDefined();
    expect(amount_low_error.error_type).toBe('AMOUNT_OUT_OF_RANGE');
    expect(amount_low_error.field_name).toBe('amount');
    expect(amount_low_error.actual_value).toBe(-50000);
    expect(amount_low_error.min_allowed).toBe(0);
    expect(amount_low_error.message).toMatch(/amount/);

    // 正常なレコードは errors に含まれない
    const valid_record_error = validation_result.errors.find(
      (e: any) => e.record_id === 5
    );
    expect(valid_record_error).toBeUndefined();

    // 通知情報の確認
    expect(validation_result.notifications).toBeDefined();
    expect(Array.isArray(validation_result.notifications)).toBe(true);
    expect(validation_result.notifications.length).toBeGreaterThan(0);

    // 通知に必須項目欠落が含まれているか
    const notification_missing = validation_result.notifications.find(
      (n: any) => n.error_type === 'REQUIRED_FIELD_MISSING'
    );
    expect(notification_missing).toBeDefined();
    expect(notification_missing.count).toBe(1);
    expect(notification_missing.details).toMatch(/customer_id/);

    // 通知にデータ型不整合が含まれているか
    const notification_type = validation_result.notifications.find(
      (n: any) => n.error_type === 'DATA_TYPE_MISMATCH'
    );
    expect(notification_type).toBeDefined();
    expect(notification_type.count).toBe(1);
    expect(notification_type.details).toMatch(/amount/);

    // 通知に金額異常値が含まれているか
    const notification_amount = validation_result.notifications.find(
      (n: any) => n.error_type === 'AMOUNT_OUT_OF_RANGE'
    );
    expect(notification_amount).toBeDefined();
    expect(notification_amount.count).toBe(2); // 上限超過と負の値
    expect(notification_amount.details).toMatch(/amount/);

    // サマリー情報の確認
    expect(validation_result.summary).toBeDefined();
    expect(validation_result.summary.total_records).toBe(5);
    expect(validation_result.summary.valid_records).toBe(1);
    expect(validation_result.summary.invalid_records).toBe(4);
    expect(validation_result.summary.validation_timestamp).toBeDefined();
    expect(typeof validation_result.summary.validation_timestamp).toBe('string');
  });
});