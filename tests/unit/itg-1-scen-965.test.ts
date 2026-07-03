import { validateInvoice } from "../../src/logic/it-1781935279444-2-2-1";

describe("請求書自動検証機能 - 検証済み営業データから生成された請求書の形式・内容が基準を満たしている", () => {
  test("SCEN-965: 検証済み営業データから生成された請求書が全ての基準を満たしている", () => {
    // Setup: 検証済みの営業データと請求書生成パラメータ
    const validatedSalesData = {
      contractId: "CONTRACT-2024-001",
      customerId: "CUST-12345",
      customerName: "株式会社テスト",
      customerAddress: "東京都渋谷区1-1-1",
      customerPhone: "03-1234-5678",
      serviceType: "営業代行サービス",
      periodStart: "2024-01-01",
      periodEnd: "2024-01-31",
      items: [
        {
          itemId: "ITEM-001",
          itemName: "成約数",
          quantity: 5,
          unitPrice: 10000,
          amount: 50000,
        },
        {
          itemId: "ITEM-002",
          itemName: "アポイント数",
          quantity: 20,
          unitPrice: 5000,
          amount: 100000,
        },
      ],
      subtotalAmount: 150000,
      taxRate: 0.1,
      taxAmount: 15000,
      totalAmount: 165000,
      paymentDeadline: "2024-02-15",
      paymentMethod: "銀行振込",
      invoiceNumber: "INV-2024-001",
      issueDate: "2024-02-01",
      companyStampRequired: true,
      signatureRequired: true,
    };

    const generatedInvoice = {
      fileFormat: "application/pdf",
      fileName: "INV-2024-001_20240201.pdf",
      headerInfo: {
        invoiceNumber: "INV-2024-001",
        issueDate: "2024-02-01",
        paymentDeadline: "2024-02-15",
      },
      billToInfo: {
        customerName: "株式会社テスト",
        address: "東京都渋谷区1-1-1",
        phone: "03-1234-5678",
      },
      lineItems: [
        {
          itemName: "成約数",
          quantity: 5,
          unitPrice: 10000,
          itemAmount: 50000,
        },
        {
          itemName: "アポイント数",
          quantity: 20,
          unitPrice: 5000,
          itemAmount: 100000,
        },
      ],
      calculations: {
        subtotal: 150000,
        taxRate: 0.1,
        taxAmount: 15000,
        total: 165000,
      },
      paymentTerms: {
        deadline: "2024-02-15",
        method: "銀行振込",
      },
      complianceChecks: {
        stampAreaPresent: true,
        signatureAreaPresent: true,
        allMandatoryFieldsPresent: true,
        layoutConformsToStandard: true,
      },
    };

    const validationResult = validateInvoice(validatedSalesData, generatedInvoice);

    // Assertion: ファイル形式の確認
    expect(validationResult.fileFormatValid).toBe(true);
    expect(validationResult.fileFormat).toBe("application/pdf");

    // Assertion: ヘッダー情報の正確性
    expect(validationResult.headerFieldsValid).toBe(true);
    expect(validationResult.headerValidation.invoiceNumberMatch).toBe(true);
    expect(validationResult.headerValidation.invoiceNumberValue).toBe(
      "INV-2024-001"
    );
    expect(validationResult.headerValidation.issueDateMatch).toBe(true);
    expect(validationResult.headerValidation.issueDateValue).toBe("2024-02-01");
    expect(validationResult.headerValidation.deadlineMatch).toBe(true);
    expect(validationResult.headerValidation.deadlineValue).toBe("2024-02-15");

    // Assertion: 請求先情報の正確性
    expect(validationResult.billToInfoValid).toBe(true);
    expect(validationResult.billToValidation.customerNameMatch).toBe(true);
    expect(validationResult.billToValidation.customerName).toBe("株式会社テスト");
    expect(validationResult.billToValidation.addressMatch).toBe(true);
    expect(validationResult.billToValidation.address).toBe("東京都渋谷区1-1-1");
    expect(validationResult.billToValidation.phoneMatch).toBe(true);
    expect(validationResult.billToValidation.phone).toBe("03-1234-5678");

    // Assertion: 項目詳細と営業データの一致
    expect(validationResult.lineItemsValid).toBe(true);
    expect(validationResult.lineItemsValidation.itemCount).toBe(2);
    expect(validationResult.lineItemsValidation.allItemsMatchSource).toBe(true);
    expect(validationResult.lineItemsValidation.items[0].nameMatch).toBe(true);
    expect(validationResult.lineItemsValidation.items[0].quantityMatch).toBe(true);
    expect(validationResult.lineItemsValidation.items[0].quantityValue).toBe(5);
    expect(validationResult.lineItemsValidation.items[0].unitPriceMatch).toBe(
      true
    );
    expect(validationResult.lineItemsValidation.items[0].unitPriceValue).toBe(
      10000
    );
    expect(validationResult.lineItemsValidation.items[0].amountMatch).toBe(true);
    expect(validationResult.lineItemsValidation.items[0].amountValue).toBe(50000);
    expect(validationResult.lineItemsValidation.items[1].nameMatch).toBe(true);
    expect(validationResult.lineItemsValidation.items[1].quantityMatch).toBe(true);
    expect(validationResult.lineItemsValidation.items[1].quantityValue).toBe(20);
    expect(validationResult.lineItemsValidation.items[1].unitPriceMatch).toBe(
      true
    );
    expect(validationResult.lineItemsValidation.items[1].unitPriceValue).toBe(
      5000
    );
    expect(validationResult.lineItemsValidation.items[1].amountMatch).toBe(true);
    expect(validationResult.lineItemsValidation.items[1].amountValue).toBe(100000);

    // Assertion: 金額計算の正確性
    expect(validationResult.calculationsValid).toBe(true);
    expect(validationResult.calculationValidation.subtotalCorrect).toBe(true);
    expect(validationResult.calculationValidation.subtotalValue).toBe(150000);
    expect(validationResult.calculationValidation.taxCalculationCorrect).toBe(
      true
    );
    expect(validationResult.calculationValidation.taxAmount).toBe(15000);
    expect(validationResult.calculationValidation.totalCorrect).toBe(true);
    expect(validationResult.calculationValidation.totalAmount).toBe(165000);

    // Assertion: レイアウトと企業基準への準拠
    expect(validationResult.layoutConformanceValid).toBe(true);
    expect(validationResult.layoutConformance.standardLayoutApplied).toBe(true);
    expect(validationResult.layoutConformance.fontCompliant).toBe(true);
    expect(validationResult.layoutConformance.positioningCorrect).toBe(true);

    // Assertion: 支払い条件情報の正確性
    expect(validationResult.paymentTermsValid).toBe(true);
    expect(validationResult.paymentTermsValidation.deadlineCorrect).toBe(true);
    expect(validationResult.paymentTermsValidation.deadline).toBe("2024-02-15");
    expect(validationResult.paymentTermsValidation.methodCorrect).toBe(true);
    expect(validationResult.paymentTermsValidation.method).toBe("銀行振込");

    // Assertion: 必須項目の完備
    expect(validationResult.mandatoryFieldsComplete).toBe(true);
    expect(validationResult.mandatoryFieldsValidation.stampAreaPresent).toBe(
      true
    );
    expect(validationResult.mandatoryFieldsValidation.signatureAreaPresent).toBe(
      true
    );
    expect(validationResult.mandatoryFieldsValidation.allMandatoryPresent).toBe(
      true
    );

    // Assertion: 全体検証結果
    expect(validationResult.overallValid).toBe(true);
    expect(validationResult.validationStatus).toBe("PASSED");
    expect(validationResult.errorCount).toBe(0);
    expect(validationResult.warningCount).toBe(0);
  });
});