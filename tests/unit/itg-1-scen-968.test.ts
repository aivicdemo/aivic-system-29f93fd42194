import { classifyCustomerInquiry } from '../../src/logic/it-1781935279444-2-1-1';

describe('顧客質問・異議の分類・対応ルート判定', () => {
  test('SCEN-968: 請求質問が即座回答カテゴリに分類され、対応ルートが自動回答に振り分けられる', () => {
    // テストデータ: 一般的な請求質問（請求日確認）
    const customerInquiry = {
      inquiry_id: 'INQ-2024-001',
      customer_id: 'CUST-001',
      inquiry_type: '請求',
      inquiry_content: '請求書が届きましたが、請求日はいつになりますか？',
      received_at: new Date('2024-01-15T10:30:00Z'),
      inquiry_category: null,
      response_route: null,
      template_id: null,
      processing_time_ms: 0,
    };

    // 質問分類モジュール実行
    const start_time = Date.now();
    const classification_result = classifyCustomerInquiry(customerInquiry);
    const processing_time_ms = Date.now() - start_time;

    // 期待結果1: 質問が『即座回答カテゴリ』に正しく分類されること
    expect(classification_result.inquiry_category).toBe('即座回答可能');

    // 期待結果2: 対応ルート判定結果が『自動回答ルート』に振り分けられること
    expect(classification_result.response_route).toBe('自動回答ルート');

    // 期待結果3: 標準回答テンプレートが適切に選択されていること
    expect(classification_result.template_id).toBe('TEMPLATE-BILLING-DATE-001');

    // 期待結果4: ルート判定の実行時間がSLA基準以内（500ms以内）であること
    expect(processing_time_ms).toBeLessThanOrEqual(500);

    // 期待結果5: 分類結果が完全に返却されること
    expect(classification_result).toEqual({
      inquiry_id: 'INQ-2024-001',
      customer_id: 'CUST-001',
      inquiry_type: '請求',
      inquiry_content: '請求書が届きましたが、請求日はいつになりますか？',
      received_at: new Date('2024-01-15T10:30:00Z'),
      inquiry_category: '即座回答可能',
      response_route: '自動回答ルート',
      template_id: 'TEMPLATE-BILLING-DATE-001',
      processing_time_ms: expect.any(Number),
    });

    // 追加検証: 金額確認質問も即座回答カテゴリに分類されることを確認
    const inquiry_amount = {
      inquiry_id: 'INQ-2024-002',
      customer_id: 'CUST-002',
      inquiry_type: '請求',
      inquiry_content: '請求額が前月と比べて大きく異なるのですが、金額の内訳を確認したいです。',
      received_at: new Date('2024-01-15T11:00:00Z'),
      inquiry_category: null,
      response_route: null,
      template_id: null,
      processing_time_ms: 0,
    };

    const amount_classification = classifyCustomerInquiry(inquiry_amount);
    expect(amount_classification.inquiry_category).toBe('即座回答可能');
    expect(amount_classification.response_route).toBe('自動回答ルート');
    expect(amount_classification.template_id).toBe('TEMPLATE-BILLING-AMOUNT-001');

    // 追加検証: 支払期限確認質問も即座回答カテゴリに分類されることを確認
    const inquiry_due_date = {
      inquiry_id: 'INQ-2024-003',
      customer_id: 'CUST-003',
      inquiry_type: '請求',
      inquiry_content: '請求書の支払期限はいつまでですか？',
      received_at: new Date('2024-01-15T12:00:00Z'),
      inquiry_category: null,
      response_route: null,
      template_id: null,
      processing_time_ms: 0,
    };

    const due_date_classification = classifyCustomerInquiry(inquiry_due_date);
    expect(due_date_classification.inquiry_category).toBe('即座回答可能');
    expect(due_date_classification.response_route).toBe('自動回答ルート');
    expect(due_date_classification.template_id).toBe('TEMPLATE-BILLING-DUEDATE-001');

    // 追加検証: 処理時間が一貫してSLA基準内であることを確認
    expect(amount_classification.processing_time_ms).toBeLessThanOrEqual(500);
    expect(due_date_classification.processing_time_ms).toBeLessThanOrEqual(500);
  });
});