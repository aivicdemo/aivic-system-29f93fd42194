import { validateInvoiceChecklist } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('Monthly Summary Template Definition and Management - Invoice Checklist Validation', () => {
  test('SCEN-889: [normal] Invoice creation checklist validation - all items meet criteria and marked complete', () => {
    // Test data: Invoice with all required fields properly populated
    const invoiceData = {
      invoiceNumber: 'INV-2024-001',
      customerId: 'CUST-12345',
      customerName: 'テスト顧客株式会社',
      customerAddress: '東京都渋谷区1-2-3',
      customerContactPhone: '03-1234-5678',
      customerContactEmail: 'contact@test-customer.co.jp',
      invoiceDate: new Date('2024-01-15T00:00:00Z'),
      dueDate: new Date('2024-02-15T00:00:00Z'),
      paymentTerms: '末日払い',
      lineItems: [
        {
          itemId: 'ITEM-001',
          description: 'サービスA',
          quantity: 10,
          unitPrice: 5000,
          amount: 50000,
        },
        {
          itemId: 'ITEM-002',
          description: 'サービスB',
          quantity: 5,
          unitPrice: 8000,
          amount: 40000,
        },
      ],
      subtotal: 90000,
      taxRate: 0.1,
      taxAmount: 9000,
      handlingFee: 1000,
      totalAmount: 100000,
      attachments: ['estimate_ref_001.pdf', 'contract_ref_001.pdf'],
      notes: 'Standard invoice for monthly service delivery',
      status: 'pending',
    };

    const checklistValidationResult = validateInvoiceChecklist(invoiceData);

    // Verify customer information validation passed
    expect(checklistValidationResult.checks.customerValidation.passed).toBe(true);
    expect(checklistValidationResult.checks.customerValidation.details.nameExists).toBe(true);
    expect(checklistValidationResult.checks.customerValidation.details.addressExists).toBe(true);
    expect(checklistValidationResult.checks.customerValidation.details.contactInfoExists).toBe(true);

    // Verify invoice content validation passed
    expect(checklistValidationResult.checks.invoiceContentValidation.passed).toBe(true);
    expect(checklistValidationResult.checks.invoiceContentValidation.details.lineItemsCount).toBe(2);
    expect(checklistValidationResult.checks.invoiceContentValidation.details.allAmountsCalculated).toBe(true);

    // Verify tax and fee calculation validation passed
    expect(checklistValidationResult.checks.taxFeeValidation.passed).toBe(true);
    expect(checklistValidationResult.checks.taxFeeValidation.details.calculatedTax).toBe(9000);
    expect(checklistValidationResult.checks.taxFeeValidation.details.taxCalculationCorrect).toBe(true);
    expect(checklistValidationResult.checks.taxFeeValidation.details.totalAmountCorrect).toBe(true);
    expect(checklistValidationResult.checks.taxFeeValidation.details.verifiedTotal).toBe(100000);

    // Verify payment date and terms validation passed
    expect(checklistValidationResult.checks.paymentTermsValidation.passed).toBe(true);
    expect(checklistValidationResult.checks.paymentTermsValidation.details.dueDateSet).toBe(true);
    expect(checklistValidationResult.checks.paymentTermsValidation.details.paymentTermsDefined).toBe(true);

    // Verify invoice numbering rule validation passed
    expect(checklistValidationResult.checks.invoiceNumberingValidation.passed).toBe(true);
    expect(checklistValidationResult.checks.invoiceNumberingValidation.details.numberFormatValid).toBe(true);
    expect(checklistValidationResult.checks.invoiceNumberingValidation.details.numberingRuleApplied).toBe(true);
    expect(checklistValidationResult.checks.invoiceNumberingValidation.details.invoiceNumber).toBe('INV-2024-001');

    // Verify attachments validation passed
    expect(checklistValidationResult.checks.attachmentsValidation.passed).toBe(true);
    expect(checklistValidationResult.checks.attachmentsValidation.details.attachmentsPresent).toBe(true);
    expect(checklistValidationResult.checks.attachmentsValidation.details.attachmentCount).toBe(2);

    // Verify all checklist items passed
    expect(checklistValidationResult.allChecksPassed).toBe(true);

    // Verify overall status is complete
    expect(checklistValidationResult.finalStatus).toBe('complete');
    expect(checklistValidationResult.approved).toBe(true);

    // Verify validation log entries exist
    expect(checklistValidationResult.validationLog).toBeDefined();
    expect(checklistValidationResult.validationLog.length).toBeGreaterThan(0);
    expect(checklistValidationResult.validationLog[0]).toMatch(/customer information/i);

    // Verify invoice is in approvable state
    expect(checklistValidationResult.readyForApproval).toBe(true);
    expect(checklistValidationResult.readyForSubmission).toBe(true);
  });
});