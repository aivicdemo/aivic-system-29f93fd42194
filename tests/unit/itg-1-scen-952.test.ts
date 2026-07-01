import { identifyBillingTargetContracts } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  // SCEN-952: [error] 請求対象契約確認・割引基準識別機能 - 有効期限が切れた契約が請求対象から正しく除外される
  test('有効期限が切れた契約は請求対象から除外され、有効な契約のみが識別される', () => {
    const expiredContract = {
      contractId: 'TEST-EXP-001',
      customerId: 'CUST-001',
      contractName: '有効期限切れ契約',
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      billingUnitPrice: 100000,
      discountRate: 0.1,
      status: 'active',
    };

    const activeContract = {
      contractId: 'TEST-ACTIVE-001',
      customerId: 'CUST-001',
      contractName: '有効な契約',
      startDate: '2024-01-01',
      endDate: '2025-12-31',
      billingUnitPrice: 150000,
      discountRate: 0.05,
      status: 'active',
    };

    const currentDate = new Date('2024-06-15');
    const contractList = [expiredContract, activeContract];

    const result = identifyBillingTargetContracts({
      contracts: contractList,
      evaluationDate: currentDate,
    });

    // 有効期限切れ契約が除外されていることを確認
    expect(result.billingTargetContracts).not.toContainEqual(
      expect.objectContaining({ contractId: 'TEST-EXP-001' })
    );

    // 有効な契約が請求対象に含まれていることを確認
    expect(result.billingTargetContracts).toContainEqual(
      expect.objectContaining({ contractId: 'TEST-ACTIVE-001' })
    );

    // 請求対象契約リストの長さが 1 であることを確認
    expect(result.billingTargetContracts).toHaveLength(1);

    // 有効な契約のみが結果に含まれていることを確認
    expect(result.billingTargetContracts[0].contractId).toBe('TEST-ACTIVE-001');
    expect(result.billingTargetContracts[0].customerId).toBe('CUST-001');
    expect(result.billingTargetContracts[0].endDate).toBe('2025-12-31');

    // 有効期限切れ契約が除外された旨のログまたはメッセージが存在することを確認
    expect(result.excludedContracts).toContainEqual(
      expect.objectContaining({ contractId: 'TEST-EXP-001' })
    );

    // 除外理由が 'expiredContract' であることを確認
    const excludedExpired = result.excludedContracts.find(
      (c) => c.contractId === 'TEST-EXP-001'
    );
    expect(excludedExpired?.exclusionReason).toBe('expiredContract');

    // 割引基準識別: 有効期限切れ契約には割引が適用されていないことを確認
    const discountedContracts = result.billingTargetContracts.filter(
      (c) => c.discountRate && c.discountRate > 0
    );
    expect(discountedContracts.every((c) => c.contractId !== 'TEST-EXP-001')).toBe(
      true
    );

    // 有効な契約の割引基準が正しく識別されていることを確認
    const activeWithDiscount = result.billingTargetContracts.find(
      (c) => c.contractId === 'TEST-ACTIVE-001'
    );
    expect(activeWithDiscount?.discountRate).toBe(0.05);

    // 処理結果の成功ステータスを確認
    expect(result.processStatus).toBe('success');

    // システムログに除外処理の記録があることを確認
    expect(result.systemLog).toBeDefined();
    expect(result.systemLog).toContain('TEST-EXP-001');
    expect(result.systemLog).toMatch(/有効期限切れ/);
  });
});