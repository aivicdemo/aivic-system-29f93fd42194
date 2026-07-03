import { describe, test, expect } from '@jest/globals';
import { validateContractChangeNotification } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-867: [error] 契約変更検証期限自動計算機能 - 契約変更通知のタイムスタンプが不正な場合にエラーが発生する
  test('should throw error when contract change notification timestamp is invalid format', () => {
    const invalid_timestamp_month = '2024-13-45';
    expect(() => validateContractChangeNotification({ timestamp: invalid_timestamp_month }))
      .toThrow(/タイムスタンプ/);
  });

  test('should throw error when contract change notification timestamp is invalid string', () => {
    const invalid_timestamp_text = 'invalid';
    expect(() => validateContractChangeNotification({ timestamp: invalid_timestamp_text }))
      .toThrow(/タイムスタンプ/);
  });

  test('should throw error when contract change notification timestamp is empty string', () => {
    const invalid_timestamp_empty = '';
    expect(() => validateContractChangeNotification({ timestamp: invalid_timestamp_empty }))
      .toThrow(/タイムスタンプ/);
  });

  test('should throw error when contract change notification timestamp is null', () => {
    const invalid_timestamp_null = null;
    expect(() => validateContractChangeNotification({ timestamp: invalid_timestamp_null }))
      .toThrow(/タイムスタンプ/);
  });

  test('should throw error when contract change notification timestamp is undefined', () => {
    const invalid_timestamp_undefined = undefined;
    expect(() => validateContractChangeNotification({ timestamp: invalid_timestamp_undefined }))
      .toThrow(/タイムスタンプ/);
  });

  test('should throw error when contract change notification timestamp is malformed ISO string', () => {
    const invalid_timestamp_malformed = '2024-01-15T25:70:99Z';
    expect(() => validateContractChangeNotification({ timestamp: invalid_timestamp_malformed }))
      .toThrow(/タイムスタンプ/);
  });

  test('should succeed with valid ISO 8601 timestamp format', () => {
    const valid_timestamp = '2024-01-15T11:00:00Z';
    const result = validateContractChangeNotification({ timestamp: valid_timestamp });
    expect(result).toEqual({
      isValid: true,
      timestamp: valid_timestamp,
      verificationDeadline: '2024-01-22T11:00:00Z'
    });
  });

  test('should succeed with valid ISO 8601 timestamp with timezone offset', () => {
    const valid_timestamp_with_offset = '2024-01-15T20:00:00+09:00';
    const result = validateContractChangeNotification({ timestamp: valid_timestamp_with_offset });
    expect(result).toEqual({
      isValid: true,
      timestamp: valid_timestamp_with_offset,
      verificationDeadline: '2024-01-22T20:00:00+09:00'
    });
  });

  test('should calculate verification deadline as 7 days after notification timestamp', () => {
    const notification_timestamp = '2024-02-10T09:30:00Z';
    const result = validateContractChangeNotification({ timestamp: notification_timestamp });
    expect(result.verificationDeadline).toBe('2024-02-17T09:30:00Z');
  });

  test('should handle leap year boundary correctly in deadline calculation', () => {
    const leap_year_timestamp = '2024-02-22T15:45:00Z';
    const result = validateContractChangeNotification({ timestamp: leap_year_timestamp });
    expect(result.verificationDeadline).toBe('2024-02-29T15:45:00Z');
  });
});