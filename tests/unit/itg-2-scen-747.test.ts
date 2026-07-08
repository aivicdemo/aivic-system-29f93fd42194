import { recordAuditTrailForJudgmentConfirmation } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  test('SCEN-747: [error] 監査証跡記録機能 - 判定者情報が取得できないとき記録処理がエラーとなり確定が保留される', () => {
    // 判定者情報取得がnullを返す場合
    const assessment_id = 'ASS-2024-001';
    const judgment_content = '相場内で適切';
    const judgment_basis_data = {
      deviation_rate: 3.5,
      deviation_amount: 15000,
      reference_count: 42,
      price_book_source: '物価本2024年版',
      applied_correction_factor: 1.02
    };
    const assessor_info = null;
    const judgment_timestamp = '2024-01-15T11:30:00Z';

    const result = recordAuditTrailForJudgmentConfirmation({
      assessment_id,
      judgment_content,
      judgment_basis_data,
      assessor_info,
      judgment_timestamp
    });

    // エラーが発生し、確定状態が保留のままである
    expect(result.error).toBe(true);
    expect(result.error_type).toBe('assessor_info_retrieval_failed');
    expect(result.confirmation_status).toBe('pending');
    expect(result.error_message).toMatch(/判定者情報/);
    
    // 監査証跡にエラー情報が記録されている
    expect(result.audit_trail_record).toEqual({
      assessment_id: 'ASS-2024-001',
      event_type: 'judgment_confirmation_attempted',
      status: 'error',
      error_reason: 'assessor_info_retrieval_failed',
      judgment_content: '相場内で適切',
      judgment_basis_data: {
        deviation_rate: 3.5,
        deviation_amount: 15000,
        reference_count: 42,
        price_book_source: '物価本2024年版',
        applied_correction_factor: 1.02
      },
      assessor_id: null,
      assessor_name: null,
      judgment_timestamp: '2024-01-15T11:30:00Z',
      recorded_timestamp: expect.any(String),
      error_detail: expect.stringContaining('判定者情報')
    });

    // エラーログに判定者情報取得失敗が記録されている
    expect(result.error_log).toEqual({
      log_level: 'ERROR',
      message: expect.stringContaining('判定者情報'),
      assessment_id: 'ASS-2024-001',
      error_code: 'ASSESSOR_INFO_NULL',
      timestamp: expect.any(String)
    });

    // 確定状態が保留のままである
    expect(result.confirmation_state_after_error).toBe('pending');
    expect(result.record_persisted).toBe(false);
  });

  test('SCEN-747: [error] 監査証跡記録機能 - 判定者情報取得時に例外が発生する場合も同様にエラーハンドリングされる', () => {
    // 判定者情報取得時に例外が発生する場合
    const assessment_id = 'ASS-2024-002';
    const judgment_content = '要相談・修正指示';
    const judgment_basis_data = {
      deviation_rate: -12.8,
      deviation_amount: -58000,
      reference_count: 18,
      price_book_source: '物価本2024年版',
      applied_correction_factor: 0.98
    };
    const assessor_info_error = new Error('Database connection failed');
    const judgment_timestamp = '2024-01-15T14:45:00Z';

    // 関数が例外を適切にキャッチしてエラーオブジェクトを返す
    const result = recordAuditTrailForJudgmentConfirmation({
      assessment_id,
      judgment_content,
      judgment_basis_data,
      assessor_info: assessor_info_error,
      judgment_timestamp
    });

    expect(result.error).toBe(true);
    expect(result.error_type).toBe('assessor_info_retrieval_exception');
    expect(result.confirmation_status).toBe('pending');
    expect(result.error_message).toMatch(/判定者情報/);
    
    // 監査証跡にエラー情報が記録されている
    expect(result.audit_trail_record.status).toBe('error');
    expect(result.audit_trail_record.error_reason).toBe('assessor_info_retrieval_exception');
    expect(result.audit_trail_record.error_detail).toMatch(/Database/);

    // エラーログに記録されている
    expect(result.error_log.log_level).toBe('ERROR');
    expect(result.error_log.error_code).toBe('ASSESSOR_INFO_EXCEPTION');

    // 確定状態が保留のままである
    expect(result.confirmation_state_after_error).toBe('pending');
  });

  test('SCEN-747: [success] 判定者情報が正常に取得できる場合、記録処理が成功し確定状態が確定に変わる', () => {
    // 判定者情報が正常に取得できる場合
    const assessment_id = 'ASS-2024-003';
    const judgment_content = '適切';
    const judgment_basis_data = {
      deviation_rate: 2.1,
      deviation_amount: 9500,
      reference_count: 156,
      price_book_source: '物価本2024年版',
      applied_correction_factor: 1.01
    };
    const assessor_info = {
      assessor_id: 'ASR-000042',
      assessor_name: '山田太郎',
      department: '査定部',
      qualification_level: 'senior'
    };
    const judgment_timestamp = '2024-01-15T09:15:00Z';

    const result = recordAuditTrailForJudgmentConfirmation({
      assessment_id,
      judgment_content,
      judgment_basis_data,
      assessor_info,
      judgment_timestamp
    });

    // エラーが発生していない
    expect(result.error).toBe(false);
    expect(result.error_type).toBe(null);
    expect(result.confirmation_status).toBe('confirmed');

    // 監査証跡が正常に記録されている
    expect(result.audit_trail_record).toEqual({
      assessment_id: 'ASS-2024-003',
      event_type: 'judgment_confirmation_recorded',
      status: 'success',
      error_reason: null,
      judgment_content: '適切',
      judgment_basis_data: {
        deviation_rate: 2.1,
        deviation_amount: 9500,
        reference_count: 156,
        price_book_source: '物価本2024年版',
        applied_correction_factor: 1.01
      },
      assessor_id: 'ASR-000042',
      assessor_name: '山田太郎',
      judgment_timestamp: '2024-01-15T09:15:00Z',
      recorded_timestamp: expect.any(String),
      error_detail: null
    });

    // エラーログが生成されていない
    expect(result.error_log).toBe(null);

    // 確定状態が「確定」に変わっている
    expect(result.confirmation_state_after_error).toBe('confirmed');
    expect(result.record_persisted).toBe(true);
  });

  test('SCEN-747: [validation] 必須フィールド（assessment_id）が空の場合、バリデーションエラーとして扱われる', () => {
    const assessment_id = '';
    const judgment_content = '適切';
    const judgment_basis_data = {
      deviation_rate: 1.5,
      deviation_amount: 7000,
      reference_count: 89,
      price_book_source: '物価本2024年版',
      applied_correction_factor: 1.0
    };
    const assessor_info = {
      assessor_id: 'ASR-000043',
      assessor_name: '鈴木花子',
      department: '査定部',
      qualification_level: 'mid'
    };
    const judgment_timestamp = '2024-01-15T10:00:00Z';

    const result = recordAuditTrailForJudgmentConfirmation({
      assessment_id,
      judgment_content,
      judgment_basis_data,
      assessor_info,
      judgment_timestamp
    });

    // バリデーションエラーとして記録される
    expect(result.error).toBe(true);
    expect(result.error_type).toBe('validation_error');
    expect(result.error_message).toMatch(/assessment_id/);
    expect(result.confirmation_status).toBe('pending');
  });
});