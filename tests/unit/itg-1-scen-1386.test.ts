import { describe, test, expect } from '@jest/globals';
import { validateSalesDataTypeCompatibility } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理 - CRM互換性検証', () => {
  test('SCEN-1386: 営業システムとCRM間データ互換性検証機能 - 境界値となるデータ型変換・長さ制限が正しく検証される', () => {
    // ===== 1. 正常系：許容範囲内のデータ =====
    const validStringData = {
      field_name: 'customer_name',
      field_type: 'string',
      max_length: 255,
      value: 'Customer Name',
      expected_type: 'string',
    };
    const resultValidString = validateSalesDataTypeCompatibility(validStringData);
    expect(resultValidString.is_valid).toBe(true);
    expect(resultValidString.error_message).toBe('');

    // 数値：正常値
    const validNumberData = {
      field_name: 'sales_amount',
      field_type: 'number',
      max_value: 999999.99,
      min_value: 0,
      value: 5000.50,
      expected_type: 'number',
    };
    const resultValidNumber = validateSalesDataTypeCompatibility(validNumberData);
    expect(resultValidNumber.is_valid).toBe(true);
    expect(resultValidNumber.error_message).toBe('');

    // 日付：正常形式（ISO 8601）
    const validDateData = {
      field_name: 'transaction_date',
      field_type: 'date',
      value: '2024-01-15T11:00:00Z',
      expected_format: 'ISO8601',
      expected_type: 'string',
    };
    const resultValidDate = validateSalesDataTypeCompatibility(validDateData);
    expect(resultValidDate.is_valid).toBe(true);
    expect(resultValidDate.error_message).toBe('');

    // ===== 2. 境界値テスト：最大長に達するデータ =====
    const maxLengthString = 'A'.repeat(255);
    const maxLengthData = {
      field_name: 'product_description',
      field_type: 'string',
      max_length: 255,
      value: maxLengthString,
      expected_type: 'string',
    };
    const resultMaxLength = validateSalesDataTypeCompatibility(maxLengthData);
    expect(resultMaxLength.is_valid).toBe(true);
    expect(resultMaxLength.error_message).toBe('');
    expect(resultMaxLength.value_length).toBe(255);

    // ===== 3. 範囲外：最大長を1文字超過 =====
    const overMaxLengthString = 'A'.repeat(256);
    const overMaxLengthData = {
      field_name: 'product_description',
      field_type: 'string',
      max_length: 255,
      value: overMaxLengthString,
      expected_type: 'string',
    };
    const resultOverMaxLength = validateSalesDataTypeCompatibility(overMaxLengthData);
    expect(resultOverMaxLength.is_valid).toBe(false);
    expect(resultOverMaxLength.error_message).toMatch(/最大長/);
    expect(resultOverMaxLength.value_length).toBe(256);

    // ===== 4. 境界値テスト：最小長（0文字）=====
    const minLengthData = {
      field_name: 'optional_note',
      field_type: 'string',
      min_length: 0,
      max_length: 255,
      value: '',
      expected_type: 'string',
      is_required: false,
    };
    const resultMinLength = validateSalesDataTypeCompatibility(minLengthData);
    expect(resultMinLength.is_valid).toBe(true);
    expect(resultMinLength.error_message).toBe('');

    // ===== 5. 範囲外：Null値（必須フィールド） =====
    const nullRequiredData = {
      field_name: 'customer_id',
      field_type: 'string',
      value: null,
      expected_type: 'string',
      is_required: true,
    };
    const resultNullRequired = validateSalesDataTypeCompatibility(nullRequiredData);
    expect(resultNullRequired.is_valid).toBe(false);
    expect(resultNullRequired.error_message).toMatch(/必須/);

    // ===== 6. 型不一致：数値フィールドに文字列 =====
    const typeMismatchNumberData = {
      field_name: 'appointment_count',
      field_type: 'number',
      value: 'invalid_string',
      expected_type: 'number',
    };
    const resultTypeMismatchNumber = validateSalesDataTypeCompatibility(typeMismatchNumberData);
    expect(resultTypeMismatchNumber.is_valid).toBe(false);
    expect(resultTypeMismatchNumber.error_message).toMatch(/型/);

    // ===== 7. 型不一致：文字列フィールドに数値 =====
    const typeMismatchStringData = {
      field_name: 'customer_name',
      field_type: 'string',
      value: 12345,
      expected_type: 'string',
    };
    const resultTypeMismatchString = validateSalesDataTypeCompatibility(typeMismatchStringData);
    expect(resultTypeMismatchString.is_valid).toBe(false);
    expect(resultTypeMismatchString.error_message).toMatch(/型/);

    // ===== 8. 数値範囲外：最大値超過 =====
    const numberOverMaxData = {
      field_name: 'sales_amount',
      field_type: 'number',
      max_value: 999999.99,
      min_value: 0,
      value: 1000000.00,
      expected_type: 'number',
    };
    const resultNumberOverMax = validateSalesDataTypeCompatibility(numberOverMaxData);
    expect(resultNumberOverMax.is_valid).toBe(false);
    expect(resultNumberOverMax.error_message).toMatch(/最大値/);

    // ===== 9. 数値範囲外：最小値未満 =====
    const numberBelowMinData = {
      field_name: 'sales_amount',
      field_type: 'number',
      max_value: 999999.99,
      min_value: 0,
      value: -1,
      expected_type: 'number',
    };
    const resultNumberBelowMin = validateSalesDataTypeCompatibility(numberBelowMinData);
    expect(resultNumberBelowMin.is_valid).toBe(false);
    expect(resultNumberBelowMin.error_message).toMatch(/最小値/);

    // ===== 10. 日付フィールド：不正な形式 =====
    const invalidDateFormatData = {
      field_name: 'transaction_date',
      field_type: 'date',
      value: '2024/01/15',
      expected_format: 'ISO8601',
      expected_type: 'string',
    };
    const resultInvalidDateFormat = validateSalesDataTypeCompatibility(invalidDateFormatData);
    expect(resultInvalidDateFormat.is_valid).toBe(false);
    expect(resultInvalidDateFormat.error_message).toMatch(/日付形式/);

    // ===== 11. 日付フィールド：無効な日付 =====
    const invalidDateValueData = {
      field_name: 'transaction_date',
      field_type: 'date',
      value: '2024-13-45T25:61:61Z',
      expected_format: 'ISO8601',
      expected_type: 'string',
    };
    const resultInvalidDateValue = validateSalesDataTypeCompatibility(invalidDateValueData);
    expect(resultInvalidDateValue.is_valid).toBe(false);
    expect(resultInvalidDateValue.error_message).toMatch(/日付/);

    // ===== 12. CRM側での変換一貫性確認：文字列変換 =====
    const crmStringConversionData = {
      field_name: 'customer_name',
      field_type: 'string',
      value: 'Test Customer',
      expected_type: 'string',
      crm_field_name: 'account_name',
      crm_expected_type: 'string',
    };
    const resultCrmStringConversion = validateSalesDataTypeCompatibility(crmStringConversionData);
    expect(resultCrmStringConversion.is_valid).toBe(true);
    expect(resultCrmStringConversion.crm_compatible).toBe(true);
    expect(resultCrmStringConversion.conversion_consistent).toBe(true);

    // ===== 13. CRM側での変換一貫性確認：数値変換 =====
    const crmNumberConversionData = {
      field_name: 'sales_amount',
      field_type: 'number',
      value: 5000.50,
      expected_type: 'number',
      crm_field_name: 'amount',
      crm_expected_type: 'decimal',
      conversion_rule: 'direct_map',
    };
    const resultCrmNumberConversion = validateSalesDataTypeCompatibility(crmNumberConversionData);
    expect(resultCrmNumberConversion.is_valid).toBe(true);
    expect(resultCrmNumberConversion.crm_compatible).toBe(true);
    expect(resultCrmNumberConversion.conversion_consistent).toBe(true);

    // ===== 14. CRM側での型不一致：互換性なし =====
    const crmIncompatibleTypeData = {
      field_name: 'appointment_count',
      field_type: 'number',
      value: 3,
      expected_type: 'number',
      crm_field_name: 'appointments',
      crm_expected_type: 'string',
    };
    const resultCrmIncompatible = validateSalesDataTypeCompatibility(crmIncompatibleTypeData);
    expect(resultCrmIncompatible.is_valid).toBe(true);
    expect(resultCrmIncompatible.crm_compatible).toBe(false);
    expect(resultCrmIncompatible.error_message).toMatch(/CRM互換性/);

    // ===== 15. 複合検証：複数の境界条件を同時にチェック =====
    const complexValidationData = {
      field_name: 'product_code',
      field_type: 'string',
      min_length: 1,
      max_length: 50,
      pattern: '^[A-Z0-9-]+$',
      value: 'PROD-12345',
      expected_type: 'string',
    };
    const resultComplexValidation = validateSalesDataTypeCompatibility(complexValidationData);
    expect(resultComplexValidation.is_valid).toBe(true);
    expect(resultComplexValidation.pattern_matched).toBe(true);

    // ===== 16. 複合検証：パターン不一致 =====
    const complexValidationFailData = {
      field_name: 'product_code',
      field_type: 'string',
      min_length: 1,
      max_length: 50,
      pattern: '^[A-Z0-9-]+$',
      value: 'prod-12345',
      expected_type: 'string',
    };
    const resultComplexValidationFail = validateSalesDataTypeCompatibility(complexValidationFailData);
    expect(resultComplexValidationFail.is_valid).toBe(false);
    expect(resultComplexValidationFail.pattern_matched).toBe(false);
    expect(resultComplexValidationFail.error_message).toMatch(/パターン/);

    // ===== 17. ログ記録検証：エラー時のログが含まれることを確認 =====
    const loggedErrorData = {
      field_name: 'transaction_date',
      field_type: 'date',
      value: 'invalid-date',
      expected_format: 'ISO8601',
      expected_type: 'string',
      enable_logging: true,
    };
    const resultLoggedError = validateSalesDataTypeCompatibility(loggedErrorData);
    expect(resultLoggedError.is_valid).toBe(false);
    expect(resultLoggedError.logged).toBe(true);
    expect(resultLoggedError.log_timestamp).toBeDefined();

    // ===== 18. ログ記録検証：成功時のログが含まれることを確認 =====
    const loggedSuccessData = {
      field_name: 'sales_amount',
      field_type: 'number',
      max_value: 999999.99,
      min_value: 0,
      value: 5000.50,
      expected_type: 'number',
      enable_logging: true,
    };
    const resultLoggedSuccess = validateSalesDataTypeCompatibility(loggedSuccessData);
    expect(resultLoggedSuccess.is_valid).toBe(true);
    expect(resultLoggedSuccess.logged).toBe(true);
    expect(resultLoggedSuccess.log_timestamp).toBeDefined();

    // ===== 19. 営業システムとCRM変換結果の一貫性：複数フィールド =====
    const multiFieldConsistencyData = [
      {
        field_name: 'customer_name',
        field_type: 'string',
        value: 'ABC Corporation',
        expected_type: 'string',
        crm_field_name: 'account_name',
        crm_expected_type: 'string',
      },
      {
        field_name: 'sales_amount',
        field_type: 'number',
        value: 15000.00,
        expected_type: 'number',
        crm_field_name: 'amount',
        crm_expected_type: 'decimal',
      },
      {
        field_name: 'transaction_date',
        field_type: 'date',
        value: '2024-02-20T14:30:00Z',
        expected_format: 'ISO8601',
        crm_field_name: 'created_date',
        crm_expected_type: 'datetime',
      },
    ];
    const resultsMultiFieldConsistency = multiFieldConsistencyData.map(
      (data) => validateSalesDataTypeCompatibility(data)
    );
    resultsMultiFieldConsistency.forEach((result) => {
      expect(result.is_valid).toBe(true);
      expect(result.crm_compatible).toBe(true);
      expect(result.conversion_consistent).toBe(true);
    });

    // ===== 20. 境界値：64bit 整数の最大値 =====
    const maxInt64Data = {
      field_name: 'large_id',
      field_type: 'number',
      max_value: 9223372036854775807,
      min_value: 0,
      value: 9223372036854775807,
      expected_type: 'number',
    };
    const resultMaxInt64 = validateSalesDataTypeCompatibility(maxInt64Data);
    expect(resultMaxInt64.is_valid).toBe(true);
    expect(resultMaxInt64.error_message).toBe('');

    // ===== 21. 範囲外：64bit 整数の最大値超過 =====
    const overMaxInt64Data = {
      field_name: 'large_id',
      field_type: 'number',
      max_value: 9223372036854775807,
      min_value: 0,
      value: 9223372036854775808,
      expected_type: 'number',
    };
    const resultOverMaxInt64 = validateSalesDataTypeCompatibility(overMaxInt64Data);
    expect(resultOverMaxInt64.is_valid).toBe(false);
    expect(resultOverMaxInt64.error_message).toMatch(/最大値/);

    // ===== 22. 小数精度検証：4 捨 5 入 =====
    const decimalPrecisionData = {
      field_name: 'unit_price',
      field_type: 'number',
      decimal_places: 2,
      value: 100.125,
      expected_type: 'number',
    };
    const resultDecimalPrecision = validateSalesDataTypeCompatibility(decimalPrecisionData);
    expect(resultDecimalPrecision.is_valid).toBe(true);
    expect(resultDecimalPrecision.rounded_value).toBe(100.13);

    // ===== 23. UTF-8 マルチバイト文字の長さ計算 =====
    const multibyteCharData = {
      field_name: 'customer_name',
      field_type: 'string',
      max_length: 20,
      value: '顧客名テスト',
      expected_type: 'string',
    };
    const resultMultibyteChar = validateSalesDataTypeCompatibility(multibyteCharData);
    expect(resultMultibyteChar.is_valid).toBe(true);
    expect(resultMultibyteChar.byte_length).toBe(18);

    // ===== 24. 空白を含む文字列の処理 =====
    const whitespaceData = {
      field_name: 'product_name',
      field_type: 'string',
      max_length: 100,
      value: '   Product Name   ',
      expected_type: 'string',
      trim_option: 'preserve',
    };
    const resultWhitespace = validateSalesDataTypeCompatibility(whitespaceData);
    expect(resultWhitespace.is_valid).toBe(true);
    expect(resultWhitespace.value_after_processing).toBe('   Product Name   ');

    // ===== 25. 変換結果が営業システムとCRM間で同じバージョン規準を満たすこと =====
    const versionCompatibilityData = {
      field_name: 'sales_amount',
      field_type: 'number',
      value: 7500.75,
      expected_type: 'number',
      crm_field_name: 'amount',
      crm_expected_type: 'decimal',
      crm_api_version: 'v2.0',
      sales_system_version: 'v2.0',
    };
    const resultVersionCompatibility = validateSalesDataTypeCompatibility(versionCompatibilityData);
    expect(resultVersionCompatibility.is_valid).toBe(true);
    expect(resultVersionCompatibility.version_compatible).toBe(true);
  });
});