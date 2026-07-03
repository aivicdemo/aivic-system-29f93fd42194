import { validateInvoiceData } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  test('SCEN-1288: 請求データ妥当性自動検証 - 会計システムから受信した請求データが契約内容・過去パターンと照合され妥当性が自動検証される', () => {
    // 入力: 会計システムから受信した請求データ
    const invoiceData = {
      invoiceId: 'INV-2024-001',
      customerId: 'CUST-001',
      invoiceAmount: 150000,
      invoiceDate: '2024-01-15',
      serviceName: 'Premium Service',
    };

    // 契約内容（顧客IDに対応）
    const contractData = {
      customerId: 'CUST-001',
      contractAmount: 200000,
      contractStartDate: '2023-12-01',
      contractEndDate: '2024-12-31',
      billingCycle: 'monthly',
    };

    // 過去12ヶ月の請求履歴
    const invoiceHistory = [
      { date: '2023-02-15', amount: 145000 },
      { date: '2023-03-15', amount: 148000 },
      { date: '2023-04-15', amount: 151000 },
      { date: '2023-05-15', amount: 149000 },
      { date: '2023-06-15', amount: 152000 },
      { date: '2023-07-15', amount: 146000 },
      { date: '2023-08-15', amount: 150000 },
      { date: '2023-09-15', amount: 147000 },
      { date: '2023-10-15', amount: 153000 },
      { date: '2023-11-15', amount: 148000 },
      { date: '2023-12-15', amount: 151000 },
      { date: '2024-01-15', amount: 149000 },
    ];

    // 過去パターン分析
    const invoiceAmounts = invoiceHistory.map((h) => h.amount);
    const averageAmount = invoiceAmounts.reduce((a, b) => a + b, 0) / invoiceAmounts.length;
    const minAmount = Math.min(...invoiceAmounts);
    const maxAmount = Math.max(...invoiceAmounts);
    const variance = maxAmount - minAmount;

    // 期待値の計算
    const expectedAverageAmount = 149083.33; // (145000+148000+151000+149000+152000+146000+150000+147000+153000+148000+151000+149000) / 12
    const expectedMinAmount = 145000;
    const expectedMaxAmount = 153000;
    const expectedVariance = 8000; // 153000 - 145000
    const expectedVarianceThreshold = 10000; // 過去パターンの変動幅 +5%
    const isAmountWithinVariance = invoiceData.invoiceAmount >= minAmount - expectedVarianceThreshold && invoiceData.invoiceAmount <= maxAmount + expectedVarianceThreshold;

    // 妥当性検証の実行
    const validationResult = validateInvoiceData(
      invoiceData,
      contractData,
      invoiceHistory
    );

    // Assertion: 妥当性判定結果の検証
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.status).toBe('approved');

    // Assertion: 請求金額が契約金額の範囲内であることを検証
    expect(validationResult.validations.isAmountWithinContractLimit).toBe(true);
    expect(invoiceData.invoiceAmount).toBeLessThanOrEqual(contractData.contractAmount);

    // Assertion: 請求日が契約期間内であることを検証
    expect(validationResult.validations.isDateWithinContractPeriod).toBe(true);
    expect(invoiceData.invoiceDate).toGreaterThanOrEqual(contractData.contractStartDate);
    expect(invoiceData.invoiceDate).toBeLessThanOrEqual(contractData.contractEndDate);

    // Assertion: 請求周期が過去のパターンと一致していることを検証
    expect(validationResult.validations.isBillingCycleConsistent).toBe(true);

    // Assertion: 過去パターンの統計情報が正確に計算されていることを検証
    expect(validationResult.pastPatternAnalysis.averageAmount).toBeCloseTo(expectedAverageAmount, 0);
    expect(validationResult.pastPatternAnalysis.minAmount).toBe(expectedMinAmount);
    expect(validationResult.pastPatternAnalysis.maxAmount).toBe(expectedMaxAmount);
    expect(validationResult.pastPatternAnalysis.variance).toBe(expectedVariance);

    // Assertion: 現在の請求金額が過去パターンの変動幅内であることを検証
    expect(validationResult.validations.isAmountWithinHistoricalVariance).toBe(isAmountWithinVariance);

    // Assertion: 複数の検証結果を統合した妥当性判定が正確であることを検証
    expect(validationResult.validations.isAmountWithinContractLimit).toBe(true);
    expect(validationResult.validations.isDateWithinContractPeriod).toBe(true);
    expect(validationResult.validations.isBillingCycleConsistent).toBe(true);
    expect(validationResult.validations.isAmountWithinHistoricalVariance).toBe(true);

    // Assertion: 返却データに詳細な検証情報が含まれていることを検証
    expect(validationResult).toHaveProperty('invoiceId', 'INV-2024-001');
    expect(validationResult).toHaveProperty('customerId', 'CUST-001');
    expect(validationResult).toHaveProperty('validations');
    expect(validationResult).toHaveProperty('pastPatternAnalysis');
    expect(validationResult).toHaveProperty('status');
    expect(validationResult).toHaveProperty('isValid');

    // Assertion: 異常が検出されない場合、妥当性が確認されたステータスが付与されることを検証
    expect(validationResult.status).toMatch(/approved|validated/);
  });
});