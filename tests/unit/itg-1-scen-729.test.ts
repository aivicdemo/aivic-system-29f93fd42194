import { validateSalesDataForReporting } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ最終検証・レポート生成可否判定機能', () => {
  test('SCEN-729: 確定済みデータに複数の欠落項目が検出され、修正指示が発行される', () => {
    // 入力: 確定済みステータスのデータレコード（複数の欠落項目を含む）
    const input_sales_data = {
      record_id: 'REC-20240125-001',
      customer_id: 'CUST-ABC123',
      service_id: 'SVC-SALES001',
      status: 'confirmed',
      // 必須項目の欠落
      appointment_count: undefined, // 欠落: アポ数
      contract_count: undefined,    // 欠落: 成約数
      contact_date: '2024-01-15',
      feedback_type: '', // 欠落: 顧客反応タイプ
      sales_amount: 150000,
      comments: 'test data',
      created_at: '2024-01-15T09:00:00Z',
      created_by: 'SALES-001'
    };

    // 実行
    const result = validateSalesDataForReporting(input_sales_data);

    // 期待結果: 検証失敗、複数の欠落項目を検出
    expect(result.is_valid).toBe(false);
    expect(result.status).toBe('validation_failed');

    // 欠落項目の数（3項目）
    expect(result.missing_fields.length).toBe(3);
    expect(result.missing_fields).toContain('appointment_count');
    expect(result.missing_fields).toContain('contract_count');
    expect(result.missing_fields).toContain('feedback_type');

    // エラーメッセージが生成されていること
    expect(result.error_message).toMatch(/欠落/);
    expect(result.error_message).toMatch(/修正/);

    // 修正指示レポートが生成されていること
    expect(result.correction_report).toBeDefined();
    expect(result.correction_report.missing_items_count).toBe(3);
    expect(result.correction_report.missing_items_detail).toBeDefined();
    expect(result.correction_report.missing_items_detail.length).toBe(3);

    // 修正指示の詳細内容を検証
    const missing_items_detail = result.correction_report.missing_items_detail;
    const appointment_issue = missing_items_detail.find((item: any) => item.field_name === 'appointment_count');
    expect(appointment_issue).toBeDefined();
    expect(appointment_issue.field_label).toBe('アポ数');
    expect(appointment_issue.requirement_type).toBe('required');

    const contract_issue = missing_items_detail.find((item: any) => item.field_name === 'contract_count');
    expect(contract_issue).toBeDefined();
    expect(contract_issue.field_label).toBe('成約数');

    const feedback_issue = missing_items_detail.find((item: any) => item.field_name === 'feedback_type');
    expect(feedback_issue).toBeDefined();
    expect(feedback_issue.field_label).toBe('顧客反応タイプ');

    // 修正対象者・期限情報が含まれていること
    expect(result.correction_report.assignee_id).toBeDefined();
    expect(result.correction_report.assignee_id).toBe('SALES-001');
    expect(result.correction_report.deadline).toBeDefined();

    // 修正指示の発行状態
    expect(result.correction_report.issued).toBe(true);
    expect(result.correction_report.issued_at).toBeDefined();

    // システムログ記録の確認: レポート生成対象外に分類
    expect(result.report_eligible).toBe(false);
    expect(result.reason_for_exclusion).toMatch(/欠落/);

    // 最終確定ステータスが保留中であること
    expect(result.finalization_status).toBe('pending_correction');
    expect(result.can_generate_report).toBe(false);
  });
});