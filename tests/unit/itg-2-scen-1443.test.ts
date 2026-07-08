import { recordAuditLogForModification } from '../../src/logic/it-6-2-2-1';

describe('Audit Log Recording for Modification - Empty Content Error Handling', () => {
  // SCEN-1443
  test('should throw error and prevent audit log recording when modification content is empty string', () => {
    const input_empty_modification_content = '';
    const input_assessor_id = 'assessor_001';
    const input_case_id = 'case_20240115_001';
    const input_reason = '相場乖離の根拠が不十分';
    const input_timestamp = '2024-01-15T11:00:00Z';
    const input_original_amount = 1500000;
    const input_corrected_amount = 1400000;

    const audit_log_input = {
      modification_content: input_empty_modification_content,
      assessor_id: input_assessor_id,
      case_id: input_case_id,
      reason: input_reason,
      timestamp: input_timestamp,
      original_amount: input_original_amount,
      corrected_amount: input_corrected_amount,
    };

    expect(() => recordAuditLogForModification(audit_log_input)).toThrow(/修正内容/);
  });

  test('should successfully record audit log when modification content is provided', () => {
    const input_modification_content = '見積金額を市場相場に合わせて修正';
    const input_assessor_id = 'assessor_001';
    const input_case_id = 'case_20240115_001';
    const input_reason = '相場乖離の根拠が十分で修正が妥当';
    const input_timestamp = '2024-01-15T11:00:00Z';
    const input_original_amount = 1500000;
    const input_corrected_amount = 1400000;

    const audit_log_input = {
      modification_content: input_modification_content,
      assessor_id: input_assessor_id,
      case_id: input_case_id,
      reason: input_reason,
      timestamp: input_timestamp,
      original_amount: input_original_amount,
      corrected_amount: input_corrected_amount,
    };

    const result = recordAuditLogForModification(audit_log_input);

    expect(result.is_recorded).toBe(true);
    expect(result.audit_log_id).toBeDefined();
    expect(result.modification_content).toBe(input_modification_content);
    expect(result.assessor_id).toBe(input_assessor_id);
    expect(result.case_id).toBe(input_case_id);
    expect(result.reason).toBe(input_reason);
    expect(result.timestamp).toBe(input_timestamp);
    expect(result.original_amount).toBe(input_original_amount);
    expect(result.corrected_amount).toBe(input_corrected_amount);
    expect(result.amendment_ratio).toBe(6.67);
  });

  test('should record system error log when empty modification content causes recording failure', () => {
    const input_empty_modification_content = '';
    const input_assessor_id = 'assessor_001';
    const input_case_id = 'case_20240115_001';
    const input_reason = '相場乖離の根拠が不十分';
    const input_timestamp = '2024-01-15T11:00:00Z';
    const input_original_amount = 1500000;
    const input_corrected_amount = 1400000;

    const audit_log_input = {
      modification_content: input_empty_modification_content,
      assessor_id: input_assessor_id,
      case_id: input_case_id,
      reason: input_reason,
      timestamp: input_timestamp,
      original_amount: input_original_amount,
      corrected_amount: input_corrected_amount,
    };

    let error_occurred = false;
    let error_message = '';

    try {
      recordAuditLogForModification(audit_log_input);
    } catch (error) {
      error_occurred = true;
      error_message = (error as Error).message;
    }

    expect(error_occurred).toBe(true);
    expect(error_message).toMatch(/修正内容は必須です/);
  });

  test('should not record audit log entry in database when modification content is empty', () => {
    const input_empty_modification_content = '';
    const input_assessor_id = 'assessor_001';
    const input_case_id = 'case_20240115_001';
    const input_reason = '相場乖離の根拠が不十分';
    const input_timestamp = '2024-01-15T11:00:00Z';
    const input_original_amount = 1500000;
    const input_corrected_amount = 1400000;

    const audit_log_input = {
      modification_content: input_empty_modification_content,
      assessor_id: input_assessor_id,
      case_id: input_case_id,
      reason: input_reason,
      timestamp: input_timestamp,
      original_amount: input_original_amount,
      corrected_amount: input_corrected_amount,
    };

    try {
      recordAuditLogForModification(audit_log_input);
    } catch (error) {
      // Expected error for empty content
    }

    const result = recordAuditLogForModification(audit_log_input);

    expect(result.is_recorded).toBe(false);
    expect(result.audit_log_id).toBeNull();
    expect(result.error_status).toBe('validation_failed');
  });

  test('should accept modification content with whitespace trimming', () => {
    const input_modification_content = '  見積金額を市場相場に合わせて修正  ';
    const input_assessor_id = 'assessor_001';
    const input_case_id = 'case_20240115_001';
    const input_reason = '相場乖離の根拠が十分で修正が妥当';
    const input_timestamp = '2024-01-15T11:00:00Z';
    const input_original_amount = 1500000;
    const input_corrected_amount = 1400000;

    const audit_log_input = {
      modification_content: input_modification_content,
      assessor_id: input_assessor_id,
      case_id: input_case_id,
      reason: input_reason,
      timestamp: input_timestamp,
      original_amount: input_original_amount,
      corrected_amount: input_corrected_amount,
    };

    const result = recordAuditLogForModification(audit_log_input);

    expect(result.is_recorded).toBe(true);
    expect(result.modification_content).toBe(input_modification_content.trim());
  });
});