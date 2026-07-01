import { describe, test, expect } from '@jest/globals';
import { validateInvoiceChecklist } from '../../src/logic/it-1781935279444-2-1-1';

describe('請求書作成チェックリスト検証機能', () => {
  // SCEN-905
  test('チェックリスト項目の1つが検証基準に不合致で、修正指示が生成される', () => {
    // テストデータ: チェックリスト項目に1つの不合致項目を含む請求書データ
    const invoiceData = {
      invoice_id: 'INV-2024-001',
      customer_id: 'CUST-001',
      customer_name: 'テスト顧客',
      invoice_date: '2024-01-15',
      billing_period_start: '2024-01-01',
      billing_period_end: '2024-01-31',
      service_name: '営業支援サービス',
      unit_price: 100000,
      quantity: 1,
      subtotal: 100000,
      tax_rate: 0.1,
      tax_amount: 10000,
      total_amount: 110000,
      payment_terms: '月末払い',
      payment_due_date: '2024-02-28',
      currency: 'JPY',
      invoice_status: 'draft',
      created_by: 'OP-001',
      created_date: '2024-01-10',
      description: '1月度営業成果に対する請求書'
    };

    // チェックリスト項目の期待値（検証基準）
    const checklistCriteria = [
      {
        item_id: 'CL-001',
        item_name: '顧客名',
        is_required: true,
        validation_rule: 'not_empty',
        expected_status: '合致'
      },
      {
        item_id: 'CL-002',
        item_name: '請求日',
        is_required: true,
        validation_rule: 'valid_date_format',
        expected_status: '合致'
      },
      {
        item_id: 'CL-003',
        item_name: '請求金額',
        is_required: true,
        validation_rule: 'amount_positive_and_within_range',
        expected_status: '不合致'
      },
      {
        item_id: 'CL-004',
        item_name: '支払期限',
        is_required: true,
        validation_rule: 'valid_date_after_invoice_date',
        expected_status: '合致'
      }
    ];

    // 不合致項目の詳細: 請求金額が-110000（負数=不合致）
    const invoiceDataWithError = {
      ...invoiceData,
      total_amount: -110000
    };

    // 請求書作成チェックリスト検証機能を実行
    const result = validateInvoiceChecklist(invoiceDataWithError, checklistCriteria);

    // 検証結果の構造確認
    expect(result).toHaveProperty('is_valid');
    expect(result).toHaveProperty('validation_results');
    expect(result).toHaveProperty('correction_instructions');

    // 検証処理が実行され、不合致項目が検出されていることを確認
    expect(result.is_valid).toBe(false);
    expect(result.validation_results).toHaveLength(4);

    // 不合致項目を特定
    const mismatchedItem = result.validation_results.find(
      (item: { item_id: string; status: string }) => item.status === '不合致'
    );
    expect(mismatchedItem).toBeDefined();
    expect(mismatchedItem.item_id).toBe('CL-003');
    expect(mismatchedItem.item_name).toBe('請求金額');

    // 修正指示オブジェクトが生成されていることを検証
    expect(result.correction_instructions).toBeDefined();
    expect(result.correction_instructions.length).toBeGreaterThan(0);

    // 修正指示に不合致項目の詳細情報が含まれていることを確認
    const correctionForAmount = result.correction_instructions.find(
      (instr: { item_id: string }) => instr.item_id === 'CL-003'
    );
    expect(correctionForAmount).toBeDefined();
    expect(correctionForAmount).toHaveProperty('item_name');
    expect(correctionForAmount).toHaveProperty('validation_rule');
    expect(correctionForAmount).toHaveProperty('current_value');
    expect(correctionForAmount).toHaveProperty('expected_criteria');
    expect(correctionForAmount.item_name).toBe('請求金額');
    expect(correctionForAmount.validation_rule).toBe('amount_positive_and_within_range');
    expect(correctionForAmount.current_value).toBe(-110000);

    // 修正指示のステータスが「要修正」または同等の値であることを検証
    expect(correctionForAmount).toHaveProperty('status');
    expect(correctionForAmount.status).toBe('要修正');

    // 修正指示にメッセージが含まれていることを確認
    expect(correctionForAmount).toHaveProperty('message');
    expect(correctionForAmount.message).toMatch(/請求金額|正数|範囲/);

    // その他のチェックリスト項目は検証基準に合致していることを確認
    const passingItems = result.validation_results.filter(
      (item: { status: string }) => item.status === '合致'
    );
    expect(passingItems).toHaveLength(3);

    // 各合致項目を個別に検証
    const passingItemIds = passingItems.map((item: { item_id: string }) => item.item_id);
    expect(passingItemIds).toContain('CL-001');
    expect(passingItemIds).toContain('CL-002');
    expect(passingItemIds).toContain('CL-004');

    // 合致項目に対しては修正指示が生成されていないことを確認
    const passingCorrections = result.correction_instructions.filter(
      (instr: { status: string }) => instr.status === '合致'
    );
    expect(passingCorrections).toHaveLength(0);

    // 修正指示の総数が不合致項目数と一致することを確認
    const mismatchCount = result.validation_results.filter(
      (item: { status: string }) => item.status === '不合致'
    ).length;
    expect(result.correction_instructions).toHaveLength(mismatchCount);

    // エラーログまたは警告ログが適切に記録されていることを検証
    expect(result).toHaveProperty('logs');
    expect(result.logs).toBeDefined();
    expect(result.logs.length).toBeGreaterThan(0);

    // ログにエラー内容が含まれていることを確認
    const errorLogs = result.logs.filter(
      (log: { level: string }) => log.level === 'error' || log.level === 'warning'
    );
    expect(errorLogs.length).toBeGreaterThan(0);

    // エラーログにチェックリスト検証関連のメッセージが含まれていることを確認
    const relevantLogs = errorLogs.filter(
      (log: { message: string }) =>
        log.message.includes('検証') || log.message.includes('不合致') || log.message.includes('修正')
    );
    expect(relevantLogs.length).toBeGreaterThan(0);

    // 修正指示に生成タイムスタンプが含まれていることを確認
    expect(correctionForAmount).toHaveProperty('generated_at');
    expect(typeof correctionForAmount.generated_at).toBe('string');

    // 修正指示にチェックリストID情報が含まれていることを確認
    expect(correctionForAmount).toHaveProperty('invoice_id');
    expect(correctionForAmount.invoice_id).toBe('INV-2024-001');
  });
});