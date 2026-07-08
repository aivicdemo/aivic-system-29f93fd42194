import { calculateJudgmentConsistency } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  test('SCEN-852: [error] 査定員間判定一致度計算機能 - 判定記録が1件のみの場合にエラーを返却する', () => {
    // テストデータ準備: 判定記録が1件のみの状態
    const judgmentRecordsWithOnlyOne = [
      {
        assessor_id: 'A001',
        estimate_id: 'E12345',
        judgment_result: 'approval',
        judgment_amount: 1000000,
        judgment_date: '2024-01-15T10:00:00Z',
        construction_type: '鉄骨工事',
        amount_band: '1000万円以上2000万円未満',
      },
    ];

    // 一致度計算処理を実行 → エラーが発生することを期待
    expect(() => calculateJudgmentConsistency(judgmentRecordsWithOnlyOne)).toThrow(
      /判定一致度の計算には2件以上の判定記録が必要です/
    );
  });
});