import { extractAndAggregateInvoiceItems } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-746: [normal] 請求対象項目の自動抽出・集計 - 複数の請求ルールが適用される場合、全ルールが正確に組み合わされて請求額が計算される
  test('複数の請求ルールが正確に組み合わされて最終請求額が計算される', () => {
    // テストデータ: 営業データ
    const salesData = {
      customerId: 'CUST-001',
      customerName: '顧客A',
      serviceId: 'SVC-001',
      serviceName: 'サービスプラン',
      salesAmount: 100000, // 売上金額
      transactionCount: 50, // 取引件数
      contractPeriod: 12, // 契約期間（月）
      customerClass: 'enterprise', // 顧客区分
    };

    // テストデータ: 複数の請求ルール定義
    const billingRules = [
      {
        ruleId: 'RULE-001',
        ruleName: '基本料金',
        type: 'base',
        amount: 50000,
        sequence: 1,
      },
      {
        ruleId: 'RULE-002',
        ruleName: '従量料金',
        type: 'metered',
        unitPrice: 1000, // 1取引あたり
        quantity: 50, // 取引件数
        sequence: 2,
      },
      {
        ruleId: 'RULE-003',
        ruleName: '割引',
        type: 'discount',
        discountRate: 0.1, // 10% 割引
        applyTarget: 'subtotal', // 小計に対して適用
        sequence: 3,
      },
      {
        ruleId: 'RULE-004',
        ruleName: '消費税',
        type: 'tax',
        taxRate: 0.1, // 10% 税金
        sequence: 4,
      },
    ];

    // 期待値の手動計算
    // Step 1: 基本料金 = 50,000
    const baseAmount = 50000;

    // Step 2: 従量料金 = 1,000 × 50 = 50,000
    const meteredAmount = 1000 * 50;

    // Step 3: 小計 = 50,000 + 50,000 = 100,000
    const subtotal = baseAmount + meteredAmount;

    // Step 4: 割引 = 100,000 × 10% = 10,000
    const discountAmount = subtotal * 0.1;

    // Step 5: 割引後 = 100,000 - 10,000 = 90,000
    const afterDiscount = subtotal - discountAmount;

    // Step 6: 税金 = 90,000 × 10% = 9,000
    const taxAmount = afterDiscount * 0.1;

    // Step 7: 最終請求額 = 90,000 + 9,000 = 99,000
    const expectedFinalAmount = afterDiscount + taxAmount;

    // 関数を実行
    const result = extractAndAggregateInvoiceItems({
      salesData,
      billingRules,
    });

    // アサーション: 各ステップの計算結果を検証
    expect(result.baseAmount).toBe(50000);
    expect(result.meteredAmount).toBe(50000);
    expect(result.subtotal).toBe(100000);
    expect(result.discountAmount).toBe(10000);
    expect(result.afterDiscount).toBe(90000);
    expect(result.taxAmount).toBe(9000);
    expect(result.finalInvoiceAmount).toBe(99000);

    // アサーション: 最終請求額が期待値と完全に一致
    expect(result.finalInvoiceAmount).toBe(expectedFinalAmount);

    // アサーション: 請求ルールの適用順序が正しく記録されている
    expect(result.appliedRules).toHaveLength(4);
    expect(result.appliedRules[0].ruleId).toBe('RULE-001');
    expect(result.appliedRules[1].ruleId).toBe('RULE-002');
    expect(result.appliedRules[2].ruleId).toBe('RULE-003');
    expect(result.appliedRules[3].ruleId).toBe('RULE-004');

    // アサーション: 顧客情報とサービス情報が正しく含まれている
    expect(result.customerId).toBe('CUST-001');
    expect(result.serviceId).toBe('SVC-001');

    // アサーション: 請求対象項目が正確に抽出されている
    expect(result.invoiceItems).toBeDefined();
    expect(result.invoiceItems).toHaveLength(4);
    expect(result.invoiceItems[0]).toEqual({
      itemName: '基本料金',
      amount: 50000,
      ruleId: 'RULE-001',
    });
    expect(result.invoiceItems[1]).toEqual({
      itemName: '従量料金',
      amount: 50000,
      ruleId: 'RULE-002',
    });
    expect(result.invoiceItems[2]).toEqual({
      itemName: '割引',
      amount: -10000,
      ruleId: 'RULE-003',
    });
    expect(result.invoiceItems[3]).toEqual({
      itemName: '消費税',
      amount: 9000,
      ruleId: 'RULE-004',
    });
  });
});