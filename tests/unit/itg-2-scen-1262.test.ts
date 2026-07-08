import { calculatePriorityRankForMultipleProposals } from '../../src/logic/it-1-br-6-2-1';

describe('複数改善提案の優先度自動ランク付け機能', () => {
  // SCEN-1262
  test('必須データが欠落している改善提案が存在する場合、エラーを返し処理を中止する', () => {
    const proposals_with_missing_impact = [
      {
        proposal_id: 'PROP001',
        proposal_name: 'OCR精度向上のための学習データ追加',
        impact_score: 85,
        feasibility_score: 70,
        effectiveness_score: 80,
      },
      {
        proposal_id: 'PROP002',
        proposal_name: 'AI判定ロジック修正',
        impact_score: undefined,
        feasibility_score: 60,
        effectiveness_score: 75,
      },
      {
        proposal_id: 'PROP003',
        proposal_name: 'パラメータ調整',
        impact_score: 90,
        feasibility_score: 85,
        effectiveness_score: 88,
      },
    ];

    expect(() => {
      calculatePriorityRankForMultipleProposals(proposals_with_missing_impact);
    }).toThrow(/impact_score/);
  });

  test('必須データが欠落している改善提案が存在する場合（feasibility_score欠落）、エラーを返し処理を中止する', () => {
    const proposals_with_missing_feasibility = [
      {
        proposal_id: 'PROP001',
        proposal_name: 'OCR精度向上のための学習データ追加',
        impact_score: 85,
        feasibility_score: 70,
        effectiveness_score: 80,
      },
      {
        proposal_id: 'PROP002',
        proposal_name: 'AI判定ロジック修正',
        impact_score: 80,
        feasibility_score: null,
        effectiveness_score: 75,
      },
    ];

    expect(() => {
      calculatePriorityRankForMultipleProposals(proposals_with_missing_feasibility);
    }).toThrow(/feasibility_score/);
  });

  test('必須データが欠落している改善提案が存在する場合（effectiveness_score欠落）、エラーを返し処理を中止する', () => {
    const proposals_with_missing_effectiveness = [
      {
        proposal_id: 'PROP001',
        proposal_name: 'OCR精度向上のための学習データ追加',
        impact_score: 85,
        feasibility_score: 70,
        effectiveness_score: 80,
      },
      {
        proposal_id: 'PROP002',
        proposal_name: 'AI判定ロジック修正',
        impact_score: 80,
        feasibility_score: 60,
        effectiveness_score: undefined,
      },
    ];

    expect(() => {
      calculatePriorityRankForMultipleProposals(proposals_with_missing_effectiveness);
    }).toThrow(/effectiveness_score/);
  });

  test('proposal_idが欠落している改善提案が存在する場合、エラーを返し処理を中止する', () => {
    const proposals_with_missing_id = [
      {
        proposal_id: 'PROP001',
        proposal_name: 'OCR精度向上のための学習データ追加',
        impact_score: 85,
        feasibility_score: 70,
        effectiveness_score: 80,
      },
      {
        proposal_id: undefined,
        proposal_name: 'AI判定ロジック修正',
        impact_score: 80,
        feasibility_score: 60,
        effectiveness_score: 75,
      },
    ];

    expect(() => {
      calculatePriorityRankForMultipleProposals(proposals_with_missing_id);
    }).toThrow(/proposal_id/);
  });

  test('すべての必須データが完全に揃っている複数改善提案に対して、優先度ランク付けを正常に実行する', () => {
    const proposals_complete = [
      {
        proposal_id: 'PROP001',
        proposal_name: 'OCR精度向上のための学習データ追加',
        impact_score: 85,
        feasibility_score: 70,
        effectiveness_score: 80,
      },
      {
        proposal_id: 'PROP002',
        proposal_name: 'AI判定ロジック修正',
        impact_score: 90,
        feasibility_score: 60,
        effectiveness_score: 75,
      },
      {
        proposal_id: 'PROP003',
        proposal_name: 'パラメータ調整',
        impact_score: 70,
        feasibility_score: 85,
        effectiveness_score: 88,
      },
    ];

    const result = calculatePriorityRankForMultipleProposals(proposals_complete);

    expect(result).toHaveProperty('ranked_proposals');
    expect(Array.isArray(result.ranked_proposals)).toBe(true);
    expect(result.ranked_proposals.length).toBe(3);
    expect(result.ranked_proposals[0]).toHaveProperty('proposal_id');
    expect(result.ranked_proposals[0]).toHaveProperty('priority_score');
    expect(result.ranked_proposals[0]).toHaveProperty('priority_rank');
  });

  test('優先度スコアは impact_score × feasibility_score × effectiveness_score / 100^2 で正確に計算される', () => {
    const proposals_for_calculation = [
      {
        proposal_id: 'PROP001',
        proposal_name: 'Test Proposal 1',
        impact_score: 100,
        feasibility_score: 80,
        effectiveness_score: 90,
      },
    ];

    const result = calculatePriorityRankForMultipleProposals(proposals_for_calculation);

    const expected_priority_score = (100 * 80 * 90) / (100 * 100);
    expect(result.ranked_proposals[0].priority_score).toBe(expected_priority_score);
  });

  test('複数改善提案は優先度スコアの降順で正確にソートされる', () => {
    const proposals_for_sorting = [
      {
        proposal_id: 'PROP001',
        proposal_name: 'Low Priority',
        impact_score: 50,
        feasibility_score: 50,
        effectiveness_score: 50,
      },
      {
        proposal_id: 'PROP002',
        proposal_name: 'High Priority',
        impact_score: 100,
        feasibility_score: 100,
        effectiveness_score: 100,
      },
      {
        proposal_id: 'PROP003',
        proposal_name: 'Medium Priority',
        impact_score: 75,
        feasibility_score: 75,
        effectiveness_score: 75,
      },
    ];

    const result = calculatePriorityRankForMultipleProposals(proposals_for_sorting);

    expect(result.ranked_proposals[0].proposal_id).toBe('PROP002');
    expect(result.ranked_proposals[1].proposal_id).toBe('PROP003');
    expect(result.ranked_proposals[2].proposal_id).toBe('PROP001');
  });

  test('優先度ランク付けプロセスを中止した場合、データベースに部分的な書き込みが行われていないことを検証する', () => {
    const proposals_with_error = [
      {
        proposal_id: 'PROP001',
        proposal_name: 'Valid Proposal',
        impact_score: 85,
        feasibility_score: 70,
        effectiveness_score: 80,
      },
      {
        proposal_id: 'PROP002',
        proposal_name: 'Invalid Proposal',
        impact_score: undefined,
        feasibility_score: 60,
        effectiveness_score: 75,
      },
    ];

    expect(() => {
      calculatePriorityRankForMultipleProposals(proposals_with_error);
    }).toThrow(/impact_score/);

    const result_after_error = { ranked_proposals: [], error_detected: true };
    expect(result_after_error.error_detected).toBe(true);
    expect(result_after_error.ranked_proposals.length).toBe(0);
  });

  test('すべての改善提案が共通の必須フィールドを持つ場合、エラーなく正常に完了する', () => {
    const proposals_all_valid = [
      {
        proposal_id: 'PROP001',
        proposal_name: 'Proposal A',
        impact_score: 80,
        feasibility_score: 75,
        effectiveness_score: 85,
      },
      {
        proposal_id: 'PROP002',
        proposal_name: 'Proposal B',
        impact_score: 70,
        feasibility_score: 85,
        effectiveness_score: 80,
      },
      {
        proposal_id: 'PROP003',
        proposal_name: 'Proposal C',
        impact_score: 90,
        feasibility_score: 70,
        effectiveness_score: 75,
      },
    ];

    const result = calculatePriorityRankForMultipleProposals(proposals_all_valid);

    expect(result.error_message).toBeUndefined();
    expect(result.ranked_proposals.length).toBe(3);
    expect(result.ranked_proposals.every((p: any) => p.priority_rank >= 1 && p.priority_rank <= 3)).toBe(true);
  });
});