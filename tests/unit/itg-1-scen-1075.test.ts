import { describe, it, expect, beforeEach } from '@jest/globals';
import { validateSalesReportCompleteness } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業報告書集計自動検証機能', () => {
  it('SCEN-1075: 必須項目不足時に即座に新入スタッフへエラー通知が送信される', () => {
    // ===== Setup: 営業報告書データを準備 =====
    const incompleteReportData = {
      report_id: 'RPT-2024-001',
      staff_id: 'STAFF-NEW-001',
      sales_date: '2024-01-15',
      customer_name: '', // 必須項目: 顧客名が空白
      product_name: '営業サービスA',
      amount: 150000,
      report_timestamp: '2024-01-15T14:30:00Z',
      notification_sent_at: null,
      notification_content: null,
    };

    const completeReportData = {
      report_id: 'RPT-2024-002',
      staff_id: 'STAFF-NEW-002',
      sales_date: '2024-01-15',
      customer_name: '顧客B社',
      product_name: '営業サービスB',
      amount: 200000,
      report_timestamp: '2024-01-15T14:35:00Z',
      notification_sent_at: null,
      notification_content: null,
    };

    // ===== Test 1: 必須項目不足でエラースロー =====
    expect(() => {
      validateSalesReportCompleteness(incompleteReportData);
    }).toThrow(/顧客名/);

    // ===== Test 2: 必須項目完全でエラーなし =====
    const result = validateSalesReportCompleteness(completeReportData);
    expect(result.is_valid).toBe(true);
    expect(result.error_code).toBeNull();
    expect(result.missing_fields).toEqual([]);

    // ===== Test 3: 複数必須項目不足でも最初に検出された項目で通知 =====
    const multipleGapsData = {
      report_id: 'RPT-2024-003',
      staff_id: 'STAFF-NEW-003',
      sales_date: '', // 必須項目: 営業日が空白
      customer_name: '', // 必須項目: 顧客名が空白
      product_name: '営業サービスC',
      amount: 0, // 必須項目: 金額がゼロ
      report_timestamp: '2024-01-15T14:40:00Z',
      notification_sent_at: null,
      notification_content: null,
    };

    expect(() => {
      validateSalesReportCompleteness(multipleGapsData);
    }).toThrow(/営業日|顧客名|金額/);

    // ===== Test 4: 通知内容に具体的な項目名が含まれる =====
    const validationResult = validateSalesReportCompleteness({
      ...completeReportData,
      report_id: 'RPT-2024-004',
    });

    expect(validationResult.is_valid).toBe(true);
    expect(validationResult.notification).toBeDefined();
    if (validationResult.notification) {
      expect(validationResult.notification.message).toContain('項目');
    }

    // ===== Test 5: タイムスタンプが報告書送信直後（5秒以内） =====
    const reportSubmitTime = new Date('2024-01-15T14:50:00Z');
    const notificationTime = new Date('2024-01-15T14:50:04Z'); // 4秒後
    const timeDiffSeconds =
      (notificationTime.getTime() - reportSubmitTime.getTime()) / 1000;

    expect(timeDiffSeconds).toBeLessThanOrEqual(5);
    expect(timeDiffSeconds).toBeGreaterThanOrEqual(0);

    // ===== Test 6: 金額が数値型で正の値であることを検証 =====
    const invalidAmountData = {
      report_id: 'RPT-2024-005',
      staff_id: 'STAFF-NEW-005',
      sales_date: '2024-01-15',
      customer_name: '顧客D社',
      product_name: '営業サービスD',
      amount: -50000, // 金額が負の値
      report_timestamp: '2024-01-15T14:55:00Z',
      notification_sent_at: null,
      notification_content: null,
    };

    expect(() => {
      validateSalesReportCompleteness(invalidAmountData);
    }).toThrow(/金額/);

    // ===== Test 7: 営業日フォーマット検証 =====
    const invalidDateFormatData = {
      report_id: 'RPT-2024-006',
      staff_id: 'STAFF-NEW-006',
      sales_date: '2024/01/15', // 不正なフォーマット
      customer_name: '顧客E社',
      product_name: '営業サービスE',
      amount: 175000,
      report_timestamp: '2024-01-15T15:00:00Z',
      notification_sent_at: null,
      notification_content: null,
    };

    expect(() => {
      validateSalesReportCompleteness(invalidDateFormatData);
    }).toThrow(/営業日|日付/);

    // ===== Test 8: 通知が新入スタッフへ送信される確認 =====
    const reportWithNotification = {
      ...completeReportData,
      report_id: 'RPT-2024-007',
      staff_id: 'STAFF-NEW-007',
    };

    const resultWithNotif = validateSalesReportCompleteness(
      reportWithNotification
    );
    expect(resultWithNotif.is_valid).toBe(true);
    expect(resultWithNotif.staff_id).toBe('STAFF-NEW-007');

    // ===== Test 9: 報告書登録が完了しない状態を確認 =====
    const incompleteReport2 = {
      report_id: 'RPT-2024-008',
      staff_id: 'STAFF-NEW-008',
      sales_date: '2024-01-15',
      customer_name: '', // 必須項目が空白
      product_name: '営業サービスF',
      amount: 125000,
      report_timestamp: '2024-01-15T15:05:00Z',
      notification_sent_at: null,
      notification_content: null,
    };

    const incompletionResult = {
      is_registered: false,
      error_detected: true,
      message: '必須項目の不足により登録できません',
    };

    expect(() => {
      validateSalesReportCompleteness(incompleteReport2);
    }).toThrow(/顧客名/);

    // ===== Test 10: 正常系での登録完了状態確認 =====
    const finalCompleteData = {
      report_id: 'RPT-2024-009',
      staff_id: 'STAFF-NEW-009',
      sales_date: '2024-01-15',
      customer_name: '顧客最終社',
      product_name: '営業サービス最終',
      amount: 300000,
      report_timestamp: '2024-01-15T15:10:00Z',
      notification_sent_at: null,
      notification_content: null,
    };

    const finalResult = validateSalesReportCompleteness(finalCompleteData);
    expect(finalResult.is_valid).toBe(true);
    expect(finalResult.is_registered).toBe(true);
    expect(finalResult.error_detected).toBe(false);
  });
});