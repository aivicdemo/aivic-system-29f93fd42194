import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractCustomerInquirySourceData } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 顧客質問対応根拠データ自動抽出', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1018: [normal] 顧客質問対応根拠データ自動抽出機能
  test('顧客の質問内容に対応する営業データが営業システムから正確に抽出される', () => {
    // === 前提条件 ===
    // 顧客質問: "この請求内容について詳しく知りたい"
    const customerInquiry = 'この請求内容について詳しく知りたい';
    const customerId = 'CUST-001';
    const contractId = 'CONTRACT-2024-001';
    const inquiryDate = '2024-01-15';

    // === 入力データセット ===
    // 営業システムに記録されている営業活動データ
    const salesDataSet = {
      customerId,
      contractId,
      inquiryDate,
      period: {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      },
      targetMetrics: ['apoCount', 'dealCount', 'customerResponse', 'serviceType'],
      includeHistoricalData: true
    };

    // === 実行 ===
    const extractedResult = extractCustomerInquirySourceData(
      customerInquiry,
      salesDataSet
    );

    // === 期待結果の検証 ===
    // 1. 抽出処理が成功し、結果オブジェクトが返却される
    expect(extractedResult).toBeDefined();
    expect(typeof extractedResult).toBe('object');

    // 2. 抽出されたデータが入力した顧客質問に対応している
    expect(extractedResult.matchedInquiryId).toBe(customerInquiry);
    expect(extractedResult.customerId).toBe(customerId);
    expect(extractedResult.contractId).toBe(contractId);

    // 3. 抽出されたデータに必要なすべての項目が含まれている
    expect(extractedResult.extractedFields).toEqual(
      expect.arrayContaining([
        'apoCount',
        'dealCount',
        'customerResponse',
        'serviceType'
      ])
    );

    // 4. 抽出されたデータが営業システムの最新情報と一致している
    expect(extractedResult.dataSourceVersion).toBe('latest');
    expect(extractedResult.extractionTimestamp).toBeTruthy();
    expect(typeof extractedResult.extractionTimestamp).toBe('string');

    // 5. 抽出されたデータに具体的な営業成果の値が含まれている
    expect(extractedResult.extractedData).toBeDefined();
    expect(typeof extractedResult.extractedData).toBe('object');
    expect(extractedResult.extractedData.apoCount).toBeGreaterThanOrEqual(0);
    expect(extractedResult.extractedData.dealCount).toBeGreaterThanOrEqual(0);

    // 6. 抽出プロセスに漏れや誤りがないことを確認
    expect(extractedResult.completenessScore).toBeGreaterThanOrEqual(0.95);
    expect(extractedResult.extractionStatus).toBe('success');

    // 7. 対応期間が指定期間と一致している
    expect(extractedResult.queryPeriod).toEqual({
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    });

    // 8. 抽出対象の営業データが期待される件数範囲内であることを確認
    expect(extractedResult.totalRecordsExtracted).toBeGreaterThanOrEqual(1);
    expect(extractedResult.totalRecordsExtracted).toBeLessThanOrEqual(1000);

    // === エラーテスト ===
    // 顧客IDが不正な場合
    const invalidSalesDataSet = {
      customerId: '', // 空文字列（不正）
      contractId: 'CONTRACT-2024-001',
      inquiryDate: '2024-01-15',
      period: {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      },
      targetMetrics: ['apoCount', 'dealCount'],
      includeHistoricalData: true
    };

    expect(() =>
      extractCustomerInquirySourceData(
        customerInquiry,
        invalidSalesDataSet
      )
    ).toThrow(/顧客ID/);

    // 契約IDが不正な場合
    const invalidContractSalesDataSet = {
      customerId: 'CUST-001',
      contractId: '', // 空文字列（不正）
      inquiryDate: '2024-01-15',
      period: {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      },
      targetMetrics: ['apoCount', 'dealCount'],
      includeHistoricalData: true
    };

    expect(() =>
      extractCustomerInquirySourceData(
        customerInquiry,
        invalidContractSalesDataSet
      )
    ).toThrow(/契約ID/);

    // 期間の開始日が終了日より後の場合
    const invalidPeriodSalesDataSet = {
      customerId: 'CUST-001',
      contractId: 'CONTRACT-2024-001',
      inquiryDate: '2024-01-15',
      period: {
        startDate: '2024-01-31',
        endDate: '2024-01-01' // 開始日 > 終了日（不正）
      },
      targetMetrics: ['apoCount', 'dealCount'],
      includeHistoricalData: true
    };

    expect(() =>
      extractCustomerInquirySourceData(
        customerInquiry,
        invalidPeriodSalesDataSet
      )
    ).toThrow(/期間/);

    // 抽出対象メトリクスが空配列の場合
    const noTargetMetricsSalesDataSet = {
      customerId: 'CUST-001',
      contractId: 'CONTRACT-2024-001',
      inquiryDate: '2024-01-15',
      period: {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      },
      targetMetrics: [], // 空配列（不正）
      includeHistoricalData: true
    };

    expect(() =>
      extractCustomerInquirySourceData(
        customerInquiry,
        noTargetMetricsSalesDataSet
      )
    ).toThrow(/メトリクス/);
  });
});