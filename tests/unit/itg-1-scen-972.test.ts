import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateAndApproveInvoiceAmount } from '../../src/logic/it-1-2-1';

describe('請求額検証・承認判定機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-972
  test('計算結果が手順書の基準を満たす場合、承認可能と判定できる', () => {
    // テストデータ: 手順書基準を満たす請求データ
    const invoice_data = {
      customer_id: 'CUST-001',
      service_id: 'SVC-A',
      base_amount: 100000,
      discount_rate: 0.1,
      calculated_amount: 90000,
      previous_month_amount: 89500,
      tolerance_percent: 2.0,
      required_fields: {
        customer_name: '顧客企業A',
        service_name: 'サービスA',
        billing_period: '2024-01-01',
        total_amount: 90000,
      },
    };

    // 承認判定ロジック実行
    const result = validateAndApproveInvoiceAmount(invoice_data);

    // 期待値検証
    // 1. 承認ステータスが『承認可能』であること
    expect(result.approval_status).toBe('承認可能');

    // 2. 計算結果が手順書基準を満たしていることを確認
    // - 金額計算誤差: (90000 - 89500) / 89500 * 100 = 0.559% （許容範囲2%以内）
    expect(result.is_within_tolerance).toBe(true);

    // 3. 必須項目が全て入力されていることを確認
    expect(result.required_fields_complete).toBe(true);

    // 4. 割引ルールが正確に適用されていることを確認
    // - 割引前金額: 100000、割引率: 10% → 割引額: 10000、請求額: 90000
    expect(result.discount_amount).toBe(10000);
    expect(result.final_amount).toBe(90000);

    // 5. 承認可能フラグが true であること
    expect(result.can_approve).toBe(true);

    // 6. 計算結果と手順書基準の照合結果を確認
    expect(result.validation_summary).toEqual({
      calculation_accuracy: true,
      required_fields_present: true,
      amount_within_tolerance: true,
      discount_correctly_applied: true,
    });

    // 7. 承認判定結果が『承認済み』の関連ステータスに準備されていること
    expect(result.next_step).toBe('請求書確定へ進行');
  });
});