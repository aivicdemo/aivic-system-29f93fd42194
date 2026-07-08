import { calculateAssessmentEmployeeProductivityIndicators } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1277: [error] 査定員別生産性指標自動計算機能 - 処理時間がゼロの場合、生産性指標の計算がエラーとなる
  test('処理時間がゼロの場合、生産性指標計算がゼロ除算エラーとなること', () => {
    const input_assessment_employee_id = 'EMP-001';
    const input_assessment_count = 10;
    const input_processing_time_minutes = 0;
    const input_assessment_date = '2024-01-15';

    expect(() =>
      calculateAssessmentEmployeeProductivityIndicators({
        assessment_employee_id: input_assessment_employee_id,
        assessment_count: input_assessment_count,
        processing_time_minutes: input_processing_time_minutes,
        assessment_date: input_assessment_date,
      })
    ).toThrow(/ゼロ除算/);
  });
});