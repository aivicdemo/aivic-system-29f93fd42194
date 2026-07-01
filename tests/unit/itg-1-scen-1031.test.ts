import { validateAndDetermineReportApproval } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-1031: [normal] 検証結果レポートの承認・差戻し判定 - 検証結果に基づいてレポート生成進行の判定が正確に実行される
  test('検証結果レポート生成時に承認・差戻し判定が正確に実行され、各判定に応じた処理が正常に連携される', () => {
    // ハッピーパス: 検証完了・承認パターン
    const valid_result_approve = validateAndDetermineReportApproval({
      validation_status: 'PASSED',
      sales_data: {
        customer_id: 'CUST001',
        service_type: 'SERVICE_A',
        appointment_count: 5,
        contract_count: 2,
        customer_feedback: 'positive',
        contact_date: '2024-01-15',
        amount: 50000,
      },
      validation_rules: {
        required_fields: ['customer_id', 'service_type', 'appointment_count', 'contract_count', 'contact_date'],
        data_type_checks: { appointment_count: 'number', contract_count: 'number', amount: 'number' },
        range_checks: { appointment_count: { min: 0, max: 100 }, amount: { min: 0, max: 1000000 } },
      },
      detected_errors: [],
    });

    expect(valid_result_approve.approval_decision).toBe('APPROVED');
    expect(valid_result_approve.proceed_to_billing_automation).toBe(true);
    expect(valid_result_approve.reason).toBe('');
    expect(valid_result_approve.report_status).toBe('READY_FOR_DELIVERY');

    // ハッピーパス: 検証完了・差戻しパターン（データ欠落）
    const valid_result_reject_missing = validateAndDetermineReportApproval({
      validation_status: 'FAILED',
      sales_data: {
        customer_id: 'CUST002',
        service_type: 'SERVICE_B',
        appointment_count: 0,
        contract_count: 0,
        customer_feedback: undefined,
        contact_date: '2024-01-16',
        amount: 30000,
      },
      validation_rules: {
        required_fields: ['customer_id', 'service_type', 'appointment_count', 'contract_count', 'customer_feedback', 'contact_date'],
        data_type_checks: { appointment_count: 'number', contract_count: 'number', amount: 'number' },
        range_checks: { appointment_count: { min: 0, max: 100 }, amount: { min: 0, max: 1000000 } },
      },
      detected_errors: [
        {
          error_type: 'MISSING_REQUIRED_FIELD',
          field_name: 'customer_feedback',
          error_message: '顧客フィードバックが未入力です',
        },
      ],
    });

    expect(valid_result_reject_missing.approval_decision).toBe('REJECTED');
    expect(valid_result_reject_missing.proceed_to_billing_automation).toBe(false);
    expect(valid_result_reject_missing.reason).toContain('顧客フィードバック');
    expect(valid_result_reject_missing.report_status).toBe('PENDING_CORRECTION');

    // ハッピーパス: 検証完了・差戻しパターン（データ型不正）
    const valid_result_reject_type = validateAndDetermineReportApproval({
      validation_status: 'FAILED',
      sales_data: {
        customer_id: 'CUST003',
        service_type: 'SERVICE_C',
        appointment_count: 'five',
        contract_count: 1,
        customer_feedback: 'neutral',
        contact_date: '2024-01-17',
        amount: 40000,
      },
      validation_rules: {
        required_fields: ['customer_id', 'service_type', 'appointment_count', 'contract_count', 'customer_feedback', 'contact_date'],
        data_type_checks: { appointment_count: 'number', contract_count: 'number', amount: 'number' },
        range_checks: { appointment_count: { min: 0, max: 100 }, amount: { min: 0, max: 1000000 } },
      },
      detected_errors: [
        {
          error_type: 'DATA_TYPE_MISMATCH',
          field_name: 'appointment_count',
          error_message: 'アポイント数は数値型である必要があります',
        },
      ],
    });

    expect(valid_result_reject_type.approval_decision).toBe('REJECTED');
    expect(valid_result_reject_type.proceed_to_billing_automation).toBe(false);
    expect(valid_result_reject_type.reason).toContain('アポイント数');
    expect(valid_result_reject_type.report_status).toBe('PENDING_CORRECTION');

    // ハッピーパス: 検証完了・差戻しパターン（値の範囲外）
    const valid_result_reject_range = validateAndDetermineReportApproval({
      validation_status: 'FAILED',
      sales_data: {
        customer_id: 'CUST004',
        service_type: 'SERVICE_D',
        appointment_count: 150,
        contract_count: 5,
        customer_feedback: 'positive',
        contact_date: '2024-01-18',
        amount: 2000000,
      },
      validation_rules: {
        required_fields: ['customer_id', 'service_type', 'appointment_count', 'contract_count', 'customer_feedback', 'contact_date'],
        data_type_checks: { appointment_count: 'number', contract_count: 'number', amount: 'number' },
        range_checks: { appointment_count: { min: 0, max: 100 }, amount: { min: 0, max: 1000000 } },
      },
      detected_errors: [
        {
          error_type: 'VALUE_OUT_OF_RANGE',
          field_name: 'appointment_count',
          error_message: 'アポイント数が許容範囲(0-100)を超えています',
        },
        {
          error_type: 'VALUE_OUT_OF_RANGE',
          field_name: 'amount',
          error_message: '金額が許容範囲(0-1000000)を超えています',
        },
      ],
    });

    expect(valid_result_reject_range.approval_decision).toBe('REJECTED');
    expect(valid_result_reject_range.proceed_to_billing_automation).toBe(false);
    expect(valid_result_reject_range.reason).toContain('アポイント数');
    expect(valid_result_reject_range.reason).toContain('金額');
    expect(valid_result_reject_range.report_status).toBe('PENDING_CORRECTION');

    // ハッピーパス: 複数エラー検出・差戻しパターン
    const valid_result_reject_multiple = validateAndDetermineReportApproval({
      validation_status: 'FAILED',
      sales_data: {
        customer_id: 'CUST005',
        service_type: undefined,
        appointment_count: -5,
        contract_count: 'invalid',
        customer_feedback: 'positive',
        contact_date: '2024-01-19',
        amount: 50000,
      },
      validation_rules: {
        required_fields: ['customer_id', 'service_type', 'appointment_count', 'contract_count', 'customer_feedback', 'contact_date'],
        data_type_checks: { appointment_count: 'number', contract_count: 'number', amount: 'number' },
        range_checks: { appointment_count: { min: 0, max: 100 }, amount: { min: 0, max: 1000000 } },
      },
      detected_errors: [
        {
          error_type: 'MISSING_REQUIRED_FIELD',
          field_name: 'service_type',
          error_message: 'サービス種別が未入力です',
        },
        {
          error_type: 'VALUE_OUT_OF_RANGE',
          field_name: 'appointment_count',
          error_message: 'アポイント数が許容範囲(0-100)を下回っています',
        },
        {
          error_type: 'DATA_TYPE_MISMATCH',
          field_name: 'contract_count',
          error_message: '契約数は数値型である必要があります',
        },
      ],
    });

    expect(valid_result_reject_multiple.approval_decision).toBe('REJECTED');
    expect(valid_result_reject_multiple.proceed_to_billing_automation).toBe(false);
    expect(valid_result_reject_multiple.reason).toContain('サービス種別');
    expect(valid_result_reject_multiple.reason).toContain('アポイント数');
    expect(valid_result_reject_multiple.reason).toContain('契約数');
    expect(valid_result_reject_multiple.report_status).toBe('PENDING_CORRECTION');

    // 承認判定時に差戻し理由フィールドが空になることを確認
    expect(valid_result_approve.reason).toBe('');
    expect(valid_result_approve.reason.length).toBe(0);

    // 差戻し判定時に差戻し理由フィールドが正確に記録されることを確認
    expect(valid_result_reject_missing.reason.length).toBeGreaterThan(0);
    expect(valid_result_reject_type.reason.length).toBeGreaterThan(0);
    expect(valid_result_reject_range.reason.length).toBeGreaterThan(0);
    expect(valid_result_reject_multiple.reason.length).toBeGreaterThan(0);

    // 承認レポートが請求自動化フローに連携されることを確認
    expect(valid_result_approve.proceed_to_billing_automation).toBe(true);
    expect(valid_result_approve.report_status).toBe('READY_FOR_DELIVERY');

    // 差戻しレポートが修正待ちステータスに変更されることを確認
    expect(valid_result_reject_missing.proceed_to_billing_automation).toBe(false);
    expect(valid_result_reject_missing.report_status).toBe('PENDING_CORRECTION');
    expect(valid_result_reject_type.proceed_to_billing_automation).toBe(false);
    expect(valid_result_reject_type.report_status).toBe('PENDING_CORRECTION');
    expect(valid_result_reject_range.proceed_to_billing_automation).toBe(false);
    expect(valid_result_reject_range.report_status).toBe('PENDING_CORRECTION');
    expect(valid_result_reject_multiple.proceed_to_billing_automation).toBe(false);
    expect(valid_result_reject_multiple.report_status).toBe('PENDING_CORRECTION');
  });
});