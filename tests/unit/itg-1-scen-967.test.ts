import { describe, test, expect } from '@jest/globals';
import { validateInvoiceAmount } from '../../src/logic/it-1781935279444-2-2-1';

describe('Invoice Amount Boundary Validation', () => {
  // SCEN-967
  test('should validate invoice amounts at 1-yen precision with rounding consistency', () => {
    const standardAmount = 10000.00;
    const toleranceYen = 0.00;

    // Test 1: Exact match (10,000.00)
    const result_exact = validateInvoiceAmount({
      invoiceAmount: 10000.00,
      standardAmount: standardAmount,
      toleranceYen: toleranceYen,
    });
    expect(result_exact).toEqual({
      isValid: true,
      deviation: 0.00,
      status: '検証OK',
      roundedAmount: 10000.00,
    });

    // Test 2: Positive deviation of +0.01 yen (10,000.01)
    const result_plus_one_cent = validateInvoiceAmount({
      invoiceAmount: 10000.01,
      standardAmount: standardAmount,
      toleranceYen: toleranceYen,
    });
    expect(result_plus_one_cent).toEqual({
      isValid: false,
      deviation: 0.01,
      status: 'エラー',
      roundedAmount: 10000.01,
    });

    // Test 3: Negative deviation of -0.01 yen (9,999.99)
    const result_minus_one_cent = validateInvoiceAmount({
      invoiceAmount: 9999.99,
      standardAmount: standardAmount,
      toleranceYen: toleranceYen,
    });
    expect(result_minus_one_cent).toEqual({
      isValid: false,
      deviation: -0.01,
      status: 'エラー',
      roundedAmount: 9999.99,
    });

    // Test 4: Third decimal place rounding (10,000.005) - rounds to 10,000.01 with banker's rounding
    const result_third_decimal_five = validateInvoiceAmount({
      invoiceAmount: 10000.005,
      standardAmount: standardAmount,
      toleranceYen: toleranceYen,
    });
    expect(result_third_decimal_five).toEqual({
      isValid: false,
      deviation: 0.01,
      status: 'エラー',
      roundedAmount: 10000.01,
    });

    // Test 5: Third decimal place 4 (10,000.004) - rounds down to 10,000.00
    const result_third_decimal_four = validateInvoiceAmount({
      invoiceAmount: 10000.004,
      standardAmount: standardAmount,
      toleranceYen: toleranceYen,
    });
    expect(result_third_decimal_four).toEqual({
      isValid: true,
      deviation: 0.00,
      status: '検証OK',
      roundedAmount: 10000.00,
    });

    // Test 6: Third decimal place 6 (10,000.006) - rounds up to 10,000.01
    const result_third_decimal_six = validateInvoiceAmount({
      invoiceAmount: 10000.006,
      standardAmount: standardAmount,
      toleranceYen: toleranceYen,
    });
    expect(result_third_decimal_six).toEqual({
      isValid: false,
      deviation: 0.01,
      status: 'エラー',
      roundedAmount: 10000.01,
    });

    // Test 7: Batch validation with multiple invoices - all deviations recorded
    const batch_results = validateInvoiceAmount({
      invoiceAmount: [10000.00, 10000.01, 9999.99, 10000.005, 10000.004],
      standardAmount: standardAmount,
      toleranceYen: toleranceYen,
      isBatch: true,
    });
    expect(batch_results).toEqual({
      totalInvoices: 5,
      validCount: 2,
      invalidCount: 3,
      deviations: [0.00, 0.01, -0.01, 0.01, 0.00],
      roundedAmounts: [10000.00, 10000.01, 9999.99, 10000.01, 10000.00],
      allValid: false,
      statusSummary: [
        '検証OK',
        'エラー',
        'エラー',
        'エラー',
        '検証OK',
      ],
    });

    // Test 8: Verify that tolerance can be adjusted
    const result_with_tolerance = validateInvoiceAmount({
      invoiceAmount: 10000.01,
      standardAmount: standardAmount,
      toleranceYen: 0.01,
    });
    expect(result_with_tolerance).toEqual({
      isValid: true,
      deviation: 0.01,
      status: '検証OK',
      roundedAmount: 10000.01,
    });

    // Test 9: Edge case - negative amount (should be invalid)
    expect(() => validateInvoiceAmount({
      invoiceAmount: -10000.00,
      standardAmount: standardAmount,
      toleranceYen: toleranceYen,
    })).toThrow(/金額/);

    // Test 10: Edge case - zero standard amount (should be invalid)
    expect(() => validateInvoiceAmount({
      invoiceAmount: 10000.00,
      standardAmount: 0,
      toleranceYen: toleranceYen,
    })).toThrow(/基準額/);
  });
});