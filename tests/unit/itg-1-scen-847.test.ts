import { standardizeContractChange } from '../../src/logic/it-1781935279444-2-1-1';

describe('契約変更内容の標準化記録機能', () => {
  // SCEN-847: [edge] 契約変更内容の標準化記録機能 - 契約変更内容にNULL値や空文字列を含む場合の処理が正常に実行される
  test('NULL値と空文字列を含む契約変更内容が正常に処理される', () => {
    const inputContractChange = {
      contract_id: 'CNT-20240115-001',
      change_date: '2024-01-15T09:00:00Z',
      change_content: 'サービス数量の増加',
      changed_by: 'user_12345',
      change_reason: null,
      approval_status: '',
      effective_date: '2024-02-01T00:00:00Z',
      impact_amount: null,
      notes: '',
      version_number: 2,
    };

    const result = standardizeContractChange(inputContractChange);

    expect(result).toEqual({
      contract_id: 'CNT-20240115-001',
      change_date: '2024-01-15T09:00:00Z',
      change_content: 'サービス数量の増加',
      changed_by: 'user_12345',
      change_reason: undefined,
      approval_status: undefined,
      effective_date: '2024-02-01T00:00:00Z',
      impact_amount: undefined,
      notes: undefined,
      version_number: 2,
      processing_log: {
        null_fields_converted: ['change_reason', 'impact_amount'],
        empty_string_fields_converted: ['approval_status', 'notes'],
        standardized_at: expect.any(String),
        normalization_status: 'success',
      },
    });

    expect(result.processing_log.null_fields_converted).toContain('change_reason');
    expect(result.processing_log.null_fields_converted).toContain('impact_amount');
    expect(result.processing_log.empty_string_fields_converted).toContain('approval_status');
    expect(result.processing_log.empty_string_fields_converted).toContain('notes');
    expect(result.processing_log.normalization_status).toBe('success');
  });

  test('必須フィールド欠落時は適切なバリデーションエラーが発生する', () => {
    const inputContractChange = {
      contract_id: null,
      change_date: '2024-01-15T09:00:00Z',
      change_content: '',
      changed_by: 'user_12345',
    };

    expect(() => standardizeContractChange(inputContractChange)).toThrow(/contract_id/);
  });

  test('required change_date が null の場合はバリデーションエラーが発生する', () => {
    const inputContractChange = {
      contract_id: 'CNT-20240115-001',
      change_date: null,
      change_content: 'サービス内容変更',
      changed_by: 'user_12345',
    };

    expect(() => standardizeContractChange(inputContractChange)).toThrow(/change_date/);
  });

  test('required change_content が空文字列の場合はバリデーションエラーが発生する', () => {
    const inputContractChange = {
      contract_id: 'CNT-20240115-001',
      change_date: '2024-01-15T09:00:00Z',
      change_content: '',
      changed_by: 'user_12345',
    };

    expect(() => standardizeContractChange(inputContractChange)).toThrow(/change_content/);
  });

  test('すべてのオプショナルフィールドが NULL/空文字列の場合も正常に処理される', () => {
    const inputContractChange = {
      contract_id: 'CNT-20240115-002',
      change_date: '2024-01-15T10:30:00Z',
      change_content: '料金体系の見直し',
      changed_by: 'user_67890',
      change_reason: null,
      approval_status: '',
      impact_amount: null,
      notes: '',
      effective_date: null,
      version_number: 3,
    };

    const result = standardizeContractChange(inputContractChange);

    expect(result.contract_id).toBe('CNT-20240115-002');
    expect(result.change_date).toBe('2024-01-15T10:30:00Z');
    expect(result.change_content).toBe('料金体系の見直し');
    expect(result.changed_by).toBe('user_67890');
    expect(result.change_reason).toBeUndefined();
    expect(result.approval_status).toBeUndefined();
    expect(result.impact_amount).toBeUndefined();
    expect(result.notes).toBeUndefined();
    expect(result.effective_date).toBeUndefined();
    expect(result.version_number).toBe(3);
    expect(result.processing_log.normalization_status).toBe('success');
    expect(result.processing_log.null_fields_converted.length).toBe(2);
    expect(result.processing_log.empty_string_fields_converted.length).toBe(2);
  });

  test('mixed NULL, empty string, and valid values in optional fields are all normalized correctly', () => {
    const inputContractChange = {
      contract_id: 'CNT-20240115-003',
      change_date: '2024-01-15T14:00:00Z',
      change_content: '顧客企業への通知内容',
      changed_by: 'user_admin',
      change_reason: '契約更新',
      approval_status: null,
      impact_amount: 50000,
      notes: '',
      effective_date: '2024-03-01T00:00:00Z',
      version_number: 4,
    };

    const result = standardizeContractChange(inputContractChange);

    expect(result.contract_id).toBe('CNT-20240115-003');
    expect(result.change_reason).toBe('契約更新');
    expect(result.approval_status).toBeUndefined();
    expect(result.impact_amount).toBe(50000);
    expect(result.notes).toBeUndefined();
    expect(result.effective_date).toBe('2024-03-01T00:00:00Z');
    expect(result.processing_log.null_fields_converted).toContain('approval_status');
    expect(result.processing_log.empty_string_fields_converted).toContain('notes');
    expect(result.processing_log.normalization_status).toBe('success');
  });

  test('numeric and date fields with NULL are preserved as undefined in standardized output', () => {
    const inputContractChange = {
      contract_id: 'CNT-20240115-004',
      change_date: '2024-01-15T15:30:00Z',
      change_content: 'テスト変更',
      changed_by: 'user_test',
      version_number: 1,
      impact_amount: null,
      effective_date: null,
    };

    const result = standardizeContractChange(inputContractChange);

    expect(result.impact_amount).toBeUndefined();
    expect(result.effective_date).toBeUndefined();
    expect(typeof result.version_number).toBe('number');
    expect(result.version_number).toBe(1);
  });
});