import { validateEstimateFormatCompleteness, transferToOCRTestQueue } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1338
  test('見積フォーマット完全性チェック・OCR読取テスト供給機能', () => {
    // 他部署から収集された見積書サンプルのセット
    const collected_samples = [
      {
        sample_id: 'SAMPLE-001',
        source_department: 'DEPT-B',
        format_type: 'ESTIMATE_DETAIL',
        required_fields: [
          { field_name: 'project_code', value: 'PJ-2024-001', is_present: true },
          { field_name: 'construction_type', value: '鉄骨造', is_present: true },
          { field_name: 'total_amount', value: '5000000', is_present: true },
          { field_name: 'unit_price', value: '150000', is_present: true },
          { field_name: 'quantity', value: '33.33', is_present: true },
          { field_name: 'region_code', value: 'TOKYO-01', is_present: true },
          { field_name: 'submission_date', value: '2024-01-15', is_present: true },
        ],
        upload_timestamp: '2024-01-15T10:00:00Z',
        file_format: 'PDF',
        file_size_bytes: 524288,
      },
      {
        sample_id: 'SAMPLE-002',
        source_department: 'DEPT-C',
        format_type: 'ESTIMATE_DETAIL',
        required_fields: [
          { field_name: 'project_code', value: 'PJ-2024-002', is_present: true },
          { field_name: 'construction_type', value: 'RC造', is_present: true },
          { field_name: 'total_amount', value: '8500000', is_present: true },
          { field_name: 'unit_price', value: '180000', is_present: true },
          { field_name: 'quantity', value: '47.22', is_present: true },
          { field_name: 'region_code', value: 'OSAKA-02', is_present: true },
          { field_name: 'submission_date', value: '2024-01-15', is_present: true },
        ],
        upload_timestamp: '2024-01-15T10:05:00Z',
        file_format: 'PDF',
        file_size_bytes: 458752,
      },
      {
        sample_id: 'SAMPLE-003',
        source_department: 'DEPT-D',
        format_type: 'ESTIMATE_DETAIL',
        required_fields: [
          { field_name: 'project_code', value: 'PJ-2024-003', is_present: true },
          { field_name: 'construction_type', value: '木造', is_present: true },
          { field_name: 'total_amount', value: '3200000', is_present: true },
          { field_name: 'unit_price', value: '125000', is_present: true },
          { field_name: 'quantity', value: '25.60', is_present: true },
          { field_name: 'region_code', value: 'NAGOYA-03', is_present: true },
          { field_name: 'submission_date', value: '2024-01-15', is_present: true },
        ],
        upload_timestamp: '2024-01-15T10:10:00Z',
        file_format: 'PDF',
        file_size_bytes: 389120,
      },
    ];

    // フォーマット仕様定義
    const format_specification = {
      spec_id: 'SPEC-ESTIMATE-001',
      version: '1.0',
      required_field_count: 7,
      required_field_list: [
        'project_code',
        'construction_type',
        'total_amount',
        'unit_price',
        'quantity',
        'region_code',
        'submission_date',
      ],
      allowed_file_formats: ['PDF', 'XLSX', 'DOC'],
      min_file_size_bytes: 102400,
      max_file_size_bytes: 5242880,
      required_field_validation_rules: {
        project_code: { pattern: '^PJ-\\d{4}-\\d{3}$', type: 'string' },
        construction_type: {
          allowed_values: ['鉄骨造', 'RC造', '木造', '鉄筋コンクリート造'],
          type: 'string',
        },
        total_amount: { type: 'number', min_value: 100000, max_value: 100000000 },
        unit_price: { type: 'number', min_value: 10000, max_value: 500000 },
        quantity: { type: 'number', min_value: 0.1, max_value: 10000 },
        region_code: { pattern: '^[A-Z]+-\\d{2}$', type: 'string' },
        submission_date: { pattern: '^\\d{4}-\\d{2}-\\d{2}$', type: 'string' },
      },
      created_date: '2024-01-10T00:00:00Z',
      last_updated_date: '2024-01-10T00:00:00Z',
    };

    // 実行: 完全性チェック
    const completeness_check_result = validateEstimateFormatCompleteness(
      collected_samples,
      format_specification,
    );

    // 期待値: すべてのサンプルが完全性チェックに合格
    expect(completeness_check_result.check_execution_timestamp).toBe(
      '2024-01-15T10:15:00Z',
    );
    expect(completeness_check_result.total_samples_checked).toBe(3);
    expect(completeness_check_result.samples_passed_count).toBe(3);
    expect(completeness_check_result.samples_failed_count).toBe(0);
    expect(completeness_check_result.pass_rate_percentage).toBe(100);
    expect(completeness_check_result.overall_result).toBe('PASS');

    // 各サンプルの詳細チェック結果
    expect(completeness_check_result.sample_results).toHaveLength(3);

    expect(completeness_check_result.sample_results[0]).toEqual({
      sample_id: 'SAMPLE-001',
      source_department: 'DEPT-B',
      required_fields_present: 7,
      required_fields_total: 7,
      fields_completeness_percentage: 100,
      completeness_status: 'PASS',
      missing_fields: [],
      validation_errors: [],
      ready_for_ocr_test: true,
      check_timestamp: '2024-01-15T10:15:00Z',
    });

    expect(completeness_check_result.sample_results[1]).toEqual({
      sample_id: 'SAMPLE-002',
      source_department: 'DEPT-C',
      required_fields_present: 7,
      required_fields_total: 7,
      fields_completeness_percentage: 100,
      completeness_status: 'PASS',
      missing_fields: [],
      validation_errors: [],
      ready_for_ocr_test: true,
      check_timestamp: '2024-01-15T10:15:00Z',
    });

    expect(completeness_check_result.sample_results[2]).toEqual({
      sample_id: 'SAMPLE-003',
      source_department: 'DEPT-D',
      required_fields_present: 7,
      required_fields_total: 7,
      fields_completeness_percentage: 100,
      completeness_status: 'PASS',
      missing_fields: [],
      validation_errors: [],
      ready_for_ocr_test: true,
      check_timestamp: '2024-01-15T10:15:00Z',
    });

    // 実行: OCR読取テスト供給機能に転送
    const ocr_transfer_result = transferToOCRTestQueue(
      completeness_check_result.sample_results.filter((r) => r.completeness_status === 'PASS'),
      'OCR_TEST_QUEUE_001',
    );

    // 期待値: OCR読取テストキューに正常に転送
    expect(ocr_transfer_result.transfer_execution_timestamp).toBe('2024-01-15T10:20:00Z');
    expect(ocr_transfer_result.target_queue_id).toBe('OCR_TEST_QUEUE_001');
    expect(ocr_transfer_result.samples_transferred_count).toBe(3);
    expect(ocr_transfer_result.samples_transfer_failed_count).toBe(0);
    expect(ocr_transfer_result.transfer_success_rate_percentage).toBe(100);
    expect(ocr_transfer_result.overall_transfer_result).toBe('SUCCESS');

    // 転送された各サンプルの状態確認
    expect(ocr_transfer_result.transferred_samples).toHaveLength(3);

    expect(ocr_transfer_result.transferred_samples[0]).toEqual({
      sample_id: 'SAMPLE-001',
      source_department: 'DEPT-B',
      transfer_status: 'QUEUED',
      queue_position: 1,
      estimated_ocr_start_time: '2024-01-15T10:25:00Z',
      transfer_timestamp: '2024-01-15T10:20:00Z',
      available_in_ocr_environment: true,
    });

    expect(ocr_transfer_result.transferred_samples[1]).toEqual({
      sample_id: 'SAMPLE-002',
      source_department: 'DEPT-C',
      transfer_status: 'QUEUED',
      queue_position: 2,
      estimated_ocr_start_time: '2024-01-15T10:30:00Z',
      transfer_timestamp: '2024-01-15T10:20:00Z',
      available_in_ocr_environment: true,
    });

    expect(ocr_transfer_result.transferred_samples[2]).toEqual({
      sample_id: 'SAMPLE-003',
      source_department: 'DEPT-D',
      transfer_status: 'QUEUED',
      queue_position: 3,
      estimated_ocr_start_time: '2024-01-15T10:35:00Z',
      transfer_timestamp: '2024-01-15T10:20:00Z',
      available_in_ocr_environment: true,
    });

    // 総合検証: OCR読取テスト環境での利用可能性
    const all_samples_available_for_ocr = ocr_transfer_result.transferred_samples.every(
      (sample) => sample.available_in_ocr_environment === true,
    );
    expect(all_samples_available_for_ocr).toBe(true);

    // 完全性チェック通過率の検証
    expect(completeness_check_result.pass_rate_percentage).toBe(100);

    // OCR転送成功率の検証
    expect(ocr_transfer_result.transfer_success_rate_percentage).toBe(100);

    // フォーマット仕様との整合性検証
    expect(completeness_check_result.samples_passed_count).toBe(
      ocr_transfer_result.samples_transferred_count,
    );
  });
});