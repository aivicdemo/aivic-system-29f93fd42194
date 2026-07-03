import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateDataTypeIntegrity } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質管理 - データ型不一致の検証', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1331: [error] 品質管理ルール・チェックリスト作成 - データ型不一致の検証ルールが検出されて異常フラグが立つ
  test('数値型フィールドに文字列値を入力した場合、データ型不一致が検出され異常フラグが立つ', () => {
    const checklist_id = 'CHK-20240115-001';
    const field_name = '売上金額';
    const expected_data_type = 'number';
    const test_record = {
      record_id: 'REC-001',
      sales_amount: 'ABC',
      entry_date: '2024-01-15',
    };

    const result = validateDataTypeIntegrity({
      checklist_id,
      field_name,
      expected_data_type,
      test_record,
    });

    expect(result.has_error).toBe(true);
    expect(result.error_status).toBe('error');
    expect(result.error_message).toBe('データ型が不一致です');
    expect(result.record_id).toBe('REC-001');
    expect(result.validation_log_recorded).toBe(true);
  });

  // 数値型フィールドに正当な数値が入力された場合、検証をパスする
  test('数値型フィールドに正当な数値が入力された場合、検証をパスする', () => {
    const checklist_id = 'CHK-20240115-001';
    const field_name = '売上金額';
    const expected_data_type = 'number';
    const test_record = {
      record_id: 'REC-002',
      sales_amount: 15000,
      entry_date: '2024-01-15',
    };

    const result = validateDataTypeIntegrity({
      checklist_id,
      field_name,
      expected_data_type,
      test_record,
    });

    expect(result.has_error).toBe(false);
    expect(result.error_status).toBe('success');
    expect(result.error_message).toBe('');
    expect(result.record_id).toBe('REC-002');
    expect(result.validation_log_recorded).toBe(true);
  });

  // 日付型フィールドに無効な日付文字列が入力された場合、データ型不一致が検出される
  test('日付型フィールドに無効な日付文字列が入力された場合、データ型不一致が検出される', () => {
    const checklist_id = 'CHK-20240115-002';
    const field_name = '営業日';
    const expected_data_type = 'date';
    const test_record = {
      record_id: 'REC-003',
      business_date: '2024-13-45',
      sales_amount: 20000,
    };

    const result = validateDataTypeIntegrity({
      checklist_id,
      field_name,
      expected_data_type,
      test_record,
    });

    expect(result.has_error).toBe(true);
    expect(result.error_status).toBe('error');
    expect(result.error_message).toBe('データ型が不一致です');
    expect(result.record_id).toBe('REC-003');
    expect(result.validation_log_recorded).toBe(true);
  });

  // ブール型フィールドに無効な値が入力された場合、データ型不一致が検出される
  test('ブール型フィールドに無効な値が入力された場合、データ型不一致が検出される', () => {
    const checklist_id = 'CHK-20240115-003';
    const field_name = '確約状況';
    const expected_data_type = 'boolean';
    const test_record = {
      record_id: 'REC-004',
      appointment_confirmed: 'maybe',
      sales_amount: 25000,
    };

    const result = validateDataTypeIntegrity({
      checklist_id,
      field_name,
      expected_data_type,
      test_record,
    });

    expect(result.has_error).toBe(true);
    expect(result.error_status).toBe('error');
    expect(result.error_message).toBe('データ型が不一致です');
    expect(result.record_id).toBe('REC-004');
    expect(result.validation_log_recorded).toBe(true);
  });

  // 複数の検証ルールが適用される場合、最初に検出された不一致を返す
  test('複数の検証ルールが適用される場合、最初に検出された不一致を返す', () => {
    const checklist_id = 'CHK-20240115-004';
    const field_name = '売上金額';
    const expected_data_type = 'number';
    const test_record = {
      record_id: 'REC-005',
      sales_amount: null,
      entry_date: '2024-01-15',
    };

    const result = validateDataTypeIntegrity({
      checklist_id,
      field_name,
      expected_data_type,
      test_record,
    });

    expect(result.has_error).toBe(true);
    expect(result.error_status).toBe('error');
    expect(result.error_message).toBe('データ型が不一致です');
    expect(result.record_id).toBe('REC-005');
    expect(result.validation_log_recorded).toBe(true);
  });
});