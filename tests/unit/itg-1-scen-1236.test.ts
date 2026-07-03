import { determineContractChangesPriority } from '../../src/logic/it-1781935279444-2-1-1';

describe('複数契約変更優先順位自動判定機能', () => {
  test('SCEN-1236: 請求額計算への影響度が計算できない異常な契約変更の場合、エラーが発生して処理が中断される', () => {
    const abnormalContractChanges = [
      {
        contractChangeId: 'CC-001',
        customerId: 'CUST-A',
        changeType: 'fee_change',
        changeAmount: 50000,
        impactScore: null,
        requiredFieldMissing: true,
      },
      {
        contractChangeId: 'CC-002',
        customerId: 'CUST-B',
        changeType: 'service_change',
        changeAmount: 30000,
        impactScore: undefined,
        dataTypeInvalid: true,
      },
      {
        contractChangeId: 'CC-003',
        customerId: 'CUST-C',
        changeType: 'discount_change',
        changeAmount: 20000,
        calculationFormula: null,
      },
    ];

    expect(() => {
      determineContractChangesPriority(abnormalContractChanges);
    }).toThrow(/影響度/);
  });
});