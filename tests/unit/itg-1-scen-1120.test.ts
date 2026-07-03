import { validateStandardFormatConversion } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  // SCEN-1120: [error] 標準フォーマット変換ルール検証 - 変換後のデータが標準フォーマットの制約を超える場合にエラーが返される
  test('should return error when converted data exceeds standard format constraints', () => {
    const conversionRule = {
      sourceFieldName: 'appointmentCount',
      targetFieldName: 'アポ数',
      dataType: 'number',
      maxLength: 5,
      minValue: 0,
      maxValue: 9999,
    };

    const testData = {
      appointmentCount: 15000,
    };

    const result = validateStandardFormatConversion(conversionRule, testData);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('FORMAT_CONSTRAINT_VIOLATION');
    expect(result.errorMessage).toMatch(/アポ数/);
    expect(result.errorMessage).toMatch(/9999/);
    expect(result.errorMessage).toMatch(/15000/);
    expect(result.details).toBeDefined();
    expect(result.details.fieldName).toBe('アポ数');
    expect(result.details.violatedConstraint).toBe('maxValue');
    expect(result.details.constraintValue).toBe(9999);
    expect(result.details.actualValue).toBe(15000);
    expect(result.processInterrupted).toBe(true);
  });

  test('should return error when string length exceeds maximum', () => {
    const conversionRule = {
      sourceFieldName: 'customerName',
      targetFieldName: '顧客名',
      dataType: 'string',
      maxLength: 50,
      minLength: 1,
    };

    const testData = {
      customerName: 'a'.repeat(51),
    };

    const result = validateStandardFormatConversion(conversionRule, testData);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('FORMAT_CONSTRAINT_VIOLATION');
    expect(result.errorMessage).toMatch(/顧客名/);
    expect(result.errorMessage).toMatch(/50/);
    expect(result.details).toBeDefined();
    expect(result.details.fieldName).toBe('顧客名');
    expect(result.details.violatedConstraint).toBe('maxLength');
    expect(result.details.constraintValue).toBe(50);
    expect(result.details.actualValue).toBe(51);
    expect(result.processInterrupted).toBe(true);
  });

  test('should return error when numeric value is below minimum', () => {
    const conversionRule = {
      sourceFieldName: 'contractAmount',
      targetFieldName: '契約金額',
      dataType: 'number',
      minValue: 100,
      maxValue: 1000000,
    };

    const testData = {
      contractAmount: 50,
    };

    const result = validateStandardFormatConversion(conversionRule, testData);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('FORMAT_CONSTRAINT_VIOLATION');
    expect(result.errorMessage).toMatch(/契約金額/);
    expect(result.errorMessage).toMatch(/100/);
    expect(result.details).toBeDefined();
    expect(result.details.fieldName).toBe('契約金額');
    expect(result.details.violatedConstraint).toBe('minValue');
    expect(result.details.constraintValue).toBe(100);
    expect(result.details.actualValue).toBe(50);
    expect(result.processInterrupted).toBe(true);
  });

  test('should return error when string length is below minimum', () => {
    const conversionRule = {
      sourceFieldName: 'contractId',
      targetFieldName: '契約ID',
      dataType: 'string',
      minLength: 5,
      maxLength: 20,
    };

    const testData = {
      contractId: 'AB',
    };

    const result = validateStandardFormatConversion(conversionRule, testData);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('FORMAT_CONSTRAINT_VIOLATION');
    expect(result.errorMessage).toMatch(/契約ID/);
    expect(result.errorMessage).toMatch(/5/);
    expect(result.details).toBeDefined();
    expect(result.details.fieldName).toBe('契約ID');
    expect(result.details.violatedConstraint).toBe('minLength');
    expect(result.details.constraintValue).toBe(5);
    expect(result.details.actualValue).toBe(2);
    expect(result.processInterrupted).toBe(true);
  });

  test('should return error for multiple constraint violations in single field', () => {
    const conversionRule = {
      sourceFieldName: 'performanceRating',
      targetFieldName: '実績評価',
      dataType: 'number',
      minValue: 1,
      maxValue: 5,
      allowedValues: [1, 2, 3, 4, 5],
    };

    const testData = {
      performanceRating: 10,
    };

    const result = validateStandardFormatConversion(conversionRule, testData);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('FORMAT_CONSTRAINT_VIOLATION');
    expect(result.errorMessage).toMatch(/実績評価/);
    expect(result.details).toBeDefined();
    expect(result.details.fieldName).toBe('実績評価');
    expect(result.processInterrupted).toBe(true);
  });

  test('should return success when data satisfies all constraints', () => {
    const conversionRule = {
      sourceFieldName: 'appointmentCount',
      targetFieldName: 'アポ数',
      dataType: 'number',
      minValue: 0,
      maxValue: 9999,
    };

    const testData = {
      appointmentCount: 100,
    };

    const result = validateStandardFormatConversion(conversionRule, testData);

    expect(result.success).toBe(true);
    expect(result.errorCode).toBeUndefined();
    expect(result.processInterrupted).toBe(false);
    expect(result.convertedValue).toBe(100);
  });

  test('should include all constraint violation details in error response', () => {
    const conversionRule = {
      sourceFieldName: 'salesAmount',
      targetFieldName: '売上金額',
      dataType: 'number',
      minValue: 1000,
      maxValue: 500000,
      precision: 2,
    };

    const testData = {
      salesAmount: 999999,
    };

    const result = validateStandardFormatConversion(conversionRule, testData);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('FORMAT_CONSTRAINT_VIOLATION');
    expect(result.details).toHaveProperty('fieldName');
    expect(result.details).toHaveProperty('violatedConstraint');
    expect(result.details).toHaveProperty('constraintValue');
    expect(result.details).toHaveProperty('actualValue');
    expect(result.processInterrupted).toBe(true);
  });
});