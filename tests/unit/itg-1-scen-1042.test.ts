import { describe, test, expect } from '@jest/globals';
import { classifyCustomerInquiry } from '../../src/logic/it-1-2-1';

describe('顧客質問内容の分類と優先度判定', () => {
  test('SCEN-1042: 請求金額の誤りに関する質問は優先度が高に分類される', () => {
    // Setup: テストデータの準備
    const inquiry_content = '請求金額が正しくないようです。前月と比較して金額が大幅に増加しているのですが、理由を教えてください。';
    const customer_id = 'CUST-001';
    const inquiry_date = new Date('2024-01-15T09:30:00Z');

    // Execute: 顧客質問分類エンジンに入力
    const classification_result = classifyCustomerInquiry({
      content: inquiry_content,
      customer_id: customer_id,
      inquiry_date: inquiry_date
    });

    // Verify: 分類結果を確認
    expect(classification_result.category).toBe('請求金額の誤り');
    expect(classification_result.priority).toBe('高');
    expect(classification_result.priority_score).toBe(95);

    // Verify: その他の属性を確認
    expect(classification_result.customer_id).toBe('CUST-001');
    expect(classification_result.requires_investigation).toBe(true);
    expect(classification_result.estimated_resolution_time_hours).toBe(4);
  });
});