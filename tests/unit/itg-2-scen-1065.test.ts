import { aggregateAssessmentMetricsByAppraiser } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  test('SCEN-1065: [normal] 査定員別判定精度・乖離パターン分析 - 平均査定時間の差分が正しく算出される', () => {
    // 新人査定員データ（経験年数1年以下）
    const noviceAppraiser = {
      appraiser_id: 'A001',
      name: '新人太郎',
      experience_years: 0.8,
      hire_date: '2023-09-15',
    };

    // 経験者査定員データ（経験年数5年以上）
    const experiencedAppraiser = {
      appraiser_id: 'A002',
      name: '経験花子',
      experience_years: 6.2,
      hire_date: '2018-03-10',
    };

    // 過去30日間の新人査定員の査定実績データ
    const noviceAssessmentRecords = [
      {
        appraiser_id: 'A001',
        assessment_time_minutes: 25,
        assessment_date: '2024-11-01',
      },
      {
        appraiser_id: 'A001',
        assessment_time_minutes: 28,
        assessment_date: '2024-11-02',
      },
      {
        appraiser_id: 'A001',
        assessment_time_minutes: 32,
        assessment_date: '2024-11-03',
      },
      {
        appraiser_id: 'A001',
        assessment_time_minutes: 27,
        assessment_date: '2024-11-04',
      },
      {
        appraiser_id: 'A001',
        assessment_time_minutes: 30,
        assessment_date: '2024-11-05',
      },
    ];

    // 過去30日間の経験者査定員の査定実績データ
    const experiencedAssessmentRecords = [
      {
        appraiser_id: 'A002',
        assessment_time_minutes: 18,
        assessment_date: '2024-11-01',
      },
      {
        appraiser_id: 'A002',
        assessment_time_minutes: 16,
        assessment_date: '2024-11-02',
      },
      {
        appraiser_id: 'A002',
        assessment_time_minutes: 17,
        assessment_date: '2024-11-03',
      },
      {
        appraiser_id: 'A002',
        assessment_time_minutes: 19,
        assessment_date: '2024-11-04',
      },
      {
        appraiser_id: 'A002',
        assessment_time_minutes: 15,
        assessment_date: '2024-11-05',
      },
    ];

    const allAssessmentRecords = [
      ...noviceAssessmentRecords,
      ...experiencedAssessmentRecords,
    ];

    const appraiserList = [noviceAppraiser, experiencedAppraiser];

    // 関数呼び出し
    const result = aggregateAssessmentMetricsByAppraiser({
      appraiser_list: appraiserList,
      assessment_records: allAssessmentRecords,
      analysis_period_days: 30,
    });

    // 新人の平均査定時間: (25 + 28 + 32 + 27 + 30) / 5 = 142 / 5 = 28.4分
    const novice_average_assessment_time = 28.4;

    // 経験者の平均査定時間: (18 + 16 + 17 + 19 + 15) / 5 = 85 / 5 = 17分
    const experienced_average_assessment_time = 17;

    // 新人 - 経験者の差分: 28.4 - 17 = 11.4分
    const expected_time_difference = 11.4;

    // 新人査定員の結果を確認
    const novice_result = result.metrics.find(
      (m) => m.appraiser_id === 'A001'
    );
    expect(novice_result).toBeDefined();
    expect(novice_result?.average_assessment_time_minutes).toBe(
      novice_average_assessment_time
    );
    expect(novice_result?.appraiser_experience_years).toBe(0.8);

    // 経験者査定員の結果を確認
    const experienced_result = result.metrics.find(
      (m) => m.appraiser_id === 'A002'
    );
    expect(experienced_result).toBeDefined();
    expect(experienced_result?.average_assessment_time_minutes).toBe(
      experienced_average_assessment_time
    );
    expect(experienced_result?.appraiser_experience_years).toBe(6.2);

    // 差分の計算結果を確認
    const time_difference = result.comparative_analysis.time_difference_minutes;
    expect(time_difference).toBe(expected_time_difference);

    // 差分が正の値（新人が経験者より時間がかかる）ことを確認
    expect(time_difference).toBeGreaterThan(0);

    // 可視化用のグラフデータが正しく構成されていることを確認
    expect(result.visualization).toBeDefined();
    expect(result.visualization.chart_type).toBe('bar');
    expect(result.visualization.data_points).toHaveLength(2);

    // グラフデータポイントの検証
    const novice_data_point = result.visualization.data_points.find(
      (dp) => dp.appraiser_id === 'A001'
    );
    expect(novice_data_point?.value_minutes).toBe(28.4);
    expect(novice_data_point?.label).toContain('新人太郎');

    const experienced_data_point = result.visualization.data_points.find(
      (dp) => dp.appraiser_id === 'A002'
    );
    expect(experienced_data_point?.value_minutes).toBe(17);
    expect(experienced_data_point?.label).toContain('経験花子');

    // 比較分析結果の各項目を確認
    expect(result.comparative_analysis.novice_average_time).toBe(
      novice_average_assessment_time
    );
    expect(result.comparative_analysis.experienced_average_time).toBe(
      experienced_average_assessment_time
    );
    expect(result.comparative_analysis.time_difference_percentage).toBe(
      (expected_time_difference / experienced_average_assessment_time) * 100
    );

    // 計算結果: (11.4 / 17) * 100 ≈ 67.06%
    const expected_percentage = 67.05882352941176;
    expect(
      result.comparative_analysis.time_difference_percentage
    ).toBeCloseTo(expected_percentage, 2);

    // 分析結果サマリーの確認
    expect(result.analysis_summary).toBeDefined();
    expect(result.analysis_summary.finding).toBe(
      '新人査定員の平均査定時間は経験者査定員より11.4分（67.06%）長い'
    );
    expect(result.analysis_summary.capability_gap_identified).toBe(true);
  });
});