import { describe, test, expect, beforeEach } from '@jest/globals';
import { generateInvoiceWithTemplate } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレート定義管理機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-610: [error] 請求書・成果レポート自動生成機能 - テンプレートが未定義の場合にエラーが発生する
  test('テンプレートが未定義の場合にエラーが発生する', () => {
    const invoiceData = {
      customerId: 'CUST-001',
      customerName: '株式会社テスト',
      invoiceAmount: 150000,
      invoiceDate: '2024-01-15',
      serviceType: 'standard',
      billingPeriod: '2024-01',
      templateId: undefined,
      templateStatus: 'inactive'
    };

    expect(() => generateInvoiceWithTemplate(invoiceData)).toThrow(/テンプレート/);
  });
});