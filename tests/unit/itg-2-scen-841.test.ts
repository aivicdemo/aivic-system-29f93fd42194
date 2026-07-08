import { calculateComprehensiveQuotationDeviationJudgment } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-841
  test('相場乖離総合判定と承認・修正決定 - すべての判定パラメータが許容上限値ジャストの境界ケースで、承認判定が正常に下される', () => {
    const quotation_id = 'QT-20240115-001';
    const assessor_id = 'ASS-0001';
    const price_deviation_rate = 10.0;
    const quality_evaluation_deviation = 8.0;
    const market_demand_deviation = 5.0;
    const allowable_price_deviation_upper_limit = 10.0;
    const allowable_quality_deviation_upper_limit = 8.0;
    const allowable_market_demand_upper_limit = 5.0;
    const assessment_timestamp = new Date('2024-01-15T11:00:00Z');
    const assessment_logic_version = 'v2.1.0';

    const result = calculateComprehensiveQuotationDeviationJudgment({
      quotation_id,
      assessor_id,
      price_deviation_rate,
      quality_evaluation_deviation,
      market_demand_deviation,
      allowable_price_deviation_upper_limit,
      allowable_quality_deviation_upper_limit,
      allowable_market_demand_upper_limit,
      assessment_timestamp,
      assessment_logic_version,
    });

    expect(result).toEqual({
      quotation_id,
      assessor_id,
      comprehensive_judgment_result: '承認可能',
      price_deviation_within_limit: true,
      quality_deviation_within_limit: true,
      market_demand_within_limit: true,
      comprehensive_score: 100,
      judgment_timestamp: assessment_timestamp,
      judgment_logic_version: assessment_logic_version,
      judgment_history_recorded: true,
      system_exception_occurred: false,
      boundary_case_flag: true,
    });

    expect(result.comprehensive_judgment_result).toBe('承認可能');
    expect(result.comprehensive_score).toBe(100);
    expect(result.judgment_history_recorded).toBe(true);
    expect(result.system_exception_occurred).toBe(false);
    expect(result.boundary_case_flag).toBe(true);
  });
});