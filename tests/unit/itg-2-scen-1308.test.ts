import { calculateJudgmentVariationRate } from '../../src/logic/it-1-br-6-2-1';

describe('査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析機能', () => {
  // SCEN-1308
  test('判定ばらつき率の算出 - 査定員の判定データが1件のみ存在する場合、ばらつき率計算不可を適切に検出する', () => {
    const assessment_item_id = 'ASSESS-ITEM-001';
    const appraiser_judgments = [
      {
        appraiser_id: 'APPRAISER-001',
        judgment_value: 95000,
        judgment_date: '2024-01-15T10:30:00Z',
      },
    ];

    const execute_fn = () => {
      calculateJudgmentVariationRate({
        assessment_item_id,
        appraiser_judgments,
      });
    };

    expect(execute_fn).toThrow(/複数の査定員/);
  });
});