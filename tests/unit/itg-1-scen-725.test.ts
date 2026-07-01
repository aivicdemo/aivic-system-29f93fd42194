import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質検証 - 修正後データ再検証', () => {
  // SCEN-725: [normal] 修正後データ再検証 - 修正前に存在した複数の不備がすべて解消され合格判定となる
  test('修正前の複数不備がすべて解消され再検証により合格判定となること', () => {
    // 修正前のデータ：複数の不備を含む
    const correctedSalesData = {
      sales_data_id: 'SD-2024-001',
      customer_id: 'CUST-A001',
      contact_date: '2024-01-15',
      contact_time: '10:30',
      appt_count: 3,
      deal_count: 2,
      customer_reaction: 'positive',
      service_type: 'consulting',
      sales_person_id: 'SP-001',
      amount: 50000,
      status: 'confirmed',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-20T14:45:00Z',
    };

    // 修正前に検出されていた不備内容（複数項目）
    const previousDefects = [
      {
        defect_id: 'DEF-001',
        field_name: 'contact_date',
        defect_type: 'format_error',
        detail: '日付形式が不正：2024/01/15から2024-01-15に修正',
      },
      {
        defect_id: 'DEF-002',
        field_name: 'appt_count',
        defect_type: 'data_type_error',
        detail: '数値型が文字列：「3」から3に修正',
      },
      {
        defect_id: 'DEF-003',
        field_name: 'customer_reaction',
        defect_type: 'missing_required_field',
        detail: '必須項目が空文字列から「positive」に修正',
      },
      {
        defect_id: 'DEF-004',
        field_name: 'amount',
        defect_type: 'value_range_error',
        detail: '金額が負値-50000から50000に修正',
      },
    ];

    // 再検証処理を実行
    const validationResult = validateSalesData(correctedSalesData);

    // 期待出力：合格判定
    expect(validationResult).toEqual({
      is_valid: true,
      validation_status: 'passed',
      defect_count: 0,
      corrected_defect_count: 4,
      validation_timestamp: expect.any(String),
      checked_fields: [
        'contact_date',
        'contact_time',
        'appt_count',
        'deal_count',
        'customer_reaction',
        'service_type',
        'sales_person_id',
        'amount',
        'status',
      ],
      defects: [],
      previous_defects_resolved: true,
      final_status: 'approved',
    });

    // 再検証により全不備が解消されたことを確認
    expect(validationResult.is_valid).toBe(true);
    expect(validationResult.defect_count).toBe(0);
    expect(validationResult.corrected_defect_count).toBe(4);
    expect(validationResult.validation_status).toBe('passed');
    expect(validationResult.previous_defects_resolved).toBe(true);
    expect(validationResult.final_status).toBe('approved');

    // 合格判定の詳細内容を確認
    expect(validationResult.defects.length).toBe(0);
    expect(validationResult.checked_fields.length).toBeGreaterThan(0);
  });

  // エラーケース：修正後も不備が残る場合
  test('修正後も不備が残存する場合は不合格判定となること', () => {
    const partiallyFixedData = {
      sales_data_id: 'SD-2024-002',
      customer_id: 'CUST-B001',
      contact_date: '2024-01-16',
      contact_time: '',
      appt_count: 2,
      deal_count: 1,
      customer_reaction: 'neutral',
      service_type: 'support',
      sales_person_id: 'SP-002',
      amount: 30000,
      status: 'pending',
      created_at: '2024-01-16T09:00:00Z',
      updated_at: '2024-01-21T11:20:00Z',
    };

    const validationResult = validateSalesData(partiallyFixedData);

    // 不備が存在する場合は不合格判定
    expect(validationResult.is_valid).toBe(false);
    expect(validationResult.validation_status).toBe('failed');
    expect(validationResult.defect_count).toBeGreaterThan(0);
    expect(validationResult.final_status).toBe('rejected');
  });

  // エラーケース：必須フィールドが未入力の場合
  test('必須フィールドが未入力の場合はエラーをスローすること', () => {
    const incompleteData = {
      sales_data_id: '',
      customer_id: 'CUST-C001',
      contact_date: '2024-01-17',
    };

    expect(() => validateSalesData(incompleteData)).toThrow(/必須項目/);
  });

  // エラーケース：データ型が不正な場合
  test('金額フィールドがString型の場合はエラーをスローすること', () => {
    const invalidTypeData = {
      sales_data_id: 'SD-2024-003',
      customer_id: 'CUST-D001',
      contact_date: '2024-01-18',
      contact_time: '11:00',
      appt_count: 2,
      deal_count: 1,
      customer_reaction: 'positive',
      service_type: 'consulting',
      sales_person_id: 'SP-003',
      amount: '50000',
      status: 'confirmed',
      created_at: '2024-01-18T11:00:00Z',
      updated_at: '2024-01-22T15:30:00Z',
    };

    expect(() => validateSalesData(invalidTypeData)).toThrow(/データ型/);
  });

  // エラーケース：値の範囲が不正な場合
  test('金額がマイナス値の場合はエラーをスローすること', () => {
    const outOfRangeData = {
      sales_data_id: 'SD-2024-004',
      customer_id: 'CUST-E001',
      contact_date: '2024-01-19',
      contact_time: '12:00',
      appt_count: 1,
      deal_count: 1,
      customer_reaction: 'positive',
      service_type: 'support',
      sales_person_id: 'SP-004',
      amount: -25000,
      status: 'confirmed',
      created_at: '2024-01-19T12:00:00Z',
      updated_at: '2024-01-23T16:45:00Z',
    };

    expect(() => validateSalesData(outOfRangeData)).toThrow(/範囲/);
  });
});