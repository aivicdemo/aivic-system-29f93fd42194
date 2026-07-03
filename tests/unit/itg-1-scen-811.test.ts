import { decidePolicyAndUpdateStatus } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-811
  test('対応方針の決定・記録機能 - 営業責任者が契約・納期・請求確認後に対応方針を決定し、ステータスが正常に更新される', () => {
    const input = {
      caseId: 'CASE-20240115-001',
      customerId: 'CUST-A001',
      serviceId: 'SRV-001',
      contractAmount: 500000,
      deliveryDate: '2024-02-15',
      billingAmount: 500000,
      policyType: 'CONTINUE',
      policyDetails: '契約条件を確認、継続的支援を実施',
      decidedBy: 'USER-SALES-001',
      decidedAt: '2024-01-15T14:30:00Z'
    };

    const result = decidePolicyAndUpdateStatus(input);

    expect(result.caseId).toBe('CASE-20240115-001');
    expect(result.status).toBe('POLICY_DECIDED');
    expect(result.policyType).toBe('CONTINUE');
    expect(result.policyDetails).toBe('契約条件を確認、継続的支援を実施');
    expect(result.decidedBy).toBe('USER-SALES-001');
    expect(result.decidedAt).toBe('2024-01-15T14:30:00Z');
    expect(result.recordedInHistory).toBe(true);
    expect(result.historyEntryId).toMatch(/^HIST-/);
  });
});