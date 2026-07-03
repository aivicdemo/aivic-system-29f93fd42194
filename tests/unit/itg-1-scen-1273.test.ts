import { approveInvoiceInfo } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1273: [edge] 請求情報最終承認機能 - 承認基準値の境界値（金額上限値など）に達した請求情報が正確に判定される
  test('should approve invoice info at exact limit, reject above limit, and approve below limit', () => {
    const APPROVAL_LIMIT = 1000000;

    // テスト1: 金額上限値と同じ金額（1,000,000円）の請求情報
    const invoiceAtLimit = {
      invoiceId: 'INV-001',
      customerId: 'CUST-001',
      amount: 1000000,
      serviceType: 'service-A',
      invoiceDate: new Date('2024-01-15T09:00:00Z'),
      items: [
        { itemId: 'item-001', quantity: 100, unitPrice: 10000 }
      ]
    };

    const resultAtLimit = approveInvoiceInfo(invoiceAtLimit, APPROVAL_LIMIT);
    expect(resultAtLimit).toEqual({
      invoiceId: 'INV-001',
      isApproved: true,
      reason: '金額上限値以下のため承認可能',
      amount: 1000000,
      limitAmount: 1000000,
      status: 'approved'
    });

    // テスト2: 金額上限値より1円少ない金額（999,999円）の請求情報
    const invoiceBelowLimit = {
      invoiceId: 'INV-002',
      customerId: 'CUST-001',
      amount: 999999,
      serviceType: 'service-A',
      invoiceDate: new Date('2024-01-15T09:00:00Z'),
      items: [
        { itemId: 'item-002', quantity: 99, unitPrice: 10101 }
      ]
    };

    const resultBelowLimit = approveInvoiceInfo(invoiceBelowLimit, APPROVAL_LIMIT);
    expect(resultBelowLimit).toEqual({
      invoiceId: 'INV-002',
      isApproved: true,
      reason: '金額上限値以下のため承認可能',
      amount: 999999,
      limitAmount: 1000000,
      status: 'approved'
    });

    // テスト3: 金額上限値より1円多い金額（1,000,001円）の請求情報
    const invoiceAboveLimit = {
      invoiceId: 'INV-003',
      customerId: 'CUST-001',
      amount: 1000001,
      serviceType: 'service-A',
      invoiceDate: new Date('2024-01-15T09:00:00Z'),
      items: [
        { itemId: 'item-003', quantity: 101, unitPrice: 9901 }
      ]
    };

    const resultAboveLimit = approveInvoiceInfo(invoiceAboveLimit, APPROVAL_LIMIT);
    expect(resultAboveLimit).toEqual({
      invoiceId: 'INV-003',
      isApproved: false,
      reason: '金額上限値を超過するため承認不可',
      amount: 1000001,
      limitAmount: 1000000,
      status: 'rejected'
    });

    // システムログの判定理由が正確に記録されることを検証
    expect(resultAtLimit.reason).toMatch(/承認/);
    expect(resultBelowLimit.reason).toMatch(/承認/);
    expect(resultAboveLimit.reason).toMatch(/超過/);
  });
});