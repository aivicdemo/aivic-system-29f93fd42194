import { describe, test, expect } from '@jest/globals';
import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質基準チェック・承認機能', () => {
  // SCEN-728: 修正済みデータの必須項目が空文字列である場合、検証エラーとして検出される
  test('修正済みデータの必須項目が空文字列のとき、必須項目エラーを検出し承認ボタンを無効化する', () => {
    // 必須項目が空文字列であるデータ
    const corrected_data = {
      customer_name: '',
      amount: '10000',
      transaction_date: '2024-01-15',
      service_type: '営業支援',
      appointment_count: '5',
      contract_count: '2',
      status: 'corrected'
    };

    // 検証実行
    const validation_result = validateSalesDataQuality(corrected_data);

    // 期待値: 検証エラーが検出される
    expect(validation_result.is_valid).toBe(false);
    expect(validation_result.has_errors).toBe(true);
    expect(validation_result.errors.length).toBeGreaterThan(0);

    // 必須項目エラーが明確に指摘されていることを確認
    const error_message = validation_result.errors[0].message;
    expect(error_message).toMatch(/必須項目/);

    // 承認ボタンが無効化される（is_approvable が false）
    expect(validation_result.is_approvable).toBe(false);
  });

  // 複数の必須項目が空文字列の場合、すべてのエラーが検出される
  test('複数の必須項目が空文字列のとき、すべてのエラーを検出する', () => {
    const corrected_data = {
      customer_name: '',
      amount: '',
      transaction_date: '2024-01-15',
      service_type: '',
      appointment_count: '5',
      contract_count: '2',
      status: 'corrected'
    };

    const validation_result = validateSalesDataQuality(corrected_data);

    // 複数のエラーが検出されることを確認
    expect(validation_result.is_valid).toBe(false);
    expect(validation_result.errors.length).toBeGreaterThanOrEqual(3);

    // すべてのエラーが必須項目に関するものであることを確認
    const all_required_field_errors = validation_result.errors.every(
      error => error.message.match(/必須項目/)
    );
    expect(all_required_field_errors).toBe(true);

    // 承認ボタンが無効化される
    expect(validation_result.is_approvable).toBe(false);
  });

  // 必須項目がすべて入力されている場合、検証エラーが検出されず承認可能となる
  test('すべての必須項目が正しく入力されているとき、検証エラーが検出されず承認可能となる', () => {
    const corrected_data = {
      customer_name: '株式会社ABC',
      amount: '10000',
      transaction_date: '2024-01-15',
      service_type: '営業支援',
      appointment_count: '5',
      contract_count: '2',
      status: 'corrected'
    };

    const validation_result = validateSalesDataQuality(corrected_data);

    // 検証エラーが検出されないことを確認
    expect(validation_result.is_valid).toBe(true);
    expect(validation_result.has_errors).toBe(false);
    expect(validation_result.errors.length).toBe(0);

    // 承認ボタンが有効化される
    expect(validation_result.is_approvable).toBe(true);
  });

  // 必須項目が空文字列で、データ型エラーも同時に存在する場合
  test('必須項目が空文字列かつデータ型エラーが存在するとき、すべてのエラーが検出される', () => {
    const corrected_data = {
      customer_name: '',
      amount: 'invalid_amount',
      transaction_date: '2024-01-15',
      service_type: '営業支援',
      appointment_count: '5',
      contract_count: '2',
      status: 'corrected'
    };

    const validation_result = validateSalesDataQuality(corrected_data);

    // 複数のエラーが検出されることを確認
    expect(validation_result.is_valid).toBe(false);
    expect(validation_result.errors.length).toBeGreaterThanOrEqual(2);

    // 必須項目エラーが含まれていることを確認
    const has_required_field_error = validation_result.errors.some(
      error => error.message.match(/必須項目/)
    );
    expect(has_required_field_error).toBe(true);

    // 承認ボタンが無効化される
    expect(validation_result.is_approvable).toBe(false);
  });

  // 必須項目のうち1つのみが空文字列の場合、その項目のみエラーが検出される
  test('必須項目の1つのみが空文字列のとき、その項目に限定したエラーが検出される', () => {
    const corrected_data = {
      customer_name: '株式会社ABC',
      amount: '',
      transaction_date: '2024-01-15',
      service_type: '営業支援',
      appointment_count: '5',
      contract_count: '2',
      status: 'corrected'
    };

    const validation_result = validateSalesDataQuality(corrected_data);

    // 検証エラーが検出されることを確認
    expect(validation_result.is_valid).toBe(false);
    expect(validation_result.has_errors).toBe(true);

    // エラーが amount フィールドに限定されていることを確認
    expect(validation_result.errors.length).toBe(1);
    const error_field = validation_result.errors[0].field_name;
    expect(error_field).toBe('amount');

    // 承認ボタンが無効化される
    expect(validation_result.is_approvable).toBe(false);
  });
});