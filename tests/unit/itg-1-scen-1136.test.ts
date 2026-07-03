import { describe, test, expect } from '@jest/globals';
import { confirmCustomerDistributionList } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-1136: [error] 顧客企業別配信リスト確認 - 複数契約を保有する顧客企業について、有効契約と失効契約が混在する場合に誤判定される
  test('複数契約を保有する顧客企業について、有効契約と失効契約が混在する場合、配信リストが正確に分類される', () => {
    // テストデータ: 複数契約を保有する顧客企業
    const customerId = 'CUST-001';
    const customerName = 'テスト顧客企業A';
    
    // 有効期限内の契約（有効契約）を2件
    const validContract1 = {
      contractId: 'CT-001-V1',
      customerId: customerId,
      contractName: '基本契約',
      startDate: new Date('2024-01-01').toISOString(),
      endDate: new Date('2025-12-31').toISOString(),
      status: 'active',
      isActive: true,
    };

    const validContract2 = {
      contractId: 'CT-001-V2',
      customerId: customerId,
      contractName: 'サービス契約A',
      startDate: new Date('2024-06-01').toISOString(),
      endDate: new Date('2025-11-30').toISOString(),
      status: 'active',
      isActive: true,
    };

    // 有効期限切れの契約（失効契約）を2件
    const expiredContract1 = {
      contractId: 'CT-001-E1',
      customerId: customerId,
      contractName: '旧基本契約',
      startDate: new Date('2022-01-01').toISOString(),
      endDate: new Date('2023-12-31').toISOString(),
      status: 'expired',
      isActive: false,
    };

    const expiredContract2 = {
      contractId: 'CT-001-E2',
      customerId: customerId,
      contractName: '旧サービス契約B',
      startDate: new Date('2023-01-01').toISOString(),
      endDate: new Date('2024-03-31').toISOString(),
      status: 'expired',
      isActive: false,
    };

    const contracts = [validContract1, validContract2, expiredContract1, expiredContract2];

    const currentDate = new Date('2024-10-15').toISOString();

    // 顧客企業別配信リスト確認機能を実行
    const result = confirmCustomerDistributionList({
      customerId: customerId,
      customerName: customerName,
      contracts: contracts,
      currentDate: currentDate,
    });

    // 配信対象リストに当該顧客企業が表示されているか確認
    expect(result).toBeDefined();
    expect(result.customerId).toBe(customerId);
    expect(result.customerName).toBe(customerName);

    // 有効契約のみがカウントされているか確認
    expect(result.activeContractCount).toBe(2);
    expect(result.activeContractIds).toEqual(['CT-001-V1', 'CT-001-V2']);

    // 失効契約がステータス別に正しく分類されているか確認
    expect(result.expiredContractCount).toBe(2);
    expect(result.expiredContractIds).toEqual(['CT-001-E1', 'CT-001-E2']);

    // 配信判定ロジックが有効契約の存在を正しく認識しているか確認
    expect(result.shouldDistribute).toBe(true);
    expect(result.distributionStatus).toBe('eligible');

    // 契約ステータスが明確に区別されているか確認
    expect(result.contracts).toHaveLength(4);
    
    const activeContracts = result.contracts.filter(
      (c: { status: string }) => c.status === 'active'
    );
    expect(activeContracts).toHaveLength(2);

    const expiredContracts = result.contracts.filter(
      (c: { status: string }) => c.status === 'expired'
    );
    expect(expiredContracts).toHaveLength(2);

    // システムが契約ステータスを誤判定していないか確認
    expect(result.allActiveContractsValid).toBe(true);
    expect(result.allExpiredContractsInactive).toBe(true);
  });
});