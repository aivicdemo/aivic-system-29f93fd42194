import { validateContractChangeCompliance } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-1212
  test('契約変更内容の契約・請求・納期ルール適合判定 - 納期が契約上の最大期限と一致する境界値', () => {
    const contractStartDate = new Date('2024-01-15T00:00:00Z');
    const maxDeadlineDays = 30;
    const contractMaxDeadline = new Date('2024-02-14T00:00:00Z');

    const changeRequest = {
      contractId: 'CNT-001',
      customerId: 'CUST-A',
      serviceId: 'SVC-001',
      contractStartDate: contractStartDate,
      contractMaxDeadlineDays: maxDeadlineDays,
      proposedDeadline: contractMaxDeadline,
      proposedAmount: 100000,
      discountRate: 0,
      changeReasonCode: 'DEADLINE_ADJUSTMENT',
    };

    const result = validateContractChangeCompliance(changeRequest);

    expect(result.isCompliant).toBe(true);
    expect(result.approvalStatus).toBe('APPROVED');
    expect(result.hasViolation).toBe(false);
    expect(result.violationMessages).toEqual([]);
    expect(result.warningMessages).toEqual([]);
    expect(result.deadlineCheckResult).toBe('WITHIN_LIMIT');
    expect(result.contractRuleCheckResult).toBe('COMPLIANT');
    expect(result.invoiceRuleCheckResult).toBe('COMPLIANT');
    expect(result.systemLogWarning).toBe(null);
  });
});