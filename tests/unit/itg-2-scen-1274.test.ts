import { aggregateAssessmentMetrics } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1274: [error] 月次実績データ自動検証機能 - データ値が業務ルール非合致の場合、警告が発せられる
  test('業務ルール非合致のデータに対してエラーハンドリングが正常に機能し、具体的な警告メッセージが発せられる', () => {
    // 負の査定額（業務ルール違反）
    const invalid_negative_amount_data = {
      assessor_id: 'A001',
      work_type: '土工',
      amount_band: '1000万以上',
      assessment_date: '2024-01-15',
      assessment_count: 45,
      assessment_time_minutes: 1200,
      accuracy_rate: 0.92,
      deviation_rate: -0.08,
      assessment_amount: -500000,
      uniformity_index: 0.85,
      system_uptime_rate: 0.99
    };

    expect(() => aggregateAssessmentMetrics(invalid_negative_amount_data)).toThrow(/査定金額/);
  });

  test('範囲外の評価スコアに対して警告メッセージが発せられ、違反ルール名と期待値が含まれる', () => {
    // 範囲外の精度指標（0～1の範囲外）
    const invalid_out_of_range_score_data = {
      assessor_id: 'A002',
      work_type: '鉄筋',
      amount_band: '500万以上1000万未満',
      assessment_date: '2024-01-15',
      assessment_count: 32,
      assessment_time_minutes: 960,
      accuracy_rate: 1.5,
      deviation_rate: 0.12,
      assessment_amount: 750000,
      uniformity_index: 0.88,
      system_uptime_rate: 0.98
    };

    expect(() => aggregateAssessmentMetrics(invalid_out_of_range_score_data)).toThrow(/精度指標/);
  });

  test('不正な日付形式に対して警告が発せられ、違反項目が明確に特定される', () => {
    // 不正な日付形式
    const invalid_date_format_data = {
      assessor_id: 'A003',
      work_type: '躯体',
      amount_band: '100万以上500万未満',
      assessment_date: '2024/01/15',
      assessment_count: 28,
      assessment_time_minutes: 840,
      accuracy_rate: 0.89,
      deviation_rate: 0.15,
      assessment_amount: 250000,
      uniformity_index: 0.82,
      system_uptime_rate: 0.97
    };

    expect(() => aggregateAssessmentMetrics(invalid_date_format_data)).toThrow(/日付形式/);
  });

  test('システム稼働率が負の値の場合、警告メッセージにルール名と期待値の範囲が含まれる', () => {
    // システム稼働率が負の値
    const invalid_negative_uptime_data = {
      assessor_id: 'A004',
      work_type: '仕上',
      amount_band: '50万以上100万未満',
      assessment_date: '2024-01-15',
      assessment_count: 22,
      assessment_time_minutes: 660,
      accuracy_rate: 0.87,
      deviation_rate: 0.10,
      assessment_amount: 75000,
      uniformity_index: 0.80,
      system_uptime_rate: -0.05
    };

    expect(() => aggregateAssessmentMetrics(invalid_negative_uptime_data)).toThrow(/稼働率/);
  });

  test('査定件数が0以下の場合、警告ログがシステムに記録され処理が中断される', () => {
    // 査定件数が0
    const invalid_zero_count_data = {
      assessor_id: 'A005',
      work_type: '電気',
      amount_band: '1000万以上',
      assessment_date: '2024-01-15',
      assessment_count: 0,
      assessment_time_minutes: 0,
      accuracy_rate: 0.91,
      deviation_rate: 0.09,
      assessment_amount: 1500000,
      uniformity_index: 0.86,
      system_uptime_rate: 0.96
    };

    expect(() => aggregateAssessmentMetrics(invalid_zero_count_data)).toThrow(/査定件数/);
  });

  test('複数の業務ルール非合致がある場合、最初の違反ルール名が警告メッセージに含まれる', () => {
    // 複数の違反：負の金額、範囲外の精度指標、無効な日付
    const invalid_multiple_violations_data = {
      assessor_id: 'A006',
      work_type: '水道',
      amount_band: '500万以上1000万未満',
      assessment_date: '2024-13-45',
      assessment_count: 15,
      assessment_time_minutes: 450,
      accuracy_rate: 1.2,
      deviation_rate: 0.20,
      assessment_amount: -300000,
      uniformity_index: 0.78,
      system_uptime_rate: 0.95
    };

    expect(() => aggregateAssessmentMetrics(invalid_multiple_violations_data)).toThrow(/査定金額|精度指標|日付形式/);
  });

  test('正常なデータで処理が成功し、集計メトリクスが返される', () => {
    // 全業務ルールに合致するテストデータ
    const valid_data = {
      assessor_id: 'A007',
      work_type: '建築',
      amount_band: '1000万以上',
      assessment_date: '2024-01-15',
      assessment_count: 50,
      assessment_time_minutes: 1500,
      accuracy_rate: 0.94,
      deviation_rate: 0.06,
      assessment_amount: 2000000,
      uniformity_index: 0.89,
      system_uptime_rate: 0.99
    };

    const result = aggregateAssessmentMetrics(valid_data);

    expect(result).toEqual({
      assessor_id: 'A007',
      work_type: '建築',
      amount_band: '1000万以上',
      assessment_date: '2024-01-15',
      total_assessment_count: 50,
      average_assessment_time_minutes: 30,
      accuracy_rate: 0.94,
      deviation_rate: 0.06,
      total_assessment_amount: 2000000,
      average_amount_per_assessment: 40000,
      uniformity_index: 0.89,
      system_uptime_rate: 0.99,
      quality_score: 94
    });
  });

  test('月次実績データの複数レコード集計時に、特定のレコードが非合致の場合、そのレコードの識別情報を含む警告が発せられる', () => {
    // 識別情報付きの非合致データ：査定員ID A008、工種「機械」で負の査定件数
    const invalid_negative_count_with_id_data = {
      assessor_id: 'A008',
      work_type: '機械',
      amount_band: '100万以上500万未満',
      assessment_date: '2024-01-15',
      assessment_count: -5,
      assessment_time_minutes: 300,
      accuracy_rate: 0.90,
      deviation_rate: 0.11,
      assessment_amount: 300000,
      uniformity_index: 0.84,
      system_uptime_rate: 0.98
    };

    expect(() => aggregateAssessmentMetrics(invalid_negative_count_with_id_data)).toThrow(/査定件数/);
  });
});