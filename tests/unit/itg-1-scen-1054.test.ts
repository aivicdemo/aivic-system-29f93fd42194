import { describe, test, expect } from '@jest/globals';
import { validateSalesDataFields } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  test('SCEN-1054: 営業データ入力時の品質検証 - 日付フィールドに不正な形式が入力されたとき型不整合エラーが検出される', () => {
    // ===== 不正な日付形式テスト 1: 月が範囲外 =====
    const input_invalid_month = {
      contract_date: '2024-13-01',
      contact_datetime: '2024-01-15T10:00:00Z',
      sales_activity_date: '2024-01-15',
      outcome_amount: 100000,
    };
    
    expect(() => validateSalesDataFields(input_invalid_month)).toThrow(/日付形式/);

    // ===== 不正な日付形式テスト 2: 日が範囲外 =====
    const input_invalid_day = {
      contract_date: '2024-01-45',
      contact_datetime: '2024-01-15T10:00:00Z',
      sales_activity_date: '2024-01-15',
      outcome_amount: 100000,
    };
    
    expect(() => validateSalesDataFields(input_invalid_day)).toThrow(/日付形式/);

    // ===== 不正な日付形式テスト 3: 文字列形式 =====
    const input_invalid_text = {
      contract_date: 'abc',
      contact_datetime: '2024-01-15T10:00:00Z',
      sales_activity_date: '2024-01-15',
      outcome_amount: 100000,
    };
    
    expect(() => validateSalesDataFields(input_invalid_text)).toThrow(/日付形式/);

    // ===== 不正な日付形式テスト 4: 不完全な形式 =====
    const input_incomplete_format = {
      contract_date: '2024-12',
      contact_datetime: '2024-01-15T10:00:00Z',
      sales_activity_date: '2024-01-15',
      outcome_amount: 100000,
    };
    
    expect(() => validateSalesDataFields(input_incomplete_format)).toThrow(/日付形式/);

    // ===== 不正な日付形式テスト 5: スラッシュ形式 =====
    const input_slash_format = {
      contract_date: '2024/13/45',
      contact_datetime: '2024-01-15T10:00:00Z',
      sales_activity_date: '2024-01-15',
      outcome_amount: 100000,
    };
    
    expect(() => validateSalesDataFields(input_slash_format)).toThrow(/日付形式/);

    // ===== 不正な日付形式テスト 6: 月が無効 (スラッシュ形式) =====
    const input_invalid_month_slash = {
      contract_date: '2024/13/01',
      contact_datetime: '2024-01-15T10:00:00Z',
      sales_activity_date: '2024-01-15',
      outcome_amount: 100000,
    };
    
    expect(() => validateSalesDataFields(input_invalid_month_slash)).toThrow(/日付形式/);

    // ===== 正常系: 有効な日付形式 =====
    const input_valid = {
      contract_date: '2024-01-15',
      contact_datetime: '2024-01-15T10:00:00Z',
      sales_activity_date: '2024-01-15',
      outcome_amount: 100000,
    };
    
    const result_valid = validateSalesDataFields(input_valid);
    expect(result_valid.is_valid).toBe(true);
    expect(result_valid.errors).toEqual([]);

    // ===== 正常系: うるう年の有効な日付 =====
    const input_leap_year = {
      contract_date: '2024-02-29',
      contact_datetime: '2024-02-29T10:00:00Z',
      sales_activity_date: '2024-02-29',
      outcome_amount: 100000,
    };
    
    const result_leap = validateSalesDataFields(input_leap_year);
    expect(result_leap.is_valid).toBe(true);
    expect(result_leap.errors).toEqual([]);

    // ===== 正常系: 年末の有効な日付 =====
    const input_year_end = {
      contract_date: '2024-12-31',
      contact_datetime: '2024-12-31T23:59:59Z',
      sales_activity_date: '2024-12-31',
      outcome_amount: 100000,
    };
    
    const result_year_end = validateSalesDataFields(input_year_end);
    expect(result_year_end.is_valid).toBe(true);
    expect(result_year_end.errors).toEqual([]);

    // ===== 複合エラーテスト: 複数フィールドに不正な日付 =====
    const input_multiple_invalid = {
      contract_date: '2024-13-01',
      contact_datetime: 'invalid-datetime',
      sales_activity_date: '2024-01-45',
      outcome_amount: 100000,
    };
    
    const result_multiple = validateSalesDataFields(input_multiple_invalid);
    expect(result_multiple.is_valid).toBe(false);
    expect(result_multiple.errors.length).toBeGreaterThan(0);
    expect(result_multiple.errors.some((err: any) => err.includes('日付形式'))).toBe(true);
  });
});