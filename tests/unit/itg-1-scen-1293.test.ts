import { validatePaymentProcessing } from '../../src/logic/it-1781935279444-2-2-1';

describe('Payment Processing Execution and Hold Judgment - Multiple Approval Criteria at Boundary Values', () => {
  // SCEN-1293
  test('should determine payment execution or hold status based on comprehensive judgment logic when multiple approval criteria are at boundary values', () => {
    // Test data: Multiple approval criteria items set at boundary values
    const paymentApplicationData = {
      applicationId: 'PAY-2024-001',
      salesAmount: 1000000, // Boundary value: minimum threshold
      customerCreditScore: 700, // Boundary value: minimum passing score
      invoiceIntegrityScore: 85, // Boundary value: minimum acceptable score
      invoiceMatchingStatus: true,
      applicantName: 'test_operator',
      applicationDate: '2024-01-15T09:00:00Z',
    };

    // Execute payment processing judgment
    const result = validatePaymentProcessing(paymentApplicationData);

    // Verify comprehensive judgment logic correctly evaluates boundary values
    expect(result).toEqual({
      applicationId: 'PAY-2024-001',
      judgmentStatus: 'APPROVED', // Expected result based on weighted calculation rule
      salesAmountApproval: true,
      creditScoreApproval: true,
      invoiceIntegrityApproval: true,
      invoiceMatchingApproval: true,
      weightedScore: 85, // (1000000 >= threshold) * 0.25 * 100 + (700 >= threshold) * 0.25 * 100 + (85 >= threshold) * 0.25 * 100 + (true) * 0.25 * 100 = 85
      finalDecision: 'EXECUTE_PAYMENT',
      processLog: expect.arrayContaining([
        expect.objectContaining({
          timestamp: expect.any(String),
          criterionName: 'salesAmount',
          value: 1000000,
          threshold: 1000000,
          result: 'PASS',
        }),
        expect.objectContaining({
          timestamp: expect.any(String),
          criterionName: 'creditScore',
          value: 700,
          threshold: 700,
          result: 'PASS',
        }),
        expect.objectContaining({
          timestamp: expect.any(String),
          criterionName: 'invoiceIntegrity',
          value: 85,
          threshold: 85,
          result: 'PASS',
        }),
        expect.objectContaining({
          timestamp: expect.any(String),
          criterionName: 'invoiceMatching',
          value: true,
          threshold: true,
          result: 'PASS',
        }),
        expect.objectContaining({
          timestamp: expect.any(String),
          stage: 'comprehensive_judgment',
          weightedScore: 85,
          decision: 'EXECUTE_PAYMENT',
        }),
      ]),
    });

    // Verify that judgment process log is complete and recorded
    expect(result.processLog.length).toBeGreaterThanOrEqual(5);
    expect(result.processLog[result.processLog.length - 1]).toEqual(
      expect.objectContaining({
        stage: 'comprehensive_judgment',
        weightedScore: 85,
        decision: 'EXECUTE_PAYMENT',
      })
    );
  });

  // Edge case: One criterion below boundary, others at or above
  test('should place payment on hold when one approval criterion falls below boundary value', () => {
    const paymentApplicationData = {
      applicationId: 'PAY-2024-002',
      salesAmount: 999999, // Below boundary: minimum threshold is 1000000
      customerCreditScore: 700, // At boundary
      invoiceIntegrityScore: 85, // At boundary
      invoiceMatchingStatus: true,
      applicantName: 'test_operator',
      applicationDate: '2024-01-15T10:00:00Z',
    };

    const result = validatePaymentProcessing(paymentApplicationData);

    expect(result).toEqual({
      applicationId: 'PAY-2024-002',
      judgmentStatus: 'CONDITIONAL', // Below threshold on one criterion
      salesAmountApproval: false,
      creditScoreApproval: true,
      invoiceIntegrityApproval: true,
      invoiceMatchingApproval: true,
      weightedScore: 75, // (false) * 0.25 * 100 + (true) * 0.25 * 100 + (true) * 0.25 * 100 + (true) * 0.25 * 100 = 75
      finalDecision: 'HOLD_PAYMENT',
      processLog: expect.arrayContaining([
        expect.objectContaining({
          criterionName: 'salesAmount',
          value: 999999,
          threshold: 1000000,
          result: 'FAIL',
        }),
      ]),
    });

    expect(result.finalDecision).toBe('HOLD_PAYMENT');
  });

  // Edge case: All criteria at exact boundary minimum
  test('should execute payment when all criteria are exactly at minimum thresholds', () => {
    const paymentApplicationData = {
      applicationId: 'PAY-2024-003',
      salesAmount: 1000000,
      customerCreditScore: 700,
      invoiceIntegrityScore: 85,
      invoiceMatchingStatus: true,
      applicantName: 'test_operator',
      applicationDate: '2024-01-15T11:00:00Z',
    };

    const result = validatePaymentProcessing(paymentApplicationData);

    expect(result.weightedScore).toBe(100);
    expect(result.finalDecision).toBe('EXECUTE_PAYMENT');
    expect(result.judgmentStatus).toBe('APPROVED');
    expect(result.processLog).toBeDefined();
    expect(result.processLog.length).toBeGreaterThanOrEqual(5);
  });

  // Error case: Missing required field
  test('should throw error when required payment criterion field is missing', () => {
    const incompletePaymentData = {
      applicationId: 'PAY-2024-004',
      salesAmount: 1000000,
      customerCreditScore: 700,
      // Missing invoiceIntegrityScore
      invoiceMatchingStatus: true,
    };

    expect(() => validatePaymentProcessing(incompletePaymentData as any)).toThrow(/invoiceIntegrity/);
  });

  // Error case: Invalid data type
  test('should throw error when approval criterion value has incorrect data type', () => {
    const invalidPaymentData = {
      applicationId: 'PAY-2024-005',
      salesAmount: '1000000', // Should be number
      customerCreditScore: 700,
      invoiceIntegrityScore: 85,
      invoiceMatchingStatus: true,
    };

    expect(() => validatePaymentProcessing(invalidPaymentData as any)).toThrow(/salesAmount/);
  });

  // Edge case: Weighted calculation with mixed results
  test('should calculate weighted score correctly when some criteria pass and others are conditional', () => {
    const paymentApplicationData = {
      applicationId: 'PAY-2024-006',
      salesAmount: 1000000, // Pass: 0.25
      customerCreditScore: 650, // Fail (below 700): 0
      invoiceIntegrityScore: 85, // Pass: 0.25
      invoiceMatchingStatus: true, // Pass: 0.25
      applicantName: 'test_operator',
      applicationDate: '2024-01-15T12:00:00Z',
    };

    const result = validatePaymentProcessing(paymentApplicationData);

    // Weighted score: 0.25 + 0 + 0.25 + 0.25 = 0.75 = 75 out of 100
    expect(result.weightedScore).toBe(75);
    expect(result.finalDecision).toBe('HOLD_PAYMENT');
    expect(result.creditScoreApproval).toBe(false);
  });
});