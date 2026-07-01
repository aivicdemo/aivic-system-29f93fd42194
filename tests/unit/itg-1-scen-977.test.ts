import { calculateAndValidateInvoiceAmount } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-977: [edge] 請求額計算結果の手順書検証 - 請求額がゼロ円の境界値で手順書ルールとの合致判定が正確に実行される
  test('請求額がゼロ円の場合、手順書ルールが正確に適用され、合致判定が成功し、ルール適用の追跡可能性が確保される', () => {
    // テストデータ: 割引額が売上額と同額の場合（結果: 請求額 = 0円）
    const invoiceInput = {
      customerId: 'CUST-001',
      serviceId: 'SVC-BASIC',
      salesAmount: 100000,
      discountAmount: 100000,
      taxRate: 0.1,
      procedureRuleId: 'PROC-ZERO-HANDLING',
    };

    // 請求額計算ロジック実行
    const result = calculateAndValidateInvoiceAmount(invoiceInput);

    // 計算結果がゼロ円であることを確認
    expect(result.invoiceAmount).toBe(0);

    // 請求額がゼロ円の場合の手順書ルール適用を検証
    expect(result.isInvoicingRequired).toBe(false);
    expect(result.invoicingSkipReason).toBe('ZERO_AMOUNT');
    expect(result.procedureRuleApplied).toBe(true);
    expect(result.procedureRuleMatched).toBe('PROC-ZERO-HANDLING');

    // ゼロ円のエッジケース検証: 負の値がないか確認
    expect(result.invoiceAmount).toBeGreaterThanOrEqual(0);

    // 丸め処理が正確か確認
    expect(result.invoiceAmount).toBe(0);

    // ルール適用の追跡可能性確認
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.length).toBeGreaterThan(0);
    expect(result.auditLog).toContainEqual(
      expect.objectContaining({
        timestamp: expect.any(String),
        eventType: 'PROCEDURE_RULE_APPLIED',
        ruleId: 'PROC-ZERO-HANDLING',
        description: expect.stringContaining('ゼロ円'),
      })
    );

    // 監査対応可能な状態確認
    expect(result.traceId).toBeDefined();
    expect(result.traceId).toMatch(/^TRACE-/);
    expect(result.procedureValidationStatus).toBe('SUCCESS');
  });

  // 追加エッジケース: 返品により売上がゼロになる場合
  test('返品により売上がゼロになった場合、請求額がゼロ円で手順書ルール適用が正確に実行される', () => {
    const invoiceInput = {
      customerId: 'CUST-002',
      serviceId: 'SVC-PREMIUM',
      salesAmount: 0,
      discountAmount: 0,
      returnAmount: 50000,
      taxRate: 0.1,
      procedureRuleId: 'PROC-ZERO-HANDLING',
    };

    const result = calculateAndValidateInvoiceAmount(invoiceInput);

    expect(result.invoiceAmount).toBe(0);
    expect(result.isInvoicingRequired).toBe(false);
    expect(result.procedureRuleApplied).toBe(true);
    expect(result.procedureValidationStatus).toBe('SUCCESS');
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog).toContainEqual(
      expect.objectContaining({
        eventType: 'PROCEDURE_RULE_APPLIED',
      })
    );
  });
});