import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateDiscountedInvoiceAmount } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 割引率0%の処理', () => {
  let logMessages: string[] = [];

  beforeEach(() => {
    logMessages = [];
    jest.spyOn(console, 'log').mockImplementation((msg: string) => {
      logMessages.push(msg);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // SCEN-957: [edge] 契約別割引基準確認・統一機能 - 割引率が0%の場合、割引が適用されない契約として正しく判定される
  test('割引率0%の契約で割引が適用されず、請求額が元金額のまま計算される', () => {
    const contractDiscountConfig = {
      contractId: 'CNT-2024-001',
      customerId: 'CUST-12345',
      baseAmount: 100000,
      discountRate: 0,
      discountAppliedFlag: false,
      effectiveDate: '2024-01-01',
      expiryDate: '2024-12-31'
    };

    const invoiceData = {
      invoiceId: 'INV-2024-0001',
      contractId: contractDiscountConfig.contractId,
      customerId: contractDiscountConfig.customerId,
      originalAmount: contractDiscountConfig.baseAmount,
      discountRate: contractDiscountConfig.discountRate,
      discountAppliedFlag: contractDiscountConfig.discountAppliedFlag
    };

    const result = calculateDiscountedInvoiceAmount(invoiceData, contractDiscountConfig);

    expect(result.discountAppliedFlag).toBe(false);
    expect(result.discountAmount).toBe(0);
    expect(result.finalInvoiceAmount).toBe(100000);
    expect(logMessages.some(msg => msg.includes('割引率0%') || msg.includes('割引なし'))).toBe(true);
  });
});