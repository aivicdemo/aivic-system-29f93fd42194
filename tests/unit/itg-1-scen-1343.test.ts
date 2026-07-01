import { describe, test, expect } from '@jest/globals';
import { adjustBillingForContractChange } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-1343: 契約変更前後で請求ルールが存在しない場合にエラーが返される', () => {
    const contract_id = 'CTR-20240115-001';
    const customer_id = 'CUST-0001';
    const service_id = 'SVC-BASIC';
    
    const input = {
      contract_id: contract_id,
      customer_id: customer_id,
      service_id: service_id,
      billing_rule_before: null,
      billing_rule_after: null,
      change_date: '2024-01-15T09:00:00Z',
      changed_by: 'OP-0001'
    };

    expect(() => {
      adjustBillingForContractChange(input);
    }).toThrow(/請求ルール/);
  });
});