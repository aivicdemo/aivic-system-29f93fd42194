import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { distributeDocumentsToCustomers } from '../../src/logic/it-1-2-1';

const fetchMock = require('jest-fetch-mock');

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-946
  test('請求書・報告書配信機能 - 顧客企業の種別・契約内容・配信先設定に基づき、正しい形式・タイミング・宛先で配信される', async () => {
    // テスト用の顧客企業データを準備
    const corporateCustomers = [
      {
        customer_id: 'CUST-001',
        customer_type: 'corporate',
        contract_type: 'standard',
        billing_amount: 150000,
        report_amount: 0,
        distribution_email: 'corporate@example.com',
        distribution_method: 'email',
        distribution_format: 'pdf',
        scheduled_datetime: '2024-01-25T09:00:00Z'
      },
      {
        customer_id: 'CUST-002',
        customer_type: 'corporate',
        contract_type: 'premium',
        billing_amount: 300000,
        report_amount: 0,
        distribution_email: 'premium@example.com',
        distribution_method: 'email',
        distribution_format: 'excel',
        scheduled_datetime: '2024-01-25T10:00:00Z'
      }
    ];

    const individualCustomers = [
      {
        customer_id: 'CUST-003',
        customer_type: 'individual',
        contract_type: 'standard',
        billing_amount: 50000,
        report_amount: 0,
        distribution_email: 'individual@example.com',
        distribution_method: 'portal',
        distribution_format: 'pdf',
        scheduled_datetime: '2024-01-25T11:00:00Z'
      }
    ];

    const allCustomers = [...corporateCustomers, ...individualCustomers];

    // 配信スケジューラーの実行と配信処理のモック
    const billingDocuments = allCustomers.map(customer => ({
      customer_id: customer.customer_id,
      document_type: 'billing',
      amount: customer.billing_amount,
      format: customer.distribution_format,
      content: `Billing document for ${customer.customer_id}`
    }));

    const reportDocuments = allCustomers.map(customer => ({
      customer_id: customer.customer_id,
      document_type: 'report',
      amount: customer.report_amount,
      format: customer.distribution_format,
      content: `Report document for ${customer.customer_id}`
    }));

    const allDocuments = [...billingDocuments, ...reportDocuments];

    // API レスポンスのモック
    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        distributed_documents: allDocuments,
        distribution_logs: allCustomers.map(customer => ({
          customer_id: customer.customer_id,
          customer_type: customer.customer_type,
          contract_type: customer.contract_type,
          distribution_method: customer.distribution_method,
          distribution_format: customer.distribution_format,
          recipient_email: customer.distribution_email,
          scheduled_datetime: customer.scheduled_datetime,
          actual_datetime: customer.scheduled_datetime,
          status: 'success',
          documents_sent: 2
        }))
      }),
      { status: 200 }
    );

    // 配信処理を実行
    const result = await distributeDocumentsToCustomers({
      customers: allCustomers,
      documents: allDocuments,
      execution_date: '2024-01-25'
    });

    // 配信結果の検証
    expect(result.success).toBe(true);
    expect(result.distributed_documents).toHaveLength(6);

    // 各顧客企業への配信検証
    const corporateDistributionLog1 = result.distribution_logs.find(
      log => log.customer_id === 'CUST-001'
    );
    expect(corporateDistributionLog1).toBeDefined();
    expect(corporateDistributionLog1.customer_type).toBe('corporate');
    expect(corporateDistributionLog1.contract_type).toBe('standard');
    expect(corporateDistributionLog1.distribution_format).toBe('pdf');
    expect(corporateDistributionLog1.recipient_email).toBe('corporate@example.com');
    expect(corporateDistributionLog1.distribution_method).toBe('email');
    expect(corporateDistributionLog1.scheduled_datetime).toBe('2024-01-25T09:00:00Z');
    expect(corporateDistributionLog1.actual_datetime).toBe('2024-01-25T09:00:00Z');
    expect(corporateDistributionLog1.status).toBe('success');
    expect(corporateDistributionLog1.documents_sent).toBe(2);

    // プレミアム顧客企業の配信検証（Excel形式）
    const corporateDistributionLog2 = result.distribution_logs.find(
      log => log.customer_id === 'CUST-002'
    );
    expect(corporateDistributionLog2).toBeDefined();
    expect(corporateDistributionLog2.customer_type).toBe('corporate');
    expect(corporateDistributionLog2.contract_type).toBe('premium');
    expect(corporateDistributionLog2.distribution_format).toBe('excel');
    expect(corporateDistributionLog2.recipient_email).toBe('premium@example.com');
    expect(corporateDistributionLog2.distribution_method).toBe('email');
    expect(corporateDistributionLog2.scheduled_datetime).toBe('2024-01-25T10:00:00Z');
    expect(corporateDistributionLog2.actual_datetime).toBe('2024-01-25T10:00:00Z');
    expect(corporateDistributionLog2.status).toBe('success');
    expect(corporateDistributionLog2.documents_sent).toBe(2);

    // 個人顧客の配信検証（ポータル配信）
    const individualDistributionLog = result.distribution_logs.find(
      log => log.customer_id === 'CUST-003'
    );
    expect(individualDistributionLog).toBeDefined();
    expect(individualDistributionLog.customer_type).toBe('individual');
    expect(individualDistributionLog.contract_type).toBe('standard');
    expect(individualDistributionLog.distribution_format).toBe('pdf');
    expect(individualDistributionLog.recipient_email).toBe('individual@example.com');
    expect(individualDistributionLog.distribution_method).toBe('portal');
    expect(individualDistributionLog.scheduled_datetime).toBe('2024-01-25T11:00:00Z');
    expect(individualDistributionLog.actual_datetime).toBe('2024-01-25T11:00:00Z');
    expect(individualDistributionLog.status).toBe('success');
    expect(individualDistributionLog.documents_sent).toBe(2);

    // 配信ログの全体検証
    expect(result.distribution_logs).toHaveLength(3);
    expect(result.distribution_logs.every(log => log.status === 'success')).toBe(true);

    // 配信されたドキュメントの形式検証
    const billingDoc1 = result.distributed_documents.find(
      doc => doc.customer_id === 'CUST-001' && doc.document_type === 'billing'
    );
    expect(billingDoc1).toBeDefined();
    expect(billingDoc1.format).toBe('pdf');
    expect(billingDoc1.amount).toBe(150000);

    const billingDoc2 = result.distributed_documents.find(
      doc => doc.customer_id === 'CUST-002' && doc.document_type === 'billing'
    );
    expect(billingDoc2).toBeDefined();
    expect(billingDoc2.format).toBe('excel');
    expect(billingDoc2.amount).toBe(300000);

    const billingDoc3 = result.distributed_documents.find(
      doc => doc.customer_id === 'CUST-003' && doc.document_type === 'billing'
    );
    expect(billingDoc3).toBeDefined();
    expect(billingDoc3.format).toBe('pdf');
    expect(billingDoc3.amount).toBe(50000);

    // 報告書ドキュメントの検証
    const reportDocs = result.distributed_documents.filter(
      doc => doc.document_type === 'report'
    );
    expect(reportDocs).toHaveLength(3);
    reportDocs.forEach(doc => {
      expect(doc.format).toMatch(/pdf|excel/);
      const matchingCustomer = allCustomers.find(
        c => c.customer_id === doc.customer_id
      );
      expect(doc.format).toBe(matchingCustomer.distribution_format);
    });

    // タイミング検証
    expect(corporateDistributionLog1.scheduled_datetime).toBe('2024-01-25T09:00:00Z');
    expect(corporateDistributionLog2.scheduled_datetime).toBe('2024-01-25T10:00:00Z');
    expect(individualDistributionLog.scheduled_datetime).toBe('2024-01-25T11:00:00Z');

    // 全配信ログのステータス検証
    result.distribution_logs.forEach(log => {
      expect(log.status).toBe('success');
      expect(log.documents_sent).toBe(2);
      expect(log.actual_datetime).toBeDefined();
    });
  });
});