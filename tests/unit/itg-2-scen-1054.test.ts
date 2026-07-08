import { recordNegotiationResultWithEmptyModification } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  // SCEN-1054
  test('交渉結果記録・統計蓄積機能 - 修正内容が空文字列の場合でも記録され、前回比較データとして利用可能である', () => {
    const negotiation_id = 'NEG-20240115-001';
    const quote_id = 'QT-2024-0500-001';
    const original_amount = 5000000;
    const agreed_amount = 4800000;
    const modification_content = '';
    const negotiation_date = '2024-01-15T10:30:00Z';
    const assessee_id = 'ASS-001';
    const assessee_name = '査定員太郎';

    const result = recordNegotiationResultWithEmptyModification({
      negotiation_id,
      quote_id,
      original_amount,
      agreed_amount,
      modification_content,
      negotiation_date,
      assessee_id,
      assessee_name,
    });

    expect(result.success).toBe(true);
    expect(result.recorded_id).toBe(negotiation_id);
    expect(result.stored_modification_content).toBe('');
    expect(result.stored_modification_content).toEqual(modification_content);
    expect(result.is_stored_as_statistical_data).toBe(true);
    expect(result.can_be_used_as_comparison_reference).toBe(true);
    expect(result.amount_reduction).toBe(200000);
    expect(result.reduction_rate).toBe(4);
    expect(result.database_error).toBeNull();
    expect(result.is_available_for_next_comparison).toBe(true);
    expect(result.comparison_data_status).toBe('ready');
    expect(result.statistical_timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});