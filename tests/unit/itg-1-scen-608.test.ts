import { generateInvoiceAndReport } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  // SCEN-608: [normal] 請求書・成果レポート自動生成機能
  test('定義済みテンプレートに基づき請求書・成果レポートが正確に自動生成される', async () => {
    const input = {
      templateId: 'tpl_invoice_001',
      reportTemplateId: 'tpl_report_001',
      targetPeriod: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      },
      customers: [
        {
          customerId: 'cust_001',
          customerName: '顧客A企業',
          contractId: 'contract_001',
          serviceName: 'サービスA',
          unitPrice: 50000,
          quantity: 2,
          discountRate: 0.1,
        },
        {
          customerId: 'cust_002',
          customerName: '顧客B企業',
          contractId: 'contract_002',
          serviceName: 'サービスB',
          unitPrice: 75000,
          quantity: 1,
          discountRate: 0.05,
        },
      ],
      performanceMetrics: [
        {
          customerId: 'cust_001',
          appointmentCount: 10,
          contractCount: 3,
          customerResponse: 'positive',
        },
        {
          customerId: 'cust_002',
          appointmentCount: 8,
          contractCount: 2,
          customerResponse: 'neutral',
        },
      ],
      outputFormat: 'pdf',
    };

    const result = await generateInvoiceAndReport(input);

    // 生成ステータスの確認
    expect(result.status).toBe('success');

    // 請求書の生成確認
    expect(result.invoices).toHaveLength(2);
    expect(result.invoices[0]).toEqual(
      expect.objectContaining({
        customerId: 'cust_001',
        customerName: '顧客A企業',
        invoiceAmount: 90000, // (50000 * 2) * (1 - 0.1) = 90000
        invoiceDate: '2024-01-31',
        outputFormat: 'pdf',
      })
    );
    expect(result.invoices[1]).toEqual(
      expect.objectContaining({
        customerId: 'cust_002',
        customerName: '顧客B企業',
        invoiceAmount: 71250, // (75000 * 1) * (1 - 0.05) = 71250
        invoiceDate: '2024-01-31',
        outputFormat: 'pdf',
      })
    );

    // 成果レポートの生成確認
    expect(result.reports).toHaveLength(2);
    expect(result.reports[0]).toEqual(
      expect.objectContaining({
        customerId: 'cust_001',
        customerName: '顧客A企業',
        appointmentCount: 10,
        contractCount: 3,
        customerResponse: 'positive',
        reportDate: '2024-01-31',
        outputFormat: 'pdf',
      })
    );
    expect(result.reports[1]).toEqual(
      expect.objectContaining({
        customerId: 'cust_002',
        customerName: '顧客B企業',
        appointmentCount: 8,
        contractCount: 2,
        customerResponse: 'neutral',
        reportDate: '2024-01-31',
        outputFormat: 'pdf',
      })
    );

    // 請求書と成果レポートのデータ一致確認
    expect(result.invoices[0].customerName).toBe(result.reports[0].customerName);
    expect(result.invoices[0].customerId).toBe(result.reports[0].customerId);
    expect(result.invoices[1].customerName).toBe(result.reports[1].customerName);
    expect(result.invoices[1].customerId).toBe(result.reports[1].customerId);

    // PDF出力形式の確認
    expect(result.invoices[0].outputFormat).toBe('pdf');
    expect(result.invoices[1].outputFormat).toBe('pdf');
    expect(result.reports[0].outputFormat).toBe('pdf');
    expect(result.reports[1].outputFormat).toBe('pdf');

    // 一括処理の完全性確認
    expect(result.invoices.every(inv => inv.invoiceDate === '2024-01-31')).toBe(true);
    expect(result.reports.every(rep => rep.reportDate === '2024-01-31')).toBe(true);

    // テンプレート適用確認
    expect(result.appliedTemplates).toEqual({
      invoiceTemplate: 'tpl_invoice_001',
      reportTemplate: 'tpl_report_001',
    });

    // 生成ファイル情報の確認
    expect(result.generatedFiles).toBeDefined();
    expect(result.generatedFiles.invoiceFiles).toHaveLength(2);
    expect(result.generatedFiles.reportFiles).toHaveLength(2);
    expect(result.generatedFiles.invoiceFiles[0]).toMatch(/\.pdf$/);
    expect(result.generatedFiles.reportFiles[0]).toMatch(/\.pdf$/);
  });
});