import { describe, test, expect } from '@jest/globals';
import { validateSalesDataCompleteness } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性検証 - 境界値通知機能', () => {
  test('SCEN-1248: 売上金額が許容範囲の上限・下限に達した場合、警告レベルの通知を生成する', () => {
    // ===== 売上金額が上限値（1,000,000円）に達したケース =====
    const upper_limit_record = {
      sales_amount: 1000000,
      min_threshold: 0,
      max_threshold: 1000000,
      field_name: '売上金額',
      record_id: 'REC-001',
    };

    const upper_result = validateSalesDataCompleteness(upper_limit_record);

    expect(upper_result.is_valid).toBe(true);
    expect(upper_result.notifications).toHaveLength(1);
    expect(upper_result.notifications[0].level).toBe('Warning');
    expect(upper_result.notifications[0].message).toContain('売上金額');
    expect(upper_result.notifications[0].message).toContain('1000000');
    expect(upper_result.notifications[0].message).toContain('1000000');
    expect(upper_result.notifications[0].boundary_type).toBe('upper');

    // ===== 売上金額が下限値（0円）に達したケース =====
    const lower_limit_record = {
      sales_amount: 0,
      min_threshold: 0,
      max_threshold: 1000000,
      field_name: '売上金額',
      record_id: 'REC-002',
    };

    const lower_result = validateSalesDataCompleteness(lower_limit_record);

    expect(lower_result.is_valid).toBe(true);
    expect(lower_result.notifications).toHaveLength(1);
    expect(lower_result.notifications[0].level).toBe('Warning');
    expect(lower_result.notifications[0].message).toContain('売上金額');
    expect(lower_result.notifications[0].message).toContain('0');
    expect(lower_result.notifications[0].message).toContain('0');
    expect(lower_result.notifications[0].boundary_type).toBe('lower');

    // ===== 許容範囲内のケース（通知なし） =====
    const normal_record = {
      sales_amount: 500000,
      min_threshold: 0,
      max_threshold: 1000000,
      field_name: '売上金額',
      record_id: 'REC-003',
    };

    const normal_result = validateSalesDataCompleteness(normal_record);

    expect(normal_result.is_valid).toBe(true);
    expect(normal_result.notifications).toHaveLength(0);

    // ===== 許容範囲超過のケース（エラー通知） =====
    const over_limit_record = {
      sales_amount: 1500000,
      min_threshold: 0,
      max_threshold: 1000000,
      field_name: '売上金額',
      record_id: 'REC-004',
    };

    expect(() => validateSalesDataCompleteness(over_limit_record)).toThrow(/売上金額/);
  });
});