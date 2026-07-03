import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  determineRecalculationNeed,
  applyModificationRule,
  recordModificationHistory,
} from '../../src/logic/it-1781935279444-2-1-1';

describe('顧客異議に基づく再計算・修正判定', () => {
  it('SCEN-971: 顧客異議情報から再計算必要性を正しく判定し、修正ルール適用で新請求額を算出', () => {
    // ========== Setup: テストデータ準備 ==========
    const originalInvoiceAmount = 100000;
    const customerObjectionData = {
      objectionContent: 'アポ数の計上漏れが3件ある',
      objectionAmount: 15000,
      objectionReasonCategory: 'DATA_OMISSION',
      invoiceId: 'INV-20240201-001',
      customerId: 'CUST-A001',
      contractId: 'CONTRACT-A001-001',
    };

    const modificationRuleSet = {
      DATA_OMISSION: {
        ruleId: 'RULE-DATA-OMIT-001',
        recalculationRequired: true,
        adjustmentMethod: 'MANUAL_ADD',
        appliedAmount: 15000,
        description: 'データ漏れによる成果数追加加算',
      },
      CALCULATION_ERROR: {
        ruleId: 'RULE-CALC-ERR-001',
        recalculationRequired: true,
        adjustmentMethod: 'RECALCULATE',
        appliedAmount: 0,
        description: '計算ロジックエラー',
      },
      DISCOUNT_DISPUTE: {
        ruleId: 'RULE-DISC-DISP-001',
        recalculationRequired: false,
        adjustmentMethod: 'REFUND_ONLY',
        appliedAmount: customerObjectionData.objectionAmount,
        description: '割引適用に対する異議',
      },
    };

    // ========== Test 1: 再計算必要性の判定 ==========
    const recalculationDecision = determineRecalculationNeed({
      objectionReasonCategory: customerObjectionData.objectionReasonCategory,
      objectionContent: customerObjectionData.objectionContent,
      objectionAmount: customerObjectionData.objectionAmount,
    });

    expect(recalculationDecision.isRecalculationRequired).toBe(true);
    expect(recalculationDecision.appliedRuleId).toBe('RULE-DATA-OMIT-001');
    expect(recalculationDecision.reasonCode).toBe('DATA_OMISSION');

    // ========== Test 2: 修正ルール適用ロジックの実行 ==========
    const applicableRule = modificationRuleSet[customerObjectionData.objectionReasonCategory];
    expect(applicableRule).toBeDefined();
    expect(applicableRule.ruleId).toBe('RULE-DATA-OMIT-001');
    expect(applicableRule.recalculationRequired).toBe(true);

    // ========== Test 3: 新請求額の計算 ==========
    const modificationInput = {
      originalAmount: originalInvoiceAmount,
      objectionAmount: customerObjectionData.objectionAmount,
      adjustmentMethod: applicableRule.adjustmentMethod,
      appliedAmount: applicableRule.appliedAmount,
    };

    const newInvoiceAmount = applyModificationRule(modificationInput);

    // DATA_OMISSION + MANUAL_ADD の場合、元の請求額 + 加算額 = 100000 + 15000 = 115000
    expect(newInvoiceAmount).toBe(115000);

    // ========== Test 4: 修正前後の差分が正確に記録されている ==========
    const difference = newInvoiceAmount - originalInvoiceAmount;
    expect(difference).toBe(15000);

    // ========== Test 5: 修正履歴にルール適用内容が記録される ==========
    const modificationHistoryRecord = {
      invoiceId: customerObjectionData.invoiceId,
      customerId: customerObjectionData.customerId,
      contractId: customerObjectionData.contractId,
      originalAmount: originalInvoiceAmount,
      newAmount: newInvoiceAmount,
      differencAmount: difference,
      appliedRuleId: applicableRule.ruleId,
      adjustmentMethod: applicableRule.adjustmentMethod,
      objectionReasonCategory: customerObjectionData.objectionReasonCategory,
      objectionContent: customerObjectionData.objectionContent,
      modificationTimestamp: '2024-02-15T09:30:00Z',
      modifiedBy: 'OP-001',
    };

    const recordResult = recordModificationHistory(modificationHistoryRecord);

    expect(recordResult.recorded).toBe(true);
    expect(recordResult.historyId).toBeDefined();
    expect(recordResult.originalAmount).toBe(100000);
    expect(recordResult.newAmount).toBe(115000);
    expect(recordResult.appliedRuleId).toBe('RULE-DATA-OMIT-001');
    expect(recordResult.differencAmount).toBe(15000);

    // ========== Test 6: 修正内容の検証 ==========
    const auditTrail = recordResult.auditTrail;
    expect(auditTrail.before.invoiceAmount).toBe(100000);
    expect(auditTrail.after.invoiceAmount).toBe(115000);
    expect(auditTrail.reason).toBe('DATA_OMISSION');
    expect(auditTrail.timestamp).toBe('2024-02-15T09:30:00Z');

    // ========== Test 7: 異議内容に対応した正当な修正が実行されたことの確認 ==========
    expect(newInvoiceAmount).toBeGreaterThan(originalInvoiceAmount);
    expect(difference).toBe(customerObjectionData.objectionAmount);
    expect(applicableRule.adjustmentMethod).toBe('MANUAL_ADD');
  });
});