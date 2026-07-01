import { validatePaymentProcessing } from '../../src/logic/it-1781935279444-2-2-1';

describe('支払い処理自動判定 - 支払い承認基準不満足時の保留と異常通知', () => {
  test('SCEN-1318: 支払い承認基準のいずれかを満たさない場合、支払い処理が保留され異常通知が発行される', () => {
    // 支払い承認基準を満たさない請求データを準備
    const invoiceData = {
      invoice_id: 'INV-2024-001',
      customer_id: 'CUST-2024-001',
      invoice_amount: -5000, // 基準①: 請求額が負数（基準不満足）
      invoice_date: '2024-01-15',
      contract_valid: true, // 基準②: 契約有効フラグ=true（基準満足）
      data_quality_status: 'approved', // 基準③: データ品質ステータス=approved（基準満足）
      payment_due_date: '2024-02-14',
      customer_email: 'customer@example.com',
    };

    // 支払い処理自動判定機能を実行
    const result = validatePaymentProcessing(invoiceData);

    // 支払い処理のステータスを確認: 『保留』であることを検証
    expect(result.payment_status).toBe('保留');

    // 異常通知の発行状況を確認: 通知が生成されていることを検証
    expect(result.abnormality_notification).toBeDefined();
    expect(result.abnormality_notification.is_issued).toBe(true);

    // 通知内容に不承認理由が含まれていることを確認
    expect(result.abnormality_notification.rejection_reason).toContain('請求額');
    expect(result.abnormality_notification.failed_criteria).toEqual(['invoice_amount']);
    expect(result.abnormality_notification.failed_criteria_count).toBe(1);

    // 通知に説明メッセージが含まれていることを確認
    expect(result.abnormality_notification.message).toMatch(/請求額が負数/);

    // 通知のタイムスタンプが記録されていることを確認
    expect(result.abnormality_notification.issued_at).toBeDefined();
    expect(typeof result.abnormality_notification.issued_at).toBe('string');
  });

  test('SCEN-1318-複数基準不満足: 複数の支払い承認基準が満たされない場合、すべての不承認理由が通知に含まれる', () => {
    // 複数の支払い承認基準を満たさない請求データ
    const invoiceData = {
      invoice_id: 'INV-2024-002',
      customer_id: 'CUST-2024-002',
      invoice_amount: 0, // 基準①: 請求額がゼロ（基準不満足）
      invoice_date: '2024-01-15',
      contract_valid: false, // 基準②: 契約有効フラグ=false（基準不満足）
      data_quality_status: 'rejected', // 基準③: データ品質ステータス=rejected（基準不満足）
      payment_due_date: '2024-02-14',
      customer_email: 'customer@example.com',
    };

    const result = validatePaymentProcessing(invoiceData);

    // ステータスが『保留』であることを確認
    expect(result.payment_status).toBe('保留');

    // 異常通知が発行されていることを確認
    expect(result.abnormality_notification.is_issued).toBe(true);

    // 複数の不承認基準が記録されていることを確認
    expect(result.abnormality_notification.failed_criteria_count).toBe(3);
    expect(result.abnormality_notification.failed_criteria).toContain('invoice_amount');
    expect(result.abnormality_notification.failed_criteria).toContain('contract_valid');
    expect(result.abnormality_notification.failed_criteria).toContain('data_quality_status');

    // すべての不承認理由が通知に含まれていることを確認
    expect(result.abnormality_notification.message).toMatch(/請求額/);
    expect(result.abnormality_notification.message).toMatch(/契約/);
    expect(result.abnormality_notification.message).toMatch(/データ品質/);
  });

  test('SCEN-1318-すべての基準満足: すべての支払い承認基準を満たす場合、支払い処理が承認される', () => {
    // すべての支払い承認基準を満たす請求データ
    const invoiceData = {
      invoice_id: 'INV-2024-003',
      customer_id: 'CUST-2024-003',
      invoice_amount: 50000, // 基準①: 請求額が正数（基準満足）
      invoice_date: '2024-01-15',
      contract_valid: true, // 基準②: 契約有効フラグ=true（基準満足）
      data_quality_status: 'approved', // 基準③: データ品質ステータス=approved（基準満足）
      payment_due_date: '2024-02-14',
      customer_email: 'customer@example.com',
    };

    const result = validatePaymentProcessing(invoiceData);

    // 支払い処理のステータスが『承認』であることを確認
    expect(result.payment_status).toBe('承認');

    // 異常通知が発行されないことを確認
    expect(result.abnormality_notification.is_issued).toBe(false);
    expect(result.abnormality_notification.failed_criteria_count).toBe(0);
    expect(result.abnormality_notification.failed_criteria).toEqual([]);
  });

  test('SCEN-1318-境界値: 請求額が最小承認額（1円）の場合、支払い処理が承認される', () => {
    const invoiceData = {
      invoice_id: 'INV-2024-004',
      customer_id: 'CUST-2024-004',
      invoice_amount: 1, // 基準①: 最小承認額（基準満足）
      invoice_date: '2024-01-15',
      contract_valid: true,
      data_quality_status: 'approved',
      payment_due_date: '2024-02-14',
      customer_email: 'customer@example.com',
    };

    const result = validatePaymentProcessing(invoiceData);

    expect(result.payment_status).toBe('承認');
    expect(result.abnormality_notification.is_issued).toBe(false);
  });

  test('SCEN-1318-エラーハンドリング: 必須フィールドが欠落している場合、適切なエラーが発生する', () => {
    // 必須フィールド（invoice_id）が欠落
    const invalidInvoiceData = {
      customer_id: 'CUST-2024-005',
      invoice_amount: 50000,
      invoice_date: '2024-01-15',
      contract_valid: true,
      data_quality_status: 'approved',
      payment_due_date: '2024-02-14',
      customer_email: 'customer@example.com',
    } as any;

    expect(() => validatePaymentProcessing(invalidInvoiceData)).toThrow(/請求ID/);
  });

  test('SCEN-1318-通知内容の検証: 不承認通知に顧客メールアドレスが含まれていることを確認', () => {
    const invoiceData = {
      invoice_id: 'INV-2024-006',
      customer_id: 'CUST-2024-006',
      invoice_amount: -1000,
      invoice_date: '2024-01-15',
      contract_valid: true,
      data_quality_status: 'approved',
      payment_due_date: '2024-02-14',
      customer_email: 'billing@customer.example.com',
    };

    const result = validatePaymentProcessing(invoiceData);

    // 不承認通知が発行されていることを確認
    expect(result.abnormality_notification.is_issued).toBe(true);

    // 通知にメールアドレスが含まれていることを確認
    expect(result.abnormality_notification.recipient_email).toBe('billing@customer.example.com');

    // 通知タイプが『支払い保留』であることを確認
    expect(result.abnormality_notification.notification_type).toBe('支払い保留');
  });
});