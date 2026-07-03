import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-2-1';

describe('Sales Data Quality Validation - Multiple Simultaneous Errors', () => {
  // SCEN-740
  test('should detect all quality errors simultaneously and include them in correction instructions', () => {
    // Test data with multiple quality errors
    const salesDataWithErrors = {
      recordId: 'REC-001',
      email: 'invalid-email-format',  // Email format error
      phoneNumber: '090-1234',  // Phone number digit shortage (missing 4 digits)
      address: '',  // Required field missing (address)
      amount: -5000,  // Negative value error (should be positive)
      customerName: 'Test Customer',
      salesDate: '2024-01-15',
      serviceType: 'Premium',
    };

    // Expected validation result with all errors detected
    const validationResult = validateSalesDataQuality(salesDataWithErrors);

    // Verify that all errors are detected
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.errors).toHaveLength(4);

    // Verify that all error types are included
    const errorTypes = validationResult.errors.map((err) => err.type);
    expect(errorTypes).toContain('EMAIL_FORMAT');
    expect(errorTypes).toContain('PHONE_NUMBER_LENGTH');
    expect(errorTypes).toContain('REQUIRED_FIELD_MISSING');
    expect(errorTypes).toContain('NEGATIVE_AMOUNT');

    // Verify correction instructions are generated with all errors
    const correctionInstructions = validationResult.correctionInstructions;
    expect(correctionInstructions).toBeDefined();
    expect(correctionInstructions.length).toBe(4);

    // Verify email format error correction instruction
    const emailError = correctionInstructions.find((instr) => instr.fieldName === 'email');
    expect(emailError).toBeDefined();
    expect(emailError?.errorType).toBe('EMAIL_FORMAT');
    expect(emailError?.errorDescription).toMatch(/メールアドレス形式/);
    expect(emailError?.recommendedCorrection).toBeDefined();

    // Verify phone number digit shortage error correction instruction
    const phoneError = correctionInstructions.find((instr) => instr.fieldName === 'phoneNumber');
    expect(phoneError).toBeDefined();
    expect(phoneError?.errorType).toBe('PHONE_NUMBER_LENGTH');
    expect(phoneError?.errorDescription).toMatch(/電話番号|桁数/);
    expect(phoneError?.recommendedCorrection).toBeDefined();

    // Verify required field missing error correction instruction
    const addressError = correctionInstructions.find((instr) => instr.fieldName === 'address');
    expect(addressError).toBeDefined();
    expect(addressError?.errorType).toBe('REQUIRED_FIELD_MISSING');
    expect(addressError?.errorDescription).toMatch(/必須項目|住所/);
    expect(addressError?.recommendedCorrection).toBeDefined();

    // Verify negative amount error correction instruction
    const amountError = correctionInstructions.find((instr) => instr.fieldName === 'amount');
    expect(amountError).toBeDefined();
    expect(amountError?.errorType).toBe('NEGATIVE_AMOUNT');
    expect(amountError?.errorDescription).toMatch(/金額|負|値/);
    expect(amountError?.recommendedCorrection).toBeDefined();

    // Verify correction instruction classification is accurate
    expect(correctionInstructions.every((instr) => instr.classification)).toBe(true);

    // Verify no error duplication
    const fieldNames = correctionInstructions.map((instr) => instr.fieldName);
    expect(new Set(fieldNames).size).toBe(fieldNames.length);
  });
});