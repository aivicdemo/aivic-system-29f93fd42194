import { validateBillingAmountConsistency } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-904: [error] 契約内容と請求額の整合性検証
  test('契約書の請求金額と営業データから生成された請求額が不一致の場合、不一致の詳細情報をエラーレスポンスで返す', () => {
    const contractId = 'CNT-20240115-001';
    const contractAmount = 100000;
    const generatedAmount = 95000;
    const discrepancy = contractAmount - generatedAmount;

    const contractData = {
      contractId: contractId,
      billingAmount: contractAmount,
    };

    const generatedBillingData = {
      contractId: contractId,
      calculatedAmount: generatedAmount,
    };

    const result = validateBillingAmountConsistency(contractData, generatedBillingData);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('BILLING_AMOUNT_MISMATCH');
    expect(result.contractId).toBe(contractId);
    expect(result.contractBillingAmount).toBe(contractAmount);
    expect(result.generatedBillingAmount).toBe(generatedAmount);
    expect(result.discrepancyAmount).toBe(discrepancy);
    expect(result.discrepancyAmount).toBe(5000);
    expect(result.message).toMatch(/不一致/);
  });
});