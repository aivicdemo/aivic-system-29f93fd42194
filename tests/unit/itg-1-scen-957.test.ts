import { describe, test, expect } from '@jest/globals';
import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質検証 - エラー検出と詳細通知', () => {
  // SCEN-957: [error] 営業データ品質検証と請求額確定 - データ品質が基準を満たさない場合、不足データ・誤りの内容を詳細に通知できる
  test('必須項目未入力、形式エラー、値の範囲外のデータ品質基準違反を検出し、詳細なエラー情報を返す', () => {
    const defectiveData = [
      {
        row: 1,
        customerId: 'CUST001',
        serviceId: 'SVC001',
        appointmentCount: 5,
        closureCount: 2,
        customerReaction: 'positive',
        contactDate: '2024-01-15',
      },
      {
        row: 2,
        customerId: '', // 必須項目: 顧客ID未入力
        serviceId: 'SVC002',
        appointmentCount: 3,
        closureCount: 1,
        customerReaction: 'neutral',
        contactDate: '2024-01-16',
      },
      {
        row: 3,
        customerId: 'CUST003',
        serviceId: 'SVC003',
        appointmentCount: -2, // 値の範囲外: 負数
        closureCount: 1,
        customerReaction: 'negative',
        contactDate: '2024-01-17',
      },
      {
        row: 4,
        customerId: 'CUST004',
        serviceId: 'SVC004',
        appointmentCount: 8,
        closureCount: 10, // 値の範囲不正: 成約数 > アポ数
        customerReaction: 'unknown', // 形式エラー: 期待値外の文字列
        contactDate: '2024-13-40', // 形式エラー: 不正な日付形式
      },
      {
        row: 5,
        customerId: 'CUST005',
        serviceId: '', // 必須項目: サービスID未入力
        appointmentCount: 4,
        closureCount: 2,
        customerReaction: 'positive',
        contactDate: '2024-01-19',
      },
    ];

    const validationRules = {
      customerId: {
        type: 'string',
        required: true,
        minLength: 1,
      },
      serviceId: {
        type: 'string',
        required: true,
        minLength: 1,
      },
      appointmentCount: {
        type: 'number',
        required: true,
        minValue: 0,
      },
      closureCount: {
        type: 'number',
        required: true,
        minValue: 0,
      },
      customerReaction: {
        type: 'string',
        required: true,
        allowedValues: ['positive', 'neutral', 'negative'],
      },
      contactDate: {
        type: 'string',
        required: true,
        pattern: /^\d{4}-\d{2}-\d{2}$/,
      },
    };

    const result = validateSalesDataQuality(defectiveData, validationRules);

    expect(result.isValid).toBe(false);
    expect(result.totalErrors).toBe(6);
    expect(result.errorDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          row: 2,
          errorType: '必須項目不足',
          fieldName: 'customerId',
          errorMessage: expect.stringContaining('顧客ID'),
          expectedFormat: '1文字以上の文字列',
          correctionGuide: '顧客IDを入力してください',
        }),
        expect.objectContaining({
          row: 3,
          errorType: '値の範囲外',
          fieldName: 'appointmentCount',
          errorMessage: expect.stringContaining('アポ数'),
          expectedFormat: '0以上の数値',
          correctionGuide: '0以上の値を入力してください',
        }),
        expect.objectContaining({
          row: 4,
          errorType: '値の範囲不正',
          fieldName: 'closureCount',
          errorMessage: expect.stringContaining('成約数がアポ数を超過'),
          expectedFormat: 'アポ数 >= 成約数',
          correctionGuide: '成約数がアポ数以下になるように修正してください',
        }),
        expect.objectContaining({
          row: 4,
          errorType: '形式エラー',
          fieldName: 'customerReaction',
          errorMessage: expect.stringContaining('顧客反応'),
          expectedFormat: 'positive / neutral / negative のいずれか',
          correctionGuide: '許可された値から選択してください',
        }),
        expect.objectContaining({
          row: 4,
          errorType: '形式エラー',
          fieldName: 'contactDate',
          errorMessage: expect.stringContaining('接触日付'),
          expectedFormat: 'YYYY-MM-DD 形式',
          correctionGuide: '正しい日付形式(例: 2024-01-15)で入力してください',
        }),
        expect.objectContaining({
          row: 5,
          errorType: '必須項目不足',
          fieldName: 'serviceId',
          errorMessage: expect.stringContaining('サービスID'),
          expectedFormat: '1文字以上の文字列',
          correctionGuide: 'サービスIDを入力してください',
        }),
      ])
    );
    expect(result.errorSummary).toBe('6件のデータ品質エラーが検出されました');
    expect(result.successCount).toBe(1);
    expect(result.errorRowNumbers).toEqual([2, 3, 4, 4, 4, 5]);
  });
});