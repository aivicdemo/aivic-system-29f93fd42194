import { recordNegotiationResult } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1051: [normal] 交渉結果記録・統計蓄積機能
  test('ゼネコンとの交渉結果（合意金額・乖離理由・修正内容）が正確に記録・蓄積される', () => {
    const initial_assessment_amount = 4800000;
    const agreed_amount = 5000000;
    const deviation_amount = agreed_amount - initial_assessment_amount;
    const deviation_rate = (deviation_amount / initial_assessment_amount) * 100;
    
    const negotiation_record = {
      case_id: 'CASE-20240115-001',
      contractor_name: 'ABC Construction Co.',
      initial_assessment_amount: initial_assessment_amount,
      agreed_amount: agreed_amount,
      deviation_reasons: [
        '市場価格の変動',
        '施工実績の加算'
      ],
      modification_details: [
        {
          item: '基礎工事追加',
          amount: 300000
        },
        {
          item: '技術料加算',
          amount: 200000
        }
      ],
      recorded_at: new Date('2024-01-15T14:30:00Z'),
      recorded_by: 'assessor_001'
    };

    const result = recordNegotiationResult(negotiation_record);

    expect(result).toEqual({
      status: 'success',
      case_id: 'CASE-20240115-001',
      contractor_name: 'ABC Construction Co.',
      initial_assessment_amount: 4800000,
      agreed_amount: 5000000,
      deviation_amount: 200000,
      deviation_rate: 4.166666666666667,
      deviation_reasons: [
        '市場価格の変動',
        '施工実績の加算'
      ],
      modification_details: [
        {
          item: '基礎工事追加',
          amount: 300000
        },
        {
          item: '技術料加算',
          amount: 200000
        }
      ],
      total_modification_amount: 500000,
      recorded_at: '2024-01-15T14:30:00Z',
      recorded_by: 'assessor_001',
      statistics_database_id: expect.any(String),
      retrievable_via_search: true
    });

    expect(result.total_modification_amount).toBe(500000);
    expect(result.deviation_amount).toBe(200000);
    expect(result.deviation_rate).toBeCloseTo(4.166666666666667, 5);
    expect(result.statistics_database_id).toMatch(/^STAT-/);
    expect(result.retrievable_via_search).toBe(true);
  });
});