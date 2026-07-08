import { measureBaselineOCRAccuracy } from '../../src/logic/it-6-2-1-1';

describe('Model Update Baseline Measurement', () => {
  // SCEN-1132: [error] モデル更新前ベースライン測定機能 - 過去3ヶ月間に査定実績データが存在しない場合エラーを返す
  test('should return error when no assessment results exist for past 3 months', () => {
    const currentDate = new Date('2024-12-15T09:00:00Z');
    const threeMonthsAgo = new Date('2024-09-15T09:00:00Z');
    
    const emptyAssessmentData = {
      assessmentResults: [],
      period: {
        startDate: threeMonthsAgo.toISOString(),
        endDate: currentDate.toISOString(),
      },
      count: 0,
    };

    expect(() => 
      measureBaselineOCRAccuracy({
        assessmentData: emptyAssessmentData,
        measurementDate: currentDate.toISOString(),
      })
    ).toThrow(/測定対象となる査定実績データが見つかりません/);
  });
});