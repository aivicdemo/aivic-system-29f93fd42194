import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-760
  test('[normal] 営業データ完全性・正確性の自動検証 - 検証エラーレコードの生成と管理', () => {
    // ハッピーパス: 複数のエラーを含むサンプルデータセットで検証実行
    const salesDataWithErrors = [
      {
        sales_data_id: 'SD001',
        customer_id: 'CUST001',
        service_id: 'SVC001',
        activity_date: '2024-01-15',
        appointment_count: 5,
        concluded_count: 2,
        sales_amount: 150000,
        data_status: 'active',
      },
      {
        sales_data_id: 'SD002',
        customer_id: '', // 必須項目欠落エラー
        service_id: 'SVC002',
        activity_date: '2024-01-16',
        appointment_count: 3,
        concluded_count: null, // null値エラー
        sales_amount: 100000,
        data_status: 'active',
      },
      {
        sales_data_id: 'SD003',
        customer_id: 'CUST003',
        service_id: 'SVC003',
        activity_date: '2024-13-45', // データ型・形式エラー
        appointment_count: -1, // 値の範囲エラー
        concluded_count: 5,
        sales_amount: 250000,
        data_status: 'active',
      },
      {
        sales_data_id: 'SD004',
        customer_id: 'CUST004',
        service_id: 'SVC004',
        activity_date: '2024-01-17',
        appointment_count: 2,
        concluded_count: 5, // 矛盾: 成約数 > アポ数
        sales_amount: 0, // 異常値: 金額が0
        data_status: 'active',
      },
    ];

    // 検証実行
    const validationResult = validateSalesData(salesDataWithErrors);

    // 検証結果の期待値
    expect(validationResult).toEqual({
      validation_id: expect.any(String),
      execution_timestamp: expect.any(String),
      total_records_processed: 4,
      total_errors_detected: 6,
      validation_status: 'completed_with_errors',
      error_records: [
        {
          error_record_id: expect.any(String),
          sales_data_id: 'SD002',
          error_type: '必須項目欠落',
          error_field: 'customer_id',
          error_description: 'customer_id が空文字列です',
          error_severity: 'critical',
          error_cause: 'mandatory_field_missing',
          detected_timestamp: expect.any(String),
          status: '未対応',
          assigned_to: null,
          resolved_at: null,
          resolution_notes: null,
        },
        {
          error_record_id: expect.any(String),
          sales_data_id: 'SD002',
          error_type: 'null値',
          error_field: 'concluded_count',
          error_description: 'concluded_count が null です',
          error_severity: 'critical',
          error_cause: 'null_value_not_allowed',
          detected_timestamp: expect.any(String),
          status: '未対応',
          assigned_to: null,
          resolved_at: null,
          resolution_notes: null,
        },
        {
          error_record_id: expect.any(String),
          sales_data_id: 'SD003',
          error_type: 'データ型・形式エラー',
          error_field: 'activity_date',
          error_description: 'activity_date の形式が不正です (期待: YYYY-MM-DD)',
          error_severity: 'critical',
          error_cause: 'invalid_date_format',
          detected_timestamp: expect.any(String),
          status: '未対応',
          assigned_to: null,
          resolved_at: null,
          resolution_notes: null,
        },
        {
          error_record_id: expect.any(String),
          sales_data_id: 'SD003',
          error_type: '値の範囲エラー',
          error_field: 'appointment_count',
          error_description: 'appointment_count が範囲外です (範囲: 0 以上)',
          error_severity: 'critical',
          error_cause: 'value_out_of_range',
          detected_timestamp: expect.any(String),
          status: '未対応',
          assigned_to: null,
          resolved_at: null,
          resolution_notes: null,
        },
        {
          error_record_id: expect.any(String),
          sales_data_id: 'SD004',
          error_type: '矛盾',
          error_field: 'concluded_count vs appointment_count',
          error_description: '成約数 (5) がアポ数 (2) を上回っています',
          error_severity: 'high',
          error_cause: 'logical_inconsistency',
          detected_timestamp: expect.any(String),
          status: '未対応',
          assigned_to: null,
          resolved_at: null,
          resolution_notes: null,
        },
        {
          error_record_id: expect.any(String),
          sales_data_id: 'SD004',
          error_type: '異常値',
          error_field: 'sales_amount',
          error_description: '売上金額が 0 です',
          error_severity: 'medium',
          error_cause: 'anomalous_value',
          detected_timestamp: expect.any(String),
          status: '未対応',
          assigned_to: null,
          resolved_at: null,
          resolution_notes: null,
        },
      ],
    });

    // 検証エラーレコードの数が期待通りであることを確認
    expect(validationResult.error_records).toHaveLength(6);

    // 各エラーレコードが必須フィールドを持つことを確認
    validationResult.error_records.forEach((error) => {
      expect(error.error_record_id).toBeDefined();
      expect(error.sales_data_id).toBeDefined();
      expect(error.error_type).toBeDefined();
      expect(error.error_field).toBeDefined();
      expect(error.error_description).toBeDefined();
      expect(error.error_severity).toMatch(/critical|high|medium|low/);
      expect(error.error_cause).toBeDefined();
      expect(error.detected_timestamp).toBeDefined();
      expect(error.status).toBe('未対応');
      expect(error.assigned_to).toBeNull();
    });

    // エラーの分類が適切に行われていることを確認
    const criticalErrors = validationResult.error_records.filter(
      (e) => e.error_severity === 'critical'
    );
    const highErrors = validationResult.error_records.filter(
      (e) => e.error_severity === 'high'
    );
    const mediumErrors = validationResult.error_records.filter(
      (e) => e.error_severity === 'medium'
    );

    expect(criticalErrors).toHaveLength(4);
    expect(highErrors).toHaveLength(1);
    expect(mediumErrors).toHaveLength(1);

    // エラーレコードのステータス更新をシミュレート
    const errorToUpdate = validationResult.error_records[0];
    expect(errorToUpdate.status).toBe('未対応');
    expect(errorToUpdate.assigned_to).toBeNull();
    expect(errorToUpdate.resolved_at).toBeNull();

    // ステータス更新後の期待値
    const updatedError = {
      ...errorToUpdate,
      status: '対応中',
      assigned_to: 'STAFF001',
      resolved_at: null,
      resolution_notes: '営業担当者に修正を依頼',
    };

    expect(updatedError.status).toBe('対応中');
    expect(updatedError.assigned_to).toBe('STAFF001');
    expect(updatedError.resolution_notes).toBeDefined();

    // 複数エラーの場合、各エラーが個別に追跡可能であることを確認
    const sd002Errors = validationResult.error_records.filter(
      (e) => e.sales_data_id === 'SD002'
    );
    expect(sd002Errors).toHaveLength(2);
    expect(sd002Errors[0].error_field).toBe('customer_id');
    expect(sd002Errors[1].error_field).toBe('concluded_count');

    // 検証ステータスが正確に判定されていることを確認
    expect(validationResult.validation_status).toBe('completed_with_errors');
    expect(validationResult.total_errors_detected).toBeGreaterThan(0);

    // タイムスタンプが ISO 8601 形式であることを確認
    expect(validationResult.execution_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
    validationResult.error_records.forEach((error) => {
      expect(error.detected_timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
      );
    });
  });
});