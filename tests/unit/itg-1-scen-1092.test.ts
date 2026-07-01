import { evaluateStaffReadiness } from '../../src/logic/it-1-2-1';

describe('新入スタッフの到達度評価判定機能', () => {
  // SCEN-1092
  test('営業報告書集計と契約書管理が不合格の場合、追加指導判定となること', () => {
    const evaluation_input = {
      staff_id: 'STAFF_001',
      evaluation_items: [
        {
          item_name: '営業データ品質検証',
          assessment_result: 'pass',
        },
        {
          item_name: '営業報告書集計',
          assessment_result: 'fail',
        },
        {
          item_name: '請求書作成',
          assessment_result: 'pass',
        },
        {
          item_name: '契約書管理',
          assessment_result: 'fail',
        },
        {
          item_name: '請求自動化',
          assessment_result: 'pass',
        },
      ],
    };

    const result = evaluateStaffReadiness(evaluation_input);

    expect(result.overall_judgment).toBe('追加指導');
    expect(result.failed_items).toEqual(['営業報告書集計', '契約書管理']);
    expect(result.failed_items.length).toBe(2);
    expect(result.guidance_required).toBe(true);
  });
});