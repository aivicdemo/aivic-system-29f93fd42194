import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateSalesDataForApproval } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-724
  test('修正済みデータの形式が不正（データ型不整合）で、承認が拒否される', () => {
    const sales_data_id = 'SD-20240115-001';
    const corrected_sales_data = {
      customer_id: 'CUST-12345',
      service_id: 'SVC-67890',
      sales_amount: '12,345円',
      contact_date: '2024-01-15',
      deal_status: 'closed',
      appointment_confirmed: true
    };
    const approver_user_id = 'USER-APPROVER-001';

    const validation_result = validateSalesDataForApproval({
      sales_data_id,
      corrected_sales_data,
      approver_user_id,
      validation_rules: {
        sales_amount: {
          data_type: 'number',
          required: true,
          min_value: 0,
          max_value: 999999999
        },
        customer_id: {
          data_type: 'string',
          required: true,
          pattern: '^CUST-\\d+$'
        },
        service_id: {
          data_type: 'string',
          required: true,
          pattern: '^SVC-\\d+$'
        },
        contact_date: {
          data_type: 'string',
          required: true,
          pattern: '^\\d{4}-\\d{2}-\\d{2}$'
        },
        deal_status: {
          data_type: 'string',
          required: true,
          allowed_values: ['open', 'closed', 'pending']
        },
        appointment_confirmed: {
          data_type: 'boolean',
          required: true
        }
      }
    });

    expect(validation_result.is_approved).toBe(false);
    expect(validation_result.approval_status).toBe('拒否');
    expect(validation_result.validation_errors).toHaveLength(1);
    expect(validation_result.validation_errors[0].field_name).toBe('sales_amount');
    expect(validation_result.validation_errors[0].error_code).toBe('DATA_TYPE_MISMATCH');
    expect(validation_result.validation_errors[0].error_message).toMatch(/営業金額は数値型である必要があります/);
    expect(validation_result.should_return_to_corrector).toBe(true);
    expect(validation_result.rejection_reason).toMatch(/営業金額/);
  });

  test('修正済みデータが形式要件を満たし、承認が受理される', () => {
    const sales_data_id = 'SD-20240115-002';
    const corrected_sales_data = {
      customer_id: 'CUST-54321',
      service_id: 'SVC-11111',
      sales_amount: 25000,
      contact_date: '2024-01-15',
      deal_status: 'closed',
      appointment_confirmed: true
    };
    const approver_user_id = 'USER-APPROVER-001';

    const validation_result = validateSalesDataForApproval({
      sales_data_id,
      corrected_sales_data,
      approver_user_id,
      validation_rules: {
        sales_amount: {
          data_type: 'number',
          required: true,
          min_value: 0,
          max_value: 999999999
        },
        customer_id: {
          data_type: 'string',
          required: true,
          pattern: '^CUST-\\d+$'
        },
        service_id: {
          data_type: 'string',
          required: true,
          pattern: '^SVC-\\d+$'
        },
        contact_date: {
          data_type: 'string',
          required: true,
          pattern: '^\\d{4}-\\d{2}-\\d{2}$'
        },
        deal_status: {
          data_type: 'string',
          required: true,
          allowed_values: ['open', 'closed', 'pending']
        },
        appointment_confirmed: {
          data_type: 'boolean',
          required: true
        }
      }
    });

    expect(validation_result.is_approved).toBe(true);
    expect(validation_result.approval_status).toBe('承認');
    expect(validation_result.validation_errors).toHaveLength(0);
    expect(validation_result.should_return_to_corrector).toBe(false);
    expect(validation_result.approved_by_user_id).toBe('USER-APPROVER-001');
    expect(validation_result.approval_timestamp).toBeDefined();
  });

  test('複数の形式エラーが検出され、すべてがエラーリストに含まれる', () => {
    const sales_data_id = 'SD-20240115-003';
    const corrected_sales_data = {
      customer_id: 'INVALID-001',
      service_id: 'SVC-22222',
      sales_amount: '無効な金額',
      contact_date: '2024/01/15',
      deal_status: 'unknown',
      appointment_confirmed: 'true'
    };
    const approver_user_id = 'USER-APPROVER-002';

    const validation_result = validateSalesDataForApproval({
      sales_data_id,
      corrected_sales_data,
      approver_user_id,
      validation_rules: {
        sales_amount: {
          data_type: 'number',
          required: true,
          min_value: 0,
          max_value: 999999999
        },
        customer_id: {
          data_type: 'string',
          required: true,
          pattern: '^CUST-\\d+$'
        },
        service_id: {
          data_type: 'string',
          required: true,
          pattern: '^SVC-\\d+$'
        },
        contact_date: {
          data_type: 'string',
          required: true,
          pattern: '^\\d{4}-\\d{2}-\\d{2}$'
        },
        deal_status: {
          data_type: 'string',
          required: true,
          allowed_values: ['open', 'closed', 'pending']
        },
        appointment_confirmed: {
          data_type: 'boolean',
          required: true
        }
      }
    });

    expect(validation_result.is_approved).toBe(false);
    expect(validation_result.approval_status).toBe('拒否');
    expect(validation_result.validation_errors.length).toBeGreaterThan(1);
    expect(validation_result.validation_errors.map((e: any) => e.field_name)).toEqual(
      expect.arrayContaining(['sales_amount', 'customer_id', 'contact_date', 'deal_status', 'appointment_confirmed'])
    );
    expect(validation_result.should_return_to_corrector).toBe(true);
  });

  test('必須項目が欠落し、承認が拒否される', () => {
    const sales_data_id = 'SD-20240115-004';
    const corrected_sales_data = {
      customer_id: 'CUST-99999',
      service_id: 'SVC-33333',
      contact_date: '2024-01-15',
      deal_status: 'closed'
    };
    const approver_user_id = 'USER-APPROVER-001';

    const validation_result = validateSalesDataForApproval({
      sales_data_id,
      corrected_sales_data,
      approver_user_id,
      validation_rules: {
        sales_amount: {
          data_type: 'number',
          required: true,
          min_value: 0,
          max_value: 999999999
        },
        customer_id: {
          data_type: 'string',
          required: true,
          pattern: '^CUST-\\d+$'
        },
        service_id: {
          data_type: 'string',
          required: true,
          pattern: '^SVC-\\d+$'
        },
        contact_date: {
          data_type: 'string',
          required: true,
          pattern: '^\\d{4}-\\d{2}-\\d{2}$'
        },
        deal_status: {
          data_type: 'string',
          required: true,
          allowed_values: ['open', 'closed', 'pending']
        },
        appointment_confirmed: {
          data_type: 'boolean',
          required: true
        }
      }
    });

    expect(validation_result.is_approved).toBe(false);
    expect(validation_result.approval_status).toBe('拒否');
    expect(validation_result.validation_errors.map((e: any) => e.field_name)).toEqual(
      expect.arrayContaining(['sales_amount', 'appointment_confirmed'])
    );
    expect(validation_result.validation_errors.some((e: any) => e.error_code === 'REQUIRED_FIELD_MISSING')).toBe(true);
  });

  test('数値の範囲外エラーが検出され、承認が拒否される', () => {
    const sales_data_id = 'SD-20240115-005';
    const corrected_sales_data = {
      customer_id: 'CUST-88888',
      service_id: 'SVC-44444',
      sales_amount: 9999999999,
      contact_date: '2024-01-15',
      deal_status: 'closed',
      appointment_confirmed: true
    };
    const approver_user_id = 'USER-APPROVER-001';

    const validation_result = validateSalesDataForApproval({
      sales_data_id,
      corrected_sales_data,
      approver_user_id,
      validation_rules: {
        sales_amount: {
          data_type: 'number',
          required: true,
          min_value: 0,
          max_value: 999999999
        },
        customer_id: {
          data_type: 'string',
          required: true,
          pattern: '^CUST-\\d+$'
        },
        service_id: {
          data_type: 'string',
          required: true,
          pattern: '^SVC-\\d+$'
        },
        contact_date: {
          data_type: 'string',
          required: true,
          pattern: '^\\d{4}-\\d{2}-\\d{2}$'
        },
        deal_status: {
          data_type: 'string',
          required: true,
          allowed_values: ['open', 'closed', 'pending']
        },
        appointment_confirmed: {
          data_type: 'boolean',
          required: true
        }
      }
    });

    expect(validation_result.is_approved).toBe(false);
    expect(validation_result.approval_status).toBe('拒否');
    expect(validation_result.validation_errors.some((e: any) => e.field_name === 'sales_amount')).toBe(true);
    expect(validation_result.validation_errors.find((e: any) => e.field_name === 'sales_amount')?.error_code).toMatch(/RANGE|VALUE/);
  });
});