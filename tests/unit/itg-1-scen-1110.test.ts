import { validateAndGenerateCorrectionInstructions } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-1110
  test('複数業務が不合格の場合、修正指示が業務ごとに区別されて生成されること', () => {
    // テストデータ準備: 複数業務を含むテストケース
    const multipleJobsTestData = {
      sales_data_validation: {
        job_id: 'JOB_001',
        job_name: '営業データ品質検証',
        status: 'FAILED',
        errors: [
          {
            error_code: 'ERR_SALES_001',
            error_message: '必須項目欠落',
            field_name: 'customer_name',
            required_field: true,
            data_value: null,
          },
          {
            error_code: 'ERR_SALES_002',
            error_message: 'データ型不整合',
            field_name: 'transaction_amount',
            expected_type: 'number',
            actual_value: 'invalid_string',
          },
        ],
      },
      billing_automation: {
        job_id: 'JOB_002',
        job_name: '請求自動化処理',
        status: 'FAILED',
        errors: [
          {
            error_code: 'ERR_BILL_001',
            error_message: '金額計算エラー',
            calculation_formula: 'base_amount * discount_rate',
            base_amount: 100000,
            discount_rate: 1.5,
            invalid_reason: 'discount_rate exceeds 1.0',
          },
          {
            error_code: 'ERR_BILL_002',
            error_message: '契約条件不整合',
            contract_id: 'CONTRACT_123',
            applied_discount: 0.3,
            contract_discount: 0.2,
          },
        ],
      },
      progress_judgment: {
        job_id: 'JOB_003',
        job_name: '進行判定',
        status: 'FAILED',
        errors: [
          {
            error_code: 'ERR_PROG_001',
            error_message: 'ステータス判定エラー',
            current_status: 'COMPLETED',
            required_status: 'APPROVED',
            validation_rule: 'status_must_be_approved_before_final',
          },
          {
            error_code: 'ERR_PROG_002',
            error_message: 'タイムスタンプ矛盾',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T09:30:00Z',
            issue: 'updated_at is before created_at',
          },
        ],
      },
    };

    // 統合検証プロセスを実行
    const result = validateAndGenerateCorrectionInstructions(multipleJobsTestData);

    // 検証結果: 各業務ごとに区別された修正指示が生成されていることを確認
    expect(result.overall_status).toBe('FAILED');
    expect(result.failed_job_count).toBe(3);
    expect(result.correction_instructions).toBeDefined();
    expect(Array.isArray(result.correction_instructions)).toBe(true);

    // 営業データ品質検証に対する修正指示を検証
    const sales_data_correction = result.correction_instructions.find(
      (instruction) => instruction.job_id === 'JOB_001'
    );
    expect(sales_data_correction).toBeDefined();
    expect(sales_data_correction?.job_name).toBe('営業データ品質検証');
    expect(sales_data_correction?.correction_items).toBeDefined();
    expect(Array.isArray(sales_data_correction?.correction_items)).toBe(true);
    expect(sales_data_correction?.correction_items?.length).toBe(2);

    const sales_correction_item_1 = sales_data_correction?.correction_items?.[0];
    expect(sales_correction_item_1?.error_code).toBe('ERR_SALES_001');
    expect(sales_correction_item_1?.instruction_type).toBe('MISSING_REQUIRED_FIELD');
    expect(sales_correction_item_1?.field_name).toBe('customer_name');
    expect(sales_correction_item_1?.corrective_action).toBe(
      '顧客名を必ず入力してください'
    );

    const sales_correction_item_2 = sales_data_correction?.correction_items?.[1];
    expect(sales_correction_item_2?.error_code).toBe('ERR_SALES_002');
    expect(sales_correction_item_2?.instruction_type).toBe('DATA_TYPE_MISMATCH');
    expect(sales_correction_item_2?.field_name).toBe('transaction_amount');
    expect(sales_correction_item_2?.expected_format).toBe('number');
    expect(sales_correction_item_2?.corrective_action).toBe(
      '取引金額は数値で入力してください'
    );

    // 請求自動化処理に対する修正指示を検証
    const billing_correction = result.correction_instructions.find(
      (instruction) => instruction.job_id === 'JOB_002'
    );
    expect(billing_correction).toBeDefined();
    expect(billing_correction?.job_name).toBe('請求自動化処理');
    expect(billing_correction?.correction_items).toBeDefined();
    expect(Array.isArray(billing_correction?.correction_items)).toBe(true);
    expect(billing_correction?.correction_items?.length).toBe(2);

    const billing_correction_item_1 = billing_correction?.correction_items?.[0];
    expect(billing_correction_item_1?.error_code).toBe('ERR_BILL_001');
    expect(billing_correction_item_1?.instruction_type).toBe(
      'CALCULATION_LOGIC_ERROR'
    );
    expect(billing_correction_item_1?.corrective_action).toBe(
      '割引率は1.0以下である必要があります。現在の値1.5を0.2以下に修正してください'
    );
    expect(billing_correction_item_1?.reference_context).toEqual({
      base_amount: 100000,
      discount_rate: 1.5,
      issue: 'discount_rate exceeds 1.0',
    });

    const billing_correction_item_2 = billing_correction?.correction_items?.[1];
    expect(billing_correction_item_2?.error_code).toBe('ERR_BILL_002');
    expect(billing_correction_item_2?.instruction_type).toBe(
      'CONTRACT_CONDITION_MISMATCH'
    );
    expect(billing_correction_item_2?.corrective_action).toBe(
      '契約書の割引率は0.2ですが、現在0.3が適用されています。契約条件に合わせて修正してください'
    );
    expect(billing_correction_item_2?.reference_context).toEqual({
      contract_id: 'CONTRACT_123',
      applied_discount: 0.3,
      contract_discount: 0.2,
    });

    // 進行判定に対する修正指示を検証
    const progress_correction = result.correction_instructions.find(
      (instruction) => instruction.job_id === 'JOB_003'
    );
    expect(progress_correction).toBeDefined();
    expect(progress_correction?.job_name).toBe('進行判定');
    expect(progress_correction?.correction_items).toBeDefined();
    expect(Array.isArray(progress_correction?.correction_items)).toBe(true);
    expect(progress_correction?.correction_items?.length).toBe(2);

    const progress_correction_item_1 = progress_correction?.correction_items?.[0];
    expect(progress_correction_item_1?.error_code).toBe('ERR_PROG_001');
    expect(progress_correction_item_1?.instruction_type).toBe(
      'STATUS_VALIDATION_ERROR'
    );
    expect(progress_correction_item_1?.corrective_action).toBe(
      'ステータスを確認前のCOMPLETEDから承認済みAPPROVEDに変更してください'
    );
    expect(progress_correction_item_1?.reference_context).toEqual({
      current_status: 'COMPLETED',
      required_status: 'APPROVED',
    });

    const progress_correction_item_2 = progress_correction?.correction_items?.[1];
    expect(progress_correction_item_2?.error_code).toBe('ERR_PROG_002');
    expect(progress_correction_item_2?.instruction_type).toBe(
      'TIMESTAMP_INCONSISTENCY'
    );
    expect(progress_correction_item_2?.corrective_action).toBe(
      '作成日時2024-01-15T10:00:00Zと更新日時2024-01-15T09:30:00Zが矛盾しています。更新日時を修正してください'
    );

    // 修正指示が業務ごとに完全に区別されていることを確認
    expect(sales_data_correction?.job_id).not.toBe(billing_correction?.job_id);
    expect(billing_correction?.job_id).not.toBe(progress_correction?.job_id);
    expect(sales_data_correction?.job_id).not.toBe(progress_correction?.job_id);

    // 各業務の修正指示間での情報混在がないことを検証
    const all_correction_error_codes = result.correction_instructions.flatMap(
      (instruction) =>
        instruction.correction_items?.map((item) => item.error_code) || []
    );
    const unique_error_codes = new Set(all_correction_error_codes);
    expect(unique_error_codes.size).toBe(all_correction_error_codes.length);

    // 修正指示の総数が正確であることを確認
    const total_correction_items = result.correction_instructions.reduce(
      (sum, instruction) => sum + (instruction.correction_items?.length || 0),
      0
    );
    expect(total_correction_items).toBe(6);

    // サマリー情報の検証
    expect(result.summary).toBeDefined();
    expect(result.summary?.total_failed_jobs).toBe(3);
    expect(result.summary?.total_correction_items).toBe(6);
    expect(result.summary?.timestamp).toBeDefined();
    expect(typeof result.summary?.timestamp).toBe('string');
  });
});