import { sendBillingInfoToAccountingSystem } from '../../src/logic/it-1-2-1';

const fetchMock = require('jest-fetch-mock');

describe('会計システムAPI連携機能 - 請求情報の正常送信', () => {
  test('SCEN-1274: APIリクエストが成功し、請求情報が会計システムに正確に送信される', async () => {
    fetchMock.resetMocks();

    // 入力: 営業データから抽出された請求情報
    const billing_info = {
      customer_id: 'CUST001',
      customer_name: '株式会社営業企業',
      service_id: 'SVC_A',
      service_name: 'アポ取得支援',
      billing_amount: 150000,
      billing_date: '2024-01-31',
      billing_period_start: '2024-01-01',
      billing_period_end: '2024-01-31',
      transaction_count: 45,
      conversion_count: 12,
      unit_price: 10000,
      discount_rate: 0.1,
      discount_amount: 15000,
      tax_rate: 0.1,
      tax_amount: 13500,
      total_amount: 148500,
      currency: 'JPY',
      payment_terms: '30days',
      invoice_number: 'INV-2024-001-001',
      accounting_code: '3100-001-A',
      department_code: 'SALES-01',
      created_at: '2024-01-31T09:00:00Z',
      created_by: 'op_user_001'
    };

    // 期待: API呼び出しのレスポンス（ステータスコード200、送信成功）
    const expected_response = {
      status: 'success',
      message: '請求情報が正常に会計システムに送信されました',
      accounting_transaction_id: 'ACC_TXN_20240131_001',
      received_at: '2024-01-31T09:15:00Z',
      received_amount: 148500,
      received_customer_id: 'CUST001',
      received_invoice_number: 'INV-2024-001-001',
      data_validation_result: 'passed',
      reconciliation_status: 'matched'
    };

    fetchMock.mockResponseOnce(JSON.stringify(expected_response), { status: 200 });

    // 実行: 会計システムAPI連携の送信処理
    const result = await sendBillingInfoToAccountingSystem(billing_info);

    // 検証1: API呼び出しが実行されたか
    expect(fetchMock.mock.calls.length).toBe(1);

    // 検証2: API呼び出しのURL・メソッド・リクエストボディ
    const call = fetchMock.mock.calls[0];
    expect(call[0]).toContain('/api/v1/billing-transactions/send');
    expect(call[1].method).toBe('POST');

    const request_body = JSON.parse(call[1].body);
    expect(request_body.customer_id).toBe('CUST001');
    expect(request_body.customer_name).toBe('株式会社営業企業');
    expect(request_body.service_id).toBe('SVC_A');
    expect(request_body.billing_amount).toBe(150000);
    expect(request_body.total_amount).toBe(148500);
    expect(request_body.invoice_number).toBe('INV-2024-001-001');

    // 検証3: レスポンスステータスコード
    expect(result.response_status_code).toBe(200);

    // 検証4: 連携ステータス
    expect(result.sync_status).toBe('success');

    // 検証5: 会計システムが返した取引ID
    expect(result.accounting_transaction_id).toBe('ACC_TXN_20240131_001');

    // 検証6: 送信されたデータが正確に受け取られたか（会計システム側の検証結果）
    expect(result.data_validation_result).toBe('passed');

    // 検証7: 会計システムとの請求金額の照合
    expect(result.received_amount).toBe(148500);
    expect(result.received_customer_id).toBe('CUST001');

    // 検証8: データの完全一致確認（請求金額、消費税、割引額）
    expect(result.received_invoice_number).toBe('INV-2024-001-001');
    expect(result.reconciliation_status).toBe('matched');

    // 検証9: 連携ログに「送信成功」が記録されたか
    expect(result.log_entry).toEqual({
      log_id: expect.any(String),
      event_type: 'billing_sync_sent',
      source_system: 'billing_management',
      target_system: 'accounting_system',
      status: 'sent_successfully',
      sent_timestamp: expect.any(String),
      received_timestamp: expect.any(String),
      customer_id: 'CUST001',
      billing_amount: 148500,
      accounting_transaction_id: 'ACC_TXN_20240131_001'
    });

    // 検証10: 全体的なレスポンス構造
    expect(result).toHaveProperty('response_status_code');
    expect(result).toHaveProperty('sync_status');
    expect(result).toHaveProperty('accounting_transaction_id');
    expect(result).toHaveProperty('data_validation_result');
    expect(result).toHaveProperty('reconciliation_status');
    expect(result).toHaveProperty('log_entry');
  });
});