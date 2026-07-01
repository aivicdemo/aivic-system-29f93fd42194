import { approveBillingAmount } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-623: [error] 請求額確定フロー - 既に確定済みの請求額に対する再度の承認操作が適切に拒否される
  test('既に確定済みの請求額に対する再度の承認操作は拒否される', () => {
    const billingData = {
      billingId: 'BILL-001',
      customerId: 'CUST-123',
      serviceId: 'SVC-456',
      amount: 50000,
      status: 'confirmed',
      approvedAt: '2024-01-15T09:30:00Z',
      approvedBy: 'USER-admin-001'
    };

    expect(() => approveBillingAmount(billingData)).toThrow(/既に確定済み/);
  });
});