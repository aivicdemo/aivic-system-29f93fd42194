import { validateInvoiceApproval } from '../../src/logic/it-1-2-1';

describe('請求額検証・承認判定機能', () => {
  test('SCEN-973: 計算結果が手順書の基準を満たさない場合、不承認と判定して理由を返す', () => {
    // 基本情報
    const customer_id = 'CUST-001';
    const service_id = 'SRV-APPT';
    const calculation_amount = 45000; // 基準値 50000 未満
    const standard_amount = 50000;
    const calculation_logic = 'appointmentCount * unitPrice'; // 単価ルール
    const unit_price = 5000;
    const appointment_count = 9; // 9件 * 5000円 = 45000円
    const discount_rate = 0;
    const calculation_result_amount = 45000;
    const approval_threshold_amount = 50000;

    const invoice_data = {
      customer_id,
      service_id,
      calculation_amount,
      calculation_logic,
      unit_price,
      appointment_count,
      discount_rate,
      calculation_result_amount,
      approval_threshold_amount,
    };

    const result = validateInvoiceApproval(invoice_data);

    // 不承認ステータス確認
    expect(result.approval_status).toBe('不承認');

    // 理由メッセージ確認
    expect(result.approval_reason).toContain('計算結果が手順書の基準を満たしていません');

    // エラーコード確認
    expect(result.error_code).toBe('THRESHOLD_NOT_MET');

    // 基準値との比較情報確認
    expect(result.reason_details).toEqual({
      calculated_amount: 45000,
      required_minimum_amount: 50000,
      shortfall_amount: 5000,
      calculation_basis: 'appointmentCount * unitPrice',
      applied_unit_price: 5000,
      transaction_count: 9,
    });

    // 承認コードがnullであることを確認
    expect(result.approval_code).toBeNull();

    // タイムスタンプが ISO 形式であること確認
    expect(result.validated_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
  });
});