import { validateContractChangeApplicability } from '../../src/logic/it-1781935279444-2-2-1';

describe('契約変更妥当性判定機能 - 過去契約データ欠落時のエラーハンドリング', () => {
  // SCEN-858
  test('判定基準となる過去契約データが完全に欠落する場合に判定不可エラーが発生する', () => {
    const contract_change_request = {
      contract_change_id: 'CC_20240115_001',
      customer_id: 'CUST_A001',
      contract_id: 'CTR_2024_001',
      change_type: 'rate_adjustment',
      proposed_rate: 15000,
      proposed_effective_date: '2024-02-01',
      reason: '営業成果に基づく割引調整',
      submitted_by: 'OPE_REP_001',
      submitted_at: '2024-01-15T10:30:00Z',
    };

    const reference_contract_data = null;

    const error_context = {
      customer_id: 'CUST_A001',
      contract_id: 'CTR_2024_001',
      lookup_timestamp: '2024-01-15T10:30:00Z',
    };

    expect(() => {
      validateContractChangeApplicability(
        contract_change_request,
        reference_contract_data,
        error_context
      );
    }).toThrow(/過去契約データ/);
  });
});