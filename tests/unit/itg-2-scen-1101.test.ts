import { generateMonthlyAnalysisReport } from '../../src/logic/it-6-2-2-1';

describe('月次分析レポート生成機能', () => {
  test('SCEN-1101: 月末時点で全査定員の査定業務が完了した場合、5営業日以内に月次分析レポートが正常に生成される', async () => {
    // 入力パラメータ: 対象月の月末日付
    const targetMonth = '2024-01-31';
    const assessorCount = 5;
    const totalAssessmentCases = 127;
    const totalAssessmentAmount = 15680000;
    const averageAssessmentTime = 23.5;

    // モック査定員データ
    const assessorData = [
      {
        assessor_id: 'ASS001',
        assessor_name: '査定員A',
        completed_cases: 26,
        assessment_amount: 3250000,
        average_time_minutes: 24.2,
      },
      {
        assessor_id: 'ASS002',
        assessor_name: '査定員B',
        completed_cases: 25,
        assessment_amount: 3100000,
        average_time_minutes: 23.1,
      },
      {
        assessor_id: 'ASS003',
        assessor_name: '査定員C',
        completed_cases: 26,
        assessment_amount: 3350000,
        average_time_minutes: 24.8,
      },
      {
        assessor_id: 'ASS004',
        assessor_name: '査定員D',
        completed_cases: 25,
        assessment_amount: 3180000,
        average_time_minutes: 22.9,
      },
      {
        assessor_id: 'ASS005',
        assessor_name: '査定員E',
        completed_cases: 25,
        assessment_amount: 2800000,
        average_time_minutes: 22.5,
      },
    ];

    // API呼び出しでレポート生成を指示
    const requestPayload = {
      target_month: targetMonth,
      report_type: 'monthly_analysis',
    };

    // レポート生成APIレスポンス
    const generateReportResponse = {
      report_id: 'RPT20240201001',
      status: 'in_progress',
      submitted_at: '2024-02-01T09:00:00Z',
      target_month: targetMonth,
      assessor_count: assessorCount,
      total_cases: totalAssessmentCases,
    };

    // レポート完成時のレスポンス（5営業日以内: 2024-02-08T17:00:00Z）
    const completedReportResponse = {
      report_id: 'RPT20240201001',
      status: 'completed',
      submitted_at: '2024-02-01T09:00:00Z',
      completed_at: '2024-02-08T17:00:00Z',
      business_days_taken: 5,
      target_month: targetMonth,
      report_format: 'PDF',
      report_file_path: '/reports/monthly/RPT20240201001.pdf',
      report_header: {
        generation_date: '2024-02-08',
        target_month_label: '2024年1月',
        data_extraction_datetime: '2024-02-08T17:00:00Z',
      },
      aggregated_statistics: {
        total_assessment_cases: totalAssessmentCases,
        total_assessment_amount: totalAssessmentAmount,
        average_assessment_time_minutes: averageAssessmentTime,
        assessor_statistics: assessorData,
      },
      generation_log: {
        log_id: 'LOG20240208001',
        status: 'success',
        entries: [
          {
            timestamp: '2024-02-01T09:00:00Z',
            action: 'report_generation_initiated',
            details: 'Monthly analysis report generation started',
          },
          {
            timestamp: '2024-02-08T17:00:00Z',
            action: 'report_generation_completed',
            details: 'Monthly analysis report generation completed successfully',
          },
        ],
      },
    };

    // 関数呼び出し
    const result = await generateMonthlyAnalysisReport(requestPayload);

    // アサーション: レポート生成が開始されたことを確認
    expect(result.report_id).toBe('RPT20240201001');
    expect(result.status).toBe('in_progress');
    expect(result.submitted_at).toBe('2024-02-01T09:00:00Z');

    // ポーリングシミュレーション: 生成完了まで待機
    const statusCheckResponse = await generateMonthlyAnalysisReport({
      target_month: targetMonth,
      action: 'check_status',
      report_id: 'RPT20240201001',
    });

    // アサーション: 5営業日以内に完了
    expect(statusCheckResponse.status).toBe('completed');
    expect(statusCheckResponse.completed_at).toBe('2024-02-08T17:00:00Z');
    expect(statusCheckResponse.business_days_taken).toBeLessThanOrEqual(5);

    // アサーション: レポートファイルが指定ディレクトリに保存されている
    expect(statusCheckResponse.report_file_path).toMatch(/^\/reports\/monthly\/RPT20240201001\.pdf$/);
    expect(statusCheckResponse.report_format).toBe('PDF');

    // アサーション: レポートヘッダー情報の検証
    expect(statusCheckResponse.report_header.generation_date).toBe('2024-02-08');
    expect(statusCheckResponse.report_header.target_month_label).toBe('2024年1月');
    expect(statusCheckResponse.report_header.data_extraction_datetime).toBe('2024-02-08T17:00:00Z');

    // アサーション: 集計データの正確性検証
    expect(statusCheckResponse.aggregated_statistics.total_assessment_cases).toBe(127);
    expect(statusCheckResponse.aggregated_statistics.total_assessment_amount).toBe(15680000);
    expect(statusCheckResponse.aggregated_statistics.average_assessment_time_minutes).toBeCloseTo(23.5, 1);

    // アサーション: 査定員別統計の検証
    const stats = statusCheckResponse.aggregated_statistics.assessor_statistics;
    expect(stats).toHaveLength(5);
    expect(stats[0].assessor_id).toBe('ASS001');
    expect(stats[0].completed_cases).toBe(26);
    expect(stats[0].assessment_amount).toBe(3250000);
    expect(stats[0].average_time_minutes).toBeCloseTo(24.2, 1);

    // アサーション: 生成ログが正常に記録されている
    expect(statusCheckResponse.generation_log.log_id).toBe('LOG20240208001');
    expect(statusCheckResponse.generation_log.status).toBe('success');
    expect(statusCheckResponse.generation_log.entries).toHaveLength(2);
    expect(statusCheckResponse.generation_log.entries[0].action).toBe('report_generation_initiated');
    expect(statusCheckResponse.generation_log.entries[1].action).toBe('report_generation_completed');
  });
});