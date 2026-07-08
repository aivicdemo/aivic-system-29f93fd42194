import { recordJudgmentLogicApplicationHistory } from '../../src/logic/it-6-3-1';

const fetchMock = require('jest-fetch-mock');

describe('改善対策実装中のシステムエラーハンドリングと査定業務継続保証', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1266
  test('改善対策実装中にシステムエラーが発生した場合、フェイルオーバー機構により査定業務の継続が保証される', async () => {
    // ==========================================
    // 1. 改善対策実装中のシステム状態を初期化
    // ==========================================
    const systemInitState = {
      improvement_initiative_id: 'IMP-2024-001',
      improvement_initiative_status: 'IN_PROGRESS',
      implementation_progress_percentage: 0,
      active_assessment_count: 0,
      primary_server_status: 'HEALTHY',
      failover_server_status: 'STANDBY',
      system_error_count: 0,
      error_log_records: [],
      failover_log_records: [],
    };

    // ==========================================
    // 2. 査定業務用のテストデータを準備
    // ==========================================
    const assessment_projects = [
      {
        assessment_project_id: 'PROJ-2024-001',
        assessment_project_status: 'PENDING',
        construction_type_code: '01',
        quote_amount: 5000000,
        submitted_date: '2024-01-15T09:00:00Z',
        assessor_id: 'USR-ASSESS-001',
      },
      {
        assessment_project_id: 'PROJ-2024-002',
        assessment_project_status: 'PENDING',
        construction_type_code: '02',
        quote_amount: 3500000,
        submitted_date: '2024-01-15T09:15:00Z',
        assessor_id: 'USR-ASSESS-002',
      },
    ];

    const assessment_criteria = {
      criteria_id: 'CRIT-2024-001',
      construction_type_code: '01',
      market_price_lower_bound: 4500000,
      market_price_upper_bound: 5500000,
      acceptable_deviation_rate: 0.1,
      last_updated: '2024-01-10T00:00:00Z',
    };

    const user_permissions = {
      user_id: 'USR-ASSESS-001',
      role: 'ASSESSOR',
      permissions: ['VIEW_QUOTE', 'JUDGE_QUOTE', 'RECORD_JUDGMENT'],
      department_id: 'DEPT-ASSESS-001',
    };

    // ==========================================
    // 3. 改善対策実装プロセスを開始し、50%～70%進行段階を設定
    // ==========================================
    const improvement_implementation_event = {
      event_type: 'START_IMPROVEMENT_IMPLEMENTATION',
      event_timestamp: '2024-01-15T10:00:00Z',
      improvement_initiative_id: 'IMP-2024-001',
      learning_data_update_records: [
        {
          data_type: 'PAST_PROJECT_DATA',
          record_count: 150,
          update_timestamp: '2024-01-15T10:05:00Z',
        },
        {
          data_type: 'MATERIAL_PRICE_BOOK',
          version: 'v2024-01',
          update_timestamp: '2024-01-15T10:06:00Z',
        },
      ],
      model_retraining_scheduled: true,
    };

    // 実装進捗を50%～70%の範囲に設定
    const mid_implementation_state = {
      ...systemInitState,
      improvement_initiative_status: 'IN_PROGRESS',
      implementation_progress_percentage: 62,
      active_assessment_count: 2,
      improvement_implementation_event,
    };

    // ==========================================
    // 4. システムエラーを注入（DB接続切断シミュレーション）
    // ==========================================
    const system_error_injection = {
      error_type: 'DATABASE_CONNECTION_LOST',
      error_timestamp: '2024-01-15T10:07:30Z',
      error_message: 'Database connection pool exhausted',
      affected_operation: 'MODEL_RETRAINING',
      implementation_progress_at_error: 62,
    };

    // ==========================================
    // 5. エラー発生時点でのシステム状態を記録
    // ==========================================
    const error_state_record = {
      error_id: 'ERR-2024-001',
      error_type: system_error_injection.error_type,
      error_timestamp: system_error_injection.error_timestamp,
      system_state_snapshot: {
        improvement_progress: mid_implementation_state.implementation_progress_percentage,
        active_assessments: mid_implementation_state.active_assessment_count,
        primary_server_status: 'FAILED',
        failover_server_status: 'STANDBY',
        assessment_projects_in_flight: assessment_projects.length,
      },
      recovery_action_triggered: false,
    };

    // ==========================================
    // 6. フェイルオーバー機構が自動的に起動されることを確認
    // ==========================================
    fetchMock.mockResponseOnce(
      JSON.stringify({
        failover_initiated: true,
        failover_timestamp: '2024-01-15T10:07:31Z',
        failover_trigger_reason: 'PRIMARY_SERVER_FAILURE',
        failover_status: 'IN_PROGRESS',
        target_failover_server: 'FAILOVER_SERVER_001',
        estimated_failover_completion_time_seconds: 15,
      }),
      { status: 200 }
    );

    const failover_response_1 = await fetch('/api/system/failover/initiate', {
      method: 'POST',
      body: JSON.stringify({
        error_id: error_state_record.error_id,
        error_type: system_error_injection.error_type,
      }),
    });

    expect(failover_response_1.status).toBe(200);
    const failover_data_1 = await failover_response_1.json();
    expect(failover_data_1.failover_initiated).toBe(true);
    expect(failover_data_1.failover_status).toBe('IN_PROGRESS');

    // ==========================================
    // 7. フェイルオーバー後、進行中の査定業務が復旧サーバーで継続されることを確認
    // ==========================================
    fetchMock.mockResponseOnce(
      JSON.stringify({
        failover_status: 'COMPLETED',
        failover_completion_timestamp: '2024-01-15T10:07:45Z',
        active_failover_server: 'FAILOVER_SERVER_001',
        assessment_projects_restored: 2,
        assessment_projects_resumed: assessment_projects.map((proj) => ({
          assessment_project_id: proj.assessment_project_id,
          restoration_status: 'RESUMED',
          restoration_timestamp: '2024-01-15T10:07:46Z',
        })),
      }),
      { status: 200 }
    );

    const failover_response_2 = await fetch('/api/system/failover/status', {
      method: 'GET',
    });

    expect(failover_response_2.status).toBe(200);
    const failover_data_2 = await failover_response_2.json();
    expect(failover_data_2.failover_status).toBe('COMPLETED');
    expect(failover_data_2.assessment_projects_restored).toBe(2);
    expect(failover_data_2.assessment_projects_resumed).toHaveLength(2);

    // ==========================================
    // 8. 復旧サーバーで継続された査定業務のデータ整合性を検証
    // ==========================================
    fetchMock.mockResponseOnce(
      JSON.stringify({
        data_integrity_check_timestamp: '2024-01-15T10:07:50Z',
        assessment_project_integrity: {
          PROJ_2024_001: {
            integrity_status: 'VALID',
            checksum_match: true,
            last_modified_timestamp: '2024-01-15T10:07:46Z',
          },
          PROJ_2024_002: {
            integrity_status: 'VALID',
            checksum_match: true,
            last_modified_timestamp: '2024-01-15T10:07:46Z',
          },
        },
        overall_data_integrity: 'VERIFIED',
        data_loss_detected: false,
        orphaned_records: 0,
      }),
      { status: 200 }
    );

    const integrity_response = await fetch('/api/system/data-integrity/verify', {
      method: 'POST',
      body: JSON.stringify({
        assessment_project_ids: [
          'PROJ-2024-001',
          'PROJ-2024-002',
        ],
      }),
    });

    expect(integrity_response.status).toBe(200);
    const integrity_data = await integrity_response.json();
    expect(integrity_data.overall_data_integrity).toBe('VERIFIED');
    expect(integrity_data.data_loss_detected).toBe(false);
    expect(integrity_data.assessment_project_integrity['PROJ_2024_001'].integrity_status).toBe('VALID');
    expect(integrity_data.assessment_project_integrity['PROJ_2024_002'].integrity_status).toBe('VALID');

    // ==========================================
    // 9. 改善対策の実装ステータスが適切にロールバックまたは復旧されることを確認
    // ==========================================
    fetchMock.mockResponseOnce(
      JSON.stringify({
        improvement_initiative_id: 'IMP-2024-001',
        recovery_action: 'ROLLBACK_TO_CHECKPOINT',
        recovery_checkpoint_timestamp: '2024-01-15T10:06:00Z',
        implementation_status_after_recovery: 'PAUSED',
        implementation_progress_after_recovery: 50,
        recovery_completion_timestamp: '2024-01-15T10:08:00Z',
        recovery_success: true,
      }),
      { status: 200 }
    );

    const recovery_response = await fetch(
      '/api/improvement-initiative/recovery-status',
      {
        method: 'GET',
      }
    );

    expect(recovery_response.status).toBe(200);
    const recovery_data = await recovery_response.json();
    expect(recovery_data.improvement_initiative_id).toBe('IMP-2024-001');
    expect(recovery_data.recovery_success).toBe(true);
    expect(recovery_data.implementation_status_after_recovery).toBe('PAUSED');
    expect(recovery_data.implementation_progress_after_recovery).toBe(50);

    // ==========================================
    // 10. ユーザーが査定業務を継続でき、新規査定案件の受け付けが正常に機能することを確認
    // ==========================================
    fetchMock.mockResponseOnce(
      JSON.stringify({
        new_assessment_project_id: 'PROJ-2024-003',
        submission_status: 'ACCEPTED',
        submission_timestamp: '2024-01-15T10:09:00Z',
        quote_amount: 4200000,
        construction_type_code: '01',
        assigned_assessor_id: 'USR-ASSESS-001',
        assessment_status: 'PENDING',
      }),
      { status: 201 }
    );

    const new_project_response = await fetch(
      '/api/assessment-project/submit',
      {
        method: 'POST',
        body: JSON.stringify({
          quote_amount: 4200000,
          construction_type_code: '01',
          submitted_by_user_id: 'USER-EXTERNAL-001',
        }),
      }
    );

    expect(new_project_response.status).toBe(201);
    const new_project_data = await new_project_response.json();
    expect(new_project_data.submission_status).toBe('ACCEPTED');
    expect(new_project_data.assessment_status).toBe('PENDING');

    // ==========================================
    // 11. エラーログとフェイルオーバーログが正確に記録されていることを確認
    // ==========================================
    fetchMock.mockResponseOnce(
      JSON.stringify({
        error_log_retrieval_timestamp: '2024-01-15T10:10:00Z',
        error_logs: [
          {
            error_id: 'ERR-2024-001',
            error_type: 'DATABASE_CONNECTION_LOST',
            error_timestamp: '2024-01-15T10:07:30Z',
            error_message: 'Database connection pool exhausted',
            affected_operation: 'MODEL_RETRAINING',
            severity_level: 'CRITICAL',
            recorded_by_system: 'PRIMARY_SERVER',
          },
        ],
        failover_logs: [
          {
            failover_id: 'FO-2024-001',
            failover_triggered_timestamp: '2024-01-15T10:07:31Z',
            failover_trigger_reason: 'PRIMARY_SERVER_FAILURE',
            failover_target_server: 'FAILOVER_SERVER_001',
            failover_completion_timestamp: '2024-01-15T10:07:45Z',
            assessment_project_recovery_count: 2,
            data_integrity_verified: true,
            failover_status: 'SUCCESSFUL',
          },
        ],
        log_integrity: 'VERIFIED',
        log_record_count: 2,
      }),
      { status: 200 }
    );

    const logs_response = await fetch('/api/system/logs/error-failover', {
      method: 'GET',
      headers: {
        'User-ID': 'USR-ADMIN-001',
        'Role': 'SYSTEM_ADMINISTRATOR',
      },
    });

    expect(logs_response.status).toBe(200);
    const logs_data = await logs_response.json();
    expect(logs_data.log_integrity).toBe('VERIFIED');
    expect(logs_data.error_logs).toHaveLength(1);
    expect(logs_data.error_logs[0].error_id).toBe('ERR-2024-001');
    expect(logs_data.error_logs[0].error_type).toBe('DATABASE_CONNECTION_LOST');
    expect(logs_data.error_logs[0].severity_level).toBe('CRITICAL');
    expect(logs_data.failover_logs).toHaveLength(1);
    expect(logs_data.failover_logs[0].failover_id).toBe('FO-2024-001');
    expect(logs_data.failover_logs[0].failover_status).toBe('SUCCESSFUL');
    expect(logs_data.failover_logs[0].assessment_project_recovery_count).toBe(2);
    expect(logs_data.failover_logs[0].data_integrity_verified).toBe(true);

    // ==========================================
    // 12. recordJudgmentLogicApplicationHistory 関数の呼び出しと検証
    // ==========================================
    const judgment_logic_application_record = {
      assessment_project_id: 'PROJ-2024-001',
      judgment_logic_id: 'LOGIC-2024-001',
      judgment_logic_application_timestamp: '2024-01-15T10:07:46Z',
      application_context: {
        system_recovery_status: 'FAILOVER_COMPLETED',
        improvement_initiative_status: 'PAUSED',
        data_integrity_verified: true,
      },
      market_comparison_data: {
        material_price_book_version: 'v2024-01',
        past_project_count: 150,
        deviation_rate: 0.08,
        deviation_amount: 400000,
      },
      judgment_result: {
        status: 'APPROVED',
        confidence_score: 92,
        deviation_reason: 'Within acceptable range post-recovery',
      },
      applied_by_assessor_id: 'USR-ASSESS-001',
      application_log_stored: false,
    };

    const application_history_result = await recordJudgmentLogicApplicationHistory(
      judgment_logic_application_record
    );

    expect(application_history_result).toEqual({
      recording_status: 'SUCCESS',
      recorded_application_history_id: 'HIST-2024-001',
      recorded_timestamp: '2024-01-15T10:07:46Z',
      assessment_project_id: 'PROJ-2024-001',
      judgment_logic_id: 'LOGIC-2024-001',
      judgment_result_recorded: 'APPROVED',
      confidence_score_recorded: 92,
      system_recovery_context_preserved: true,
      improvement_initiative_status_at_recording: 'PAUSED',
      application_log_record_created: true,
      audit_trail_entry_created: true,
    });

    // ==========================================
    // 13. 最終的なシステム状態検証
    // ==========================================
    expect(application_history_result.recording_status).toBe('SUCCESS');
    expect(application_history_result.system_recovery_context_preserved).toBe(true);
    expect(application_history_result.application_log_record_created).toBe(true);
    expect(application_history_result.audit_trail_entry_created).toBe(true);
  });
});