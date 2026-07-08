import { calculateMonthlyFluctuationRate } from '../../src/logic/it-1-br-2-2-2-1';

describe('査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード', () => {
  test('SCEN-882: 前月の査定件数データが存在しない場合、変動率算出がエラーを返す', () => {
    // 前提条件: 前月の査定件数データが存在しない状態
    const currentMonthAssessmentCount = 150;
    const previousMonthAssessmentCount = null;
    const currentYear = 2024;
    const currentMonth = 2;

    // 変動率算出処理を実行
    // 期待結果: エラーを throw し、エラーメッセージに『前月査定件数データが存在しません』を含む
    expect(() => {
      calculateMonthlyFluctuationRate({
        currentMonthAssessmentCount,
        previousMonthAssessmentCount,
        currentYear,
        currentMonth,
      });
    }).toThrow(/前月査定件数データが存在しません/);
  });
});