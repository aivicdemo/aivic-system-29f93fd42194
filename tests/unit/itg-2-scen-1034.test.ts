import { describe, test, expect } from '@jest/globals';
import { aggregateNegotiationResultsStatistics } from '../../src/logic/it-1-br-6-2-1';

describe('交渉結果統計集計機能 - 査定員承認検証', () => {
  // SCEN-1034
  test('査定員による承認なく修正見積が記録された場合、処理は中断されエラーが返される', () => {
    const input_modified_estimate_data = {
      estimate_id: 'EST-20240115-001',
      original_amount: 1000000,
      negotiated_amount: 950000,
      negotiation_reason: '相場データに基づく調整',
      assessor_approval_flag: false,
      assessor_id: 'ASS-001',
      approval_datetime: null,
      recording_datetime: new Date('2024-01-15T11:30:00Z'),
    };

    const test_batch = [input_modified_estimate_data];

    expect(() => {
      aggregateNegotiationResultsStatistics(test_batch);
    }).toThrow(/査定員による承認/);
  });
});