import { validateSalesDataCompleteness } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性自動検証機能', () => {
  // SCEN-1375: [edge] 営業データ完全性・正確性自動検証機能 - 金額ゼロ・負数などの境界値が正しく検証される
  test('金額ゼロ・負数・境界値の検証が正しく実行される', () => {
    // ハッピーパス: 金額ゼロは有効な値として受け入れられる
    const zeroAmountData = {
      customer_id: 'CUST001',
      service_id: 'SVC001',
      contact_date: '2024-01-15',
      appointment_count: 5,
      contract_amount: 0,
      sales_staff_id: 'STAFF001',
      is_required_field_complete: true,
      data_type_is_valid: true,
    };
    const zeroAmountResult = validateSalesDataCompleteness(zeroAmountData);
    expect(zeroAmountResult.is_valid).toBe(true);
    expect(zeroAmountResult.validation_status).toBe('合格');
    expect(zeroAmountResult.error_details).toEqual([]);

    // エラーケース: 負数は検証エラーとして検出される
    const negativeAmountData = {
      customer_id: 'CUST002',
      service_id: 'SVC001',
      contact_date: '2024-01-15',
      appointment_count: 3,
      contract_amount: -1000,
      sales_staff_id: 'STAFF002',
      is_required_field_complete: true,
      data_type_is_valid: true,
    };
    expect(() =>
      validateSalesDataCompleteness(negativeAmountData)
    ).toThrow(/金額/);

    // ハッピーパス: 最大値境界（999999999）は有効な値として受け入れられる
    const maxBoundaryData = {
      customer_id: 'CUST003',
      service_id: 'SVC001',
      contact_date: '2024-01-15',
      appointment_count: 100,
      contract_amount: 999999999,
      sales_staff_id: 'STAFF003',
      is_required_field_complete: true,
      data_type_is_valid: true,
    };
    const maxBoundaryResult = validateSalesDataCompleteness(maxBoundaryData);
    expect(maxBoundaryResult.is_valid).toBe(true);
    expect(maxBoundaryResult.validation_status).toBe('合格');

    // エラーケース: 最大値超過（1000000000）は検証エラーとして検出される
    const exceedMaxData = {
      customer_id: 'CUST004',
      service_id: 'SVC001',
      contact_date: '2024-01-15',
      appointment_count: 50,
      contract_amount: 1000000000,
      sales_staff_id: 'STAFF004',
      is_required_field_complete: true,
      data_type_is_valid: true,
    };
    expect(() =>
      validateSalesDataCompleteness(exceedMaxData)
    ).toThrow(/上限/);

    // ハッピーパス: 最小値境界（0）は有効な値として受け入れられる
    const minBoundaryData = {
      customer_id: 'CUST005',
      service_id: 'SVC001',
      contact_date: '2024-01-15',
      appointment_count: 1,
      contract_amount: 0,
      sales_staff_id: 'STAFF005',
      is_required_field_complete: true,
      data_type_is_valid: true,
    };
    const minBoundaryResult = validateSalesDataCompleteness(minBoundaryData);
    expect(minBoundaryResult.is_valid).toBe(true);
    expect(minBoundaryResult.validation_status).toBe('合格');

    // エラーケース: 必須項目が未入力の場合
    const incompleteData = {
      customer_id: '',
      service_id: 'SVC001',
      contact_date: '2024-01-15',
      appointment_count: 2,
      contract_amount: 50000,
      sales_staff_id: 'STAFF006',
      is_required_field_complete: false,
      data_type_is_valid: true,
    };
    expect(() =>
      validateSalesDataCompleteness(incompleteData)
    ).toThrow(/必須/);

    // エラーケース: データ型が不正な場合
    const invalidTypeData = {
      customer_id: 'CUST007',
      service_id: 'SVC001',
      contact_date: 'invalid-date',
      appointment_count: 'abc',
      contract_amount: 75000,
      sales_staff_id: 'STAFF007',
      is_required_field_complete: true,
      data_type_is_valid: false,
    };
    expect(() =>
      validateSalesDataCompleteness(invalidTypeData)
    ).toThrow(/データ型/);

    // ハッピーパス: 通常の正常データは合格と判定される
    const validNormalData = {
      customer_id: 'CUST008',
      service_id: 'SVC001',
      contact_date: '2024-01-15',
      appointment_count: 8,
      contract_amount: 250000,
      sales_staff_id: 'STAFF008',
      is_required_field_complete: true,
      data_type_is_valid: true,
    };
    const validResult = validateSalesDataCompleteness(validNormalData);
    expect(validResult.is_valid).toBe(true);
    expect(validResult.validation_status).toBe('合格');
    expect(validResult.error_count).toBe(0);
    expect(validResult.error_details).toEqual([]);
  });
});