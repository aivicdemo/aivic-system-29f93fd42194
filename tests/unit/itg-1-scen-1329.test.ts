import { validateSalesDataItemMetadata } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理', () => {
  // SCEN-1329: メタデータのデータ型定義と異なる値が入力された場合、型チェックエラーが発生する
  test('should throw type mismatch error when input value does not match defined data type', () => {
    const metadata = {
      item_id: 'sales_item_001',
      item_name: 'アポ数',
      data_type: 'number',
      unit: '件',
      is_required: true,
      validation_rules: {
        min: 0,
        max: 1000,
      },
      report_mapping: 'appointment_count',
    };

    const inputValue = 'ABC123';

    expect(() => validateSalesDataItemMetadata(metadata, inputValue)).toThrow(
      /データ型/
    );
  });

  test('should pass validation when input value matches defined data type', () => {
    const metadata = {
      item_id: 'sales_item_001',
      item_name: 'アポ数',
      data_type: 'number',
      unit: '件',
      is_required: true,
      validation_rules: {
        min: 0,
        max: 1000,
      },
      report_mapping: 'appointment_count',
    };

    const inputValue = 42;

    const result = validateSalesDataItemMetadata(metadata, inputValue);
    expect(result).toEqual({
      is_valid: true,
      item_id: 'sales_item_001',
      validated_value: 42,
    });
  });

  test('should throw type mismatch error when string type is expected but number is provided', () => {
    const metadata = {
      item_id: 'sales_item_002',
      item_name: '顧客名',
      data_type: 'string',
      unit: 'テキスト',
      is_required: true,
      validation_rules: {
        max_length: 255,
      },
      report_mapping: 'customer_name',
    };

    const inputValue = 12345;

    expect(() => validateSalesDataItemMetadata(metadata, inputValue)).toThrow(
      /データ型/
    );
  });

  test('should throw type mismatch error when boolean type is expected but string is provided', () => {
    const metadata = {
      item_id: 'sales_item_003',
      item_name: 'アポ確定状況',
      data_type: 'boolean',
      unit: 'フラグ',
      is_required: true,
      validation_rules: {},
      report_mapping: 'appointment_confirmed',
    };

    const inputValue = 'confirmed';

    expect(() => validateSalesDataItemMetadata(metadata, inputValue)).toThrow(
      /データ型/
    );
  });

  test('should pass validation when boolean value matches defined boolean type', () => {
    const metadata = {
      item_id: 'sales_item_003',
      item_name: 'アポ確定状況',
      data_type: 'boolean',
      unit: 'フラグ',
      is_required: true,
      validation_rules: {},
      report_mapping: 'appointment_confirmed',
    };

    const inputValue = true;

    const result = validateSalesDataItemMetadata(metadata, inputValue);
    expect(result).toEqual({
      is_valid: true,
      item_id: 'sales_item_003',
      validated_value: true,
    });
  });

  test('should pass validation when string value matches defined string type', () => {
    const metadata = {
      item_id: 'sales_item_002',
      item_name: '顧客名',
      data_type: 'string',
      unit: 'テキスト',
      is_required: true,
      validation_rules: {
        max_length: 255,
      },
      report_mapping: 'customer_name',
    };

    const inputValue = 'Tanaka Corporation';

    const result = validateSalesDataItemMetadata(metadata, inputValue);
    expect(result).toEqual({
      is_valid: true,
      item_id: 'sales_item_002',
      validated_value: 'Tanaka Corporation',
    });
  });

  test('should throw type mismatch error when date type is expected but number is provided', () => {
    const metadata = {
      item_id: 'sales_item_004',
      item_name: '接触日時',
      data_type: 'date',
      unit: 'YYYY-MM-DD',
      is_required: true,
      validation_rules: {},
      report_mapping: 'contact_date',
    };

    const inputValue = 20240115;

    expect(() => validateSalesDataItemMetadata(metadata, inputValue)).toThrow(
      /データ型/
    );
  });

  test('should pass validation when date string matches defined date type', () => {
    const metadata = {
      item_id: 'sales_item_004',
      item_name: '接触日時',
      data_type: 'date',
      unit: 'YYYY-MM-DD',
      is_required: true,
      validation_rules: {},
      report_mapping: 'contact_date',
    };

    const inputValue = '2024-01-15';

    const result = validateSalesDataItemMetadata(metadata, inputValue);
    expect(result).toEqual({
      is_valid: true,
      item_id: 'sales_item_004',
      validated_value: '2024-01-15',
    });
  });

  test('should throw type mismatch error when array type is expected but string is provided', () => {
    const metadata = {
      item_id: 'sales_item_005',
      item_name: 'サービス種別',
      data_type: 'array',
      unit: 'カンマ区切り',
      is_required: false,
      validation_rules: {},
      report_mapping: 'service_types',
    };

    const inputValue = 'service_a,service_b';

    expect(() => validateSalesDataItemMetadata(metadata, inputValue)).toThrow(
      /データ型/
    );
  });

  test('should pass validation when array value matches defined array type', () => {
    const metadata = {
      item_id: 'sales_item_005',
      item_name: 'サービス種別',
      data_type: 'array',
      unit: 'カンマ区切り',
      is_required: false,
      validation_rules: {},
      report_mapping: 'service_types',
    };

    const inputValue = ['service_a', 'service_b'];

    const result = validateSalesDataItemMetadata(metadata, inputValue);
    expect(result).toEqual({
      is_valid: true,
      item_id: 'sales_item_005',
      validated_value: ['service_a', 'service_b'],
    });
  });

  test('should throw type mismatch error with multiple type violations in nested fields', () => {
    const metadata = {
      item_id: 'sales_item_006',
      item_name: '成約情報',
      data_type: 'object',
      unit: 'JSON',
      is_required: true,
      validation_rules: {
        properties: {
          contract_amount: { type: 'number' },
          contract_date: { type: 'date' },
        },
      },
      report_mapping: 'contract_info',
    };

    const inputValue = {
      contract_amount: 'one hundred thousand',
      contract_date: 20240115,
    };

    expect(() => validateSalesDataItemMetadata(metadata, inputValue)).toThrow(
      /データ型/
    );
  });

  test('should pass validation when all nested object fields match defined types', () => {
    const metadata = {
      item_id: 'sales_item_006',
      item_name: '成約情報',
      data_type: 'object',
      unit: 'JSON',
      is_required: true,
      validation_rules: {
        properties: {
          contract_amount: { type: 'number' },
          contract_date: { type: 'date' },
        },
      },
      report_mapping: 'contract_info',
    };

    const inputValue = {
      contract_amount: 1000000,
      contract_date: '2024-01-15',
    };

    const result = validateSalesDataItemMetadata(metadata, inputValue);
    expect(result).toEqual({
      is_valid: true,
      item_id: 'sales_item_006',
      validated_value: {
        contract_amount: 1000000,
        contract_date: '2024-01-15',
      },
    });
  });
});