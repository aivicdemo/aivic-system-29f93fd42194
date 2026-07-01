import { describe, test, expect } from '@jest/globals';
import { validateSalesDataFormat } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-890: [error] 営業データ異常値の自動検出 - 営業データの形式が契約書で定義された形式と不一致の場合、チェック結果『エラー』が返される
  test('should return error when sales data format does not match contract definition', () => {
    // テストデータ: 契約書で定義された形式
    const contractDefinition = {
      customerId: { pattern: /^CUST-\d{5}$/, description: 'CUST-XXXXX' },
      amount: { pattern: /^\d+(\.\d{1,2})?$/, description: 'numeric only' },
      appointmentCount: { pattern: /^\d+$/, description: 'integer only' },
      dealStatus: { pattern: /^(pending|confirmed|closed)$/, description: 'enum value' },
    };

    // テストデータ: 形式が不一致なデータ
    const invalidSalesData = {
      customerId: 'CUST123', // 期待形式: CUST-XXXXX
      amount: '¥100,000', // 期待形式: 数値のみ
      appointmentCount: '5', // 正しい形式
      dealStatus: 'confirmed', // 正しい形式
    };

    // 実行
    const result = validateSalesDataFormat(invalidSalesData, contractDefinition);

    // 検証: チェック結果がエラーであることを確認
    expect(result.status).toBe('error');
    expect(result.errors).toHaveLength(2);

    // 検証: エラーメッセージに不一致の項目名と期待される形式が明記されていることを確認
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        fieldName: 'customerId',
        actualValue: 'CUST123',
        expectedFormat: 'CUST-XXXXX',
      })
    );
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        fieldName: 'amount',
        actualValue: '¥100,000',
        expectedFormat: 'numeric only',
      })
    );

    // 検証: 正しい形式のフィールドはエラーに含まれないことを確認
    const errorFields = result.errors.map((err) => err.fieldName);
    expect(errorFields).not.toContain('appointmentCount');
    expect(errorFields).not.toContain('dealStatus');
  });
});