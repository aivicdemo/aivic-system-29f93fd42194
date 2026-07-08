import { calculateAssessorAccuracyMetrics } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  test('SCEN-1280: 新人と経験者の判定精度の定量的な能力差が可視化される', () => {
    // ===== 入力データ準備 =====
    // 過去3ヶ月間のサンプル査定データ
    const assessmentData = [
      // 新人査定員A - 低精度サンプル
      {
        assessor_id: 'A_NEWBIE',
        assessor_name: '新人査定員A',
        assessment_date: '2024-01-15',
        work_type: '建築工事',
        amount_band: '1000万円以上3000万円未満',
        estimated_amount: 2000,
        system_judgment_amount: 1950,
        assessor_judgment_amount: 2050,
        system_decision: 'ACCEPTABLE',
        assessor_decision: 'ACCEPTABLE',
        system_confidence_score: 78,
      },
      {
        assessor_id: 'A_NEWBIE',
        assessor_name: '新人査定員A',
        assessment_date: '2024-01-20',
        work_type: '土木工事',
        amount_band: '500万円以上1000万円未満',
        estimated_amount: 750,
        system_judgment_amount: 720,
        assessor_judgment_amount: 800,
        system_decision: 'ACCEPTABLE',
        assessor_decision: 'REVISION_REQUIRED',
        system_confidence_score: 65,
      },
      {
        assessor_id: 'A_NEWBIE',
        assessor_name: '新人査定員A',
        assessment_date: '2024-02-10',
        work_type: '建築工事',
        amount_band: '3000万円以上',
        estimated_amount: 5000,
        system_judgment_amount: 4800,
        assessor_judgment_amount: 5300,
        system_decision: 'ACCEPTABLE',
        assessor_decision: 'ACCEPTABLE',
        system_confidence_score: 72,
      },
      {
        assessor_id: 'A_NEWBIE',
        assessor_name: '新人査定員A',
        assessment_date: '2024-02-15',
        work_type: '設備工事',
        amount_band: '100万円以上500万円未満',
        estimated_amount: 300,
        system_judgment_amount: 290,
        assessor_judgment_amount: 330,
        system_decision: 'ACCEPTABLE',
        assessor_decision: 'ACCEPTABLE',
        system_confidence_score: 58,
      },
      {
        assessor_id: 'A_NEWBIE',
        assessor_name: '新人査定員A',
        assessment_date: '2024-03-08',
        work_type: '土木工事',
        amount_band: '1000万円以上3000万円未満',
        estimated_amount: 1800,
        system_judgment_amount: 1900,
        assessor_judgment_amount: 1600,
        system_decision: 'ACCEPTABLE',
        assessor_decision: 'REVISION_REQUIRED',
        system_confidence_score: 62,
      },
      {
        assessor_id: 'A_NEWBIE',
        assessor_name: '新人査定員A',
        assessment_date: '2024-03-20',
        work_type: '建築工事',
        amount_band: '500万円以上1000万円未満',
        estimated_amount: 650,
        system_judgment_amount: 640,
        assessor_judgment_amount: 700,
        system_decision: 'ACCEPTABLE',
        assessor_decision: 'ACCEPTABLE',
        system_confidence_score: 74,
      },

      // 経験者査定員B - 高精度サンプル
      {
        assessor_id: 'B_EXPERT',
        assessor_name: '経験者査定員B',
        assessment_date: '2024-01-12',
        work_type: '建築工事',
        amount_band: '1000万円以上3000万円未満',
        estimated_amount: 2000,
        system_judgment_amount: 1950,
        assessor_judgment_amount: 1965,
        system_decision: 'ACCEPTABLE',
        assessor_decision: 'ACCEPTABLE',
        system_confidence_score: 78,
      },
      {
        assessor_id: 'B_EXPERT',
        assessor_name: '経験者査定員B',
        assessment_date: '2024-01-22',
        work_type: '土木工事',
        amount_band: '500万円以上1000万円未満',
        estimated_amount: 750,
        system_judgment_amount: 720,
        assessor_judgment_amount: 725,
        system_decision: 'ACCEPTABLE',
        assessor_decision: 'ACCEPTABLE',
        system_confidence_score: 65,
      },
      {
        assessor_id: 'B_EXPERT',
        assessor_name: '経験者査定員B',
        assessment_date: '2024-02-12',
        work_type: '建築工事',
        amount_band: '3000万円以上',
        estimated_amount: 5000,
        system_judgment_amount: 4800,
        assessor_judgment_amount: 4850,
        system_decision: 'ACCEPTABLE',
        assessor_decision: 'ACCEPTABLE',
        system_confidence_score: 72,
      },
      {
        assessor_id: 'B_EXPERT',
        assessor_name: '経験者査定員B',
        assessment_date: '2024-02-18',
        work_type: '設備工事',
        amount_band: '100万円以上500万円未満',
        estimated_amount: 300,
        system_judgment_amount: 290,
        assessor_judgment_amount: 295,
        system_decision: 'ACCEPTABLE',
        assessor_decision: 'ACCEPTABLE',
        system_confidence_score: 58,
      },
      {
        assessor_id: 'B_EXPERT',
        assessor_name: '経験者査定員B',
        assessment_date: '2024-03-05',
        work_type: '土木工事',
        amount_band: '1000万円以上3000万円未満',
        estimated_amount: 1800,
        system_judgment_amount: 1900,
        assessor_judgment_amount: 1895,
        system_decision: 'ACCEPTABLE',
        assessor_decision: 'ACCEPTABLE',
        system_confidence_score: 62,
      },
      {
        assessor_id: 'B_EXPERT',
        assessor_name: '経験者査定員B',
        assessment_date: '2024-03-22',
        work_type: '建築工事',
        amount_band: '500万円以上1000万円未満',
        estimated_amount: 650,
        system_judgment_amount: 640,
        assessor_judgment_amount: 642,
        system_decision: 'ACCEPTABLE',
        assessor_decision: 'ACCEPTABLE',
        system_confidence_score: 74,
      },
    ];

    // ===== 計測期間指定 =====
    const aggregationPeriod = {
      start_date: '2024-01-01',
      end_date: '2024-03-31',
    };

    // ===== 関数実行 =====
    const result = calculateAssessorAccuracyMetrics(assessmentData, aggregationPeriod);

    // ===== 新人査定員A の指標検証 =====
    const newbie_metrics = result.assessors.find((a) => a.assessor_id === 'A_NEWBIE');
    expect(newbie_metrics).toBeDefined();
    expect(newbie_metrics!.assessor_name).toBe('新人査定員A');

    // 新人A: 判定精度スコア = システムとの一致度に基づく
    // 一致決定数: ACCEPTABLE/ACCEPTABLE (1,3,4,6) = 4件, 不一致 (2,5) = 2件
    // 判定精度スコア = (4 / 6) * 100 = 66.67
    expect(newbie_metrics!.judgment_accuracy_score).toBeCloseTo(66.67, 1);

    // 新人A: 一致率 = システム決定と査定員決定が完全一致した比率
    // 完全一致: amount 差分 ≤ 2% かつ decision 一致 = (1,3,4,6) = 4件
    // 一致率 = (4 / 6) * 100 = 66.67
    expect(newbie_metrics!.agreement_rate).toBeCloseTo(66.67, 1);

    // 新人A: 誤差率 = システム判定額と査定員判定額の平均誤差率
    // 誤差: |2050-1950|/1950 ≈ 5.13%, |800-720|/720 ≈ 11.11%, |5300-4800|/4800 ≈ 10.42%,
    //       |330-290|/290 ≈ 13.79%, |1600-1900|/1900 ≈ 15.79%, |700-640|/640 ≈ 9.38%
    // 平均誤差率 ≈ (5.13 + 11.11 + 10.42 + 13.79 + 15.79 + 9.38) / 6 ≈ 10.93
    expect(newbie_metrics!.average_error_rate).toBeCloseTo(10.93, 1);

    // 新人A: 判定数
    expect(newbie_metrics!.total_assessments).toBe(6);

    // ===== 経験者査定員B の指標検証 =====
    const expert_metrics = result.assessors.find((a) => a.assessor_id === 'B_EXPERT');
    expect(expert_metrics).toBeDefined();
    expect(expert_metrics!.assessor_name).toBe('経験者査定員B');

    // 経験者B: 判定精度スコア
    // 一致決定数: すべて ACCEPTABLE/ACCEPTABLE = 6件 / 6件
    // 判定精度スコア = (6 / 6) * 100 = 100.00
    expect(expert_metrics!.judgment_accuracy_score).toBe(100.0);

    // 経験者B: 一致率
    // 完全一致: 誤差 ≤ 2% = (1,2,3,4,5,6) = 6件
    // 一致率 = (6 / 6) * 100 = 100.00
    expect(expert_metrics!.agreement_rate).toBe(100.0);

    // 経験者B: 誤差率
    // 誤差: |1965-1950|/1950 ≈ 0.77%, |725-720|/720 ≈ 0.69%, |4850-4800|/4800 ≈ 1.04%,
    //       |295-290|/290 ≈ 1.72%, |1895-1900|/1900 ≈ 0.26%, |642-640|/640 ≈ 0.31%
    // 平均誤差率 ≈ (0.77 + 0.69 + 1.04 + 1.72 + 0.26 + 0.31) / 6 ≈ 0.80
    expect(expert_metrics!.average_error_rate).toBeCloseTo(0.80, 1);

    // 経験者B: 判定数
    expect(expert_metrics!.total_assessments).toBe(6);

    // ===== 能力差の定量的検証 =====
    // 判定精度スコア差分 = 100.00 - 66.67 = 33.33
    const accuracy_difference = expert_metrics!.judgment_accuracy_score - newbie_metrics!.judgment_accuracy_score;
    expect(accuracy_difference).toBeCloseTo(33.33, 1);

    // 一致率差分 = 100.00 - 66.67 = 33.33
    const agreement_difference = expert_metrics!.agreement_rate - newbie_metrics!.agreement_rate;
    expect(agreement_difference).toBeCloseTo(33.33, 1);

    // 誤差率差分 = 10.93 - 0.80 = 10.13 (経験者が小さい = 優秀)
    const error_rate_difference = newbie_metrics!.average_error_rate - expert_metrics!.average_error_rate;
    expect(error_rate_difference).toBeCloseTo(10.13, 1);

    // ===== グループ集計データ検証 =====
    expect(result.summary).toBeDefined();
    expect(result.summary.total_assessors).toBe(2);
    expect(result.summary.aggregation_period_start).toBe('2024-01-01');
    expect(result.summary.aggregation_period_end).toBe('2024-03-31');

    // ===== グラフデータ構造の検証 =====
    expect(result.chart_data).toBeDefined();
    expect(result.chart_data.accuracy_scores).toEqual([
      {
        assessor_id: 'A_NEWBIE',
        assessor_name: '新人査定員A',
        score: 66.67,
      },
      {
        assessor_id: 'B_EXPERT',
        assessor_name: '経験者査定員B',
        score: 100.0,
      },
    ]);

    expect(result.chart_data.agreement_rates).toEqual([
      {
        assessor_id: 'A_NEWBIE',
        assessor_name: '新人査定員A',
        rate: 66.67,
      },
      {
        assessor_id: 'B_EXPERT',
        assessor_name: '経験者査定員B',
        rate: 100.0,
      },
    ]);

    expect(result.chart_data.error_rates).toEqual([
      {
        assessor_id: 'A_NEWBIE',
        assessor_name: '新人査定員A',
        rate: 10.93,
      },
      {
        assessor_id: 'B_EXPERT',
        assessor_name: '経験者査定員B',
        rate: 0.80,
      },
    ]);

    // ===== 比較分析データの検証 =====
    expect(result.comparison_analysis).toBeDefined();
    expect(result.comparison_analysis.accuracy_gap).toBeCloseTo(33.33, 1);
    expect(result.comparison_analysis.agreement_gap).toBeCloseTo(33.33, 1);
    expect(result.comparison_analysis.error_rate_gap).toBeCloseTo(10.13, 1);
    expect(result.comparison_analysis.superior_assessor).toBe('B_EXPERT');
    expect(result.comparison_analysis.capability_assessment).toBe('経験者が新人を大きく上回る');

    // ===== レポート全体の型チェック =====
    expect(result).toHaveProperty('assessors');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('chart_data');
    expect(result).toHaveProperty('comparison_analysis');
    expect(Array.isArray(result.assessors)).toBe(true);
    expect(Array.isArray(result.chart_data.accuracy_scores)).toBe(true);
    expect(Array.isArray(result.chart_data.agreement_rates)).toBe(true);
    expect(Array.isArray(result.chart_data.error_rates)).toBe(true);
  });
});