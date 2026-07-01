import { describe, test, expect } from '@jest/globals';
import { determinePaymentProcessing } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  test('SCEN-1319: [edge] 支払い処理自動判定 - 請求額がゼロの場合、支払い対象外として処理されスキップ記録が作成される', () => {
    // Arrange: 請求額がゼロの請求データを準備
    const billId = 'BILL-000123';
    const billingAmount = 0;
    const processingDate = new Date('2024-01-15T09:00:00Z');
    const invoiceData = {
      bill_id: billId,
      customer_id: 'CUST-001',
      service_id: 'SVC-BASIC',
      billing_amount: billingAmount,
      contract_start_date: '2024-01-01',
      contract_end_date: '2024-01-31',
      created_at: processingDate.toISOString(),
    };

    // Act: 支払い処理自動判定を実行
    const result = determinePaymentProcessing({
      invoice_data: invoiceData,
      execution_timestamp: processingDate.toISOString(),
    });

    // Assert: 支払い対象外として処理されたことを確認
    expect(result.is_payment_required).toBe(false);
    expect(result.skip_reason).toBe('請求額ゼロ');

    // スキップ記録が作成されていることを確認
    expect(result.skip_record).toBeDefined();
    expect(result.skip_record.bill_id).toBe(billId);
    expect(result.skip_record.skip_reason).toBe('請求額ゼロ');
    expect(result.skip_record.processing_timestamp).toBe(processingDate.toISOString());

    // スキップ記録の構造を検証
    expect(result.skip_record.created_at).toBe(processingDate.toISOString());
  });
});