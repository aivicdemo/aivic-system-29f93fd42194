import { recordImprovementImplementationWithContinuedAudit } from '../../src/logic/it-6-3-1';

describe('改善対策実装中の査定業務継続とリスク最小化機能', () => {
  test('SCEN-1264: [normal] 改善対策実装中も査定業務が中断されず継続し、実装中の精度低下による品質への影響が最小化される', () => {
    // 前提条件: 改善対策実装開始前の初期状態
    const implementation_id = 'IMP-2024-001';
    const audit_session_id = 'AUDIT-2024-001';
    const start_timestamp = new Date('2024-02-15T09:00:00Z');
    const baseline_ocr_accuracy = 0.945;
    const baseline_ai_judgment_accuracy = 0.920;
    const baseline_avg_processing_time_sec = 180;

    // 改善対策実装状況の設定
    const implementation_status_before = {
      implementation_id,
      status: 'pending',
      implementation_content: 'Learning data update and model retraining',
      start_time: start_timestamp,
      estimated_duration_minutes: 120,
      impact_area: 'OCR_MODEL',
    };

    // 改善対策を「実装中」状態に変更
    const implementation_status_active = {
      ...implementation_status_before,
      status: 'in_progress',
      actual_start_time: start_timestamp,
    };

    // 実装中に投入される複数の査定案件
    const audit_cases_during_implementation = [
      {
        case_id: 'CASE-2024-0001',
        submission_time: new Date('2024-02-15T09:05:00Z'),
        quote_amount: 5000000,
        work_type: '建築工事',
        region: '東京都',
      },
      {
        case_id: 'CASE-2024-0002',
        submission_time: new Date('2024-02-15T09:10:00Z'),
        quote_amount: 8500000,
        work_type: '土木工事',
        region: '神奈川県',
      },
      {
        case_id: 'CASE-2024-0003',
        submission_time: new Date('2024-02-15T09:15:00Z'),
        quote_amount: 3200000,
        work_type: '機械工事',
        region: '埼玉県',
      },
    ];

    // 実装中の査定処理結果（精度低下を含む）
    const audit_results_during_implementation = [
      {
        case_id: 'CASE-2024-0001',
        ocr_accuracy: 0.923,
        ai_judgment_accuracy: 0.895,
        processing_time_sec: 195,
        deviation_rate_percent: 8.5,
        quality_flag: 'HIGH_RISK',
        auto_review_triggered: true,
      },
      {
        case_id: 'CASE-2024-0002',
        ocr_accuracy: 0.931,
        ai_judgment_accuracy: 0.903,
        processing_time_sec: 188,
        deviation_rate_percent: 6.2,
        quality_flag: 'MEDIUM_RISK',
        auto_review_triggered: true,
      },
      {
        case_id: 'CASE-2024-0003',
        ocr_accuracy: 0.938,
        ai_judgment_accuracy: 0.910,
        processing_time_sec: 182,
        deviation_rate_percent: 5.1,
        quality_flag: 'NORMAL',
        auto_review_triggered: false,
      },
    ];

    // リスク最小化機能の状態確認
    const risk_mitigation_active = true;
    const auto_review_queue_count = 2;
    const flagged_cases = audit_results_during_implementation.filter(
      (result) => result.quality_flag !== 'NORMAL'
    );

    // 実装中の品質管理ダッシュボード指標
    const quality_dashboard_during_implementation = {
      avg_ocr_accuracy_during_impl: 0.931,
      avg_ai_judgment_accuracy_during_impl: 0.903,
      accuracy_degradation_ocr_percent: (
        ((baseline_ocr_accuracy - 0.931) / baseline_ocr_accuracy) *
        100
      ).toFixed(2),
      accuracy_degradation_ai_percent: (
        ((baseline_ai_judgment_accuracy - 0.903) / baseline_ai_judgment_accuracy) *
        100
      ).toFixed(2),
      avg_processing_time_during_impl: 188,
      high_risk_cases_count: flagged_cases.filter(
        (c) => c.quality_flag === 'HIGH_RISK'
      ).length,
      medium_risk_cases_count: flagged_cases.filter(
        (c) => c.quality_flag === 'MEDIUM_RISK'
      ).length,
    };

    // システムログから業務中断の有無を確認
    const business_continuity_log = {
      cases_submitted_during_implementation: 3,
      cases_processed_during_implementation: 3,
      business_interruption_detected: false,
      processing_queue_maintained: true,
      alert_notifications_sent: flagged_cases.length,
    };

    // 改善対策実装完了
    const implementation_completion_time = new Date('2024-02-15T11:00:00Z');
    const implementation_status_completed = {
      ...implementation_status_active,
      status: 'completed',
      actual_completion_time: implementation_completion_time,
    };

    // 実装完了後の査定精度指標（改善効果を検証）
    const audit_results_after_implementation = [
      {
        case_id: 'CASE-2024-0004',
        ocr_accuracy: 0.952,
        ai_judgment_accuracy: 0.928,
        processing_time_sec: 175,
        deviation_rate_percent: 4.1,
        quality_flag: 'NORMAL',
        auto_review_triggered: false,
      },
      {
        case_id: 'CASE-2024-0005',
        ocr_accuracy: 0.948,
        ai_judgment_accuracy: 0.925,
        processing_time_sec: 177,
        deviation_rate_percent: 4.5,
        quality_flag: 'NORMAL',
        auto_review_triggered: false,
      },
      {
        case_id: 'CASE-2024-0006',
        ocr_accuracy: 0.955,
        ai_judgment_accuracy: 0.932,
        processing_time_sec: 173,
        deviation_rate_percent: 3.8,
        quality_flag: 'NORMAL',
        auto_review_triggered: false,
      },
    ];

    // 実装前後の精度改善度の計算
    const avg_ocr_accuracy_after_impl = 0.952;
    const avg_ai_judgment_accuracy_after_impl = 0.928;
    const ocr_improvement_rate = (
      ((avg_ocr_accuracy_after_impl - baseline_ocr_accuracy) /
        baseline_ocr_accuracy) *
      100
    ).toFixed(2);
    const ai_improvement_rate = (
      ((avg_ai_judgment_accuracy_after_impl - baseline_ai_judgment_accuracy) /
        baseline_ai_judgment_accuracy) *
      100
    ).toFixed(2);

    // テスト対象関数への入力
    const input_payload = {
      implementation_id,
      audit_session_id,
      implementation_status: implementation_status_active,
      baseline_metrics: {
        ocr_accuracy: baseline_ocr_accuracy,
        ai_judgment_accuracy: baseline_ai_judgment_accuracy,
        avg_processing_time_sec: baseline_avg_processing_time_sec,
      },
      audit_cases_to_process: audit_cases_during_implementation,
      audit_results: audit_results_during_implementation,
      risk_mitigation_enabled: risk_mitigation_active,
      implementation_completion_status: implementation_status_completed,
      audit_results_post_implementation: audit_results_after_implementation,
    };

    // テスト対象関数を実行
    const result = recordImprovementImplementationWithContinuedAudit(
      input_payload
    );

    // 期待結果の検証
    expect(result.implementation_id).toBe(implementation_id);
    expect(result.audit_session_id).toBe(audit_session_id);

    // 改善対策状態の遷移確認
    expect(result.implementation_status_history).toEqual([
      expect.objectContaining({
        status: 'pending',
        timestamp: start_timestamp.toISOString(),
      }),
      expect.objectContaining({
        status: 'in_progress',
        timestamp: start_timestamp.toISOString(),
      }),
      expect.objectContaining({
        status: 'completed',
        timestamp: implementation_completion_time.toISOString(),
      }),
    ]);

    // 業務継続の確認：投入された3件がすべて処理されたこと
    expect(result.cases_submitted_count).toBe(3);
    expect(result.cases_processed_count).toBe(3);
    expect(result.business_continuity_maintained).toBe(true);
    expect(result.business_interruption_detected).toBe(false);

    // リスク最小化機能の動作確認
    expect(result.risk_mitigation_active).toBe(true);
    expect(result.auto_review_queue_count).toBe(2);
    expect(result.high_risk_flagged_cases_count).toBe(1);
    expect(result.medium_risk_flagged_cases_count).toBe(1);
    expect(result.normal_quality_cases_count).toBe(1);

    // 実装中の精度低下の検証
    expect(result.ocr_accuracy_degradation_percent).toBe('1.48');
    expect(result.ai_judgment_accuracy_degradation_percent).toBe('1.85');
    expect(result.accuracy_degradation_within_tolerance).toBe(true);

    // 実装中の処理時間の検証
    expect(result.avg_processing_time_during_impl_sec).toBe(188);
    expect(
      result.processing_time_increase_percent
    ).toBeCloseTo(4.44, 1);

    // システムログから業務中断がないことを確認
    expect(result.processing_queue_maintained).toBe(true);
    expect(result.alert_notifications_count).toBe(2);

    // 実装完了後の精度改善効果の検証
    expect(result.ocr_accuracy_after_implementation).toBe(0.952);
    expect(result.ai_judgment_accuracy_after_implementation).toBe(0.928);
    expect(result.ocr_improvement_rate_percent).toBe('0.74');
    expect(result.ai_improvement_rate_percent).toBe('0.87');
    expect(result.improvement_effective).toBe(true);

    // 実装完了後のケースがすべて正常品質であることを確認
    expect(result.post_implementation_high_risk_count).toBe(0);
    expect(result.post_implementation_medium_risk_count).toBe(0);
    expect(result.post_implementation_normal_quality_count).toBe(3);

    // 実装の成功判定
    expect(result.implementation_success).toBe(true);
    expect(result.risk_mitigation_effective).toBe(true);
    expect(result.business_continuity_achieved).toBe(true);

    // 監査ログ記録の確認
    expect(result.audit_log_recorded).toBe(true);
    expect(result.audit_log_entry).toEqual(
      expect.objectContaining({
        implementation_id,
        audit_session_id,
        event_type: 'IMPROVEMENT_IMPLEMENTATION_WITH_CONTINUITY',
        implementation_status_transition: 'pending→in_progress→completed',
        cases_processed_during_implementation: 3,
        business_interruption_detected: false,
        risk_mitigation_effective: true,
        implementation_successful: true,
        timestamp: expect.any(String),
      })
    );
  });
});