import { describe, test, expect } from '@jest/globals';
import {
  retrieveMetadataFieldName,
  retrieveMetadataUnit,
  retrieveMetadataDataType,
  retrieveMetadataCalculationFormula,
  applySalesDataAggregationLogic,
} from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理機能', () => {
  // SCEN-1113: [normal] 営業データメタデータに基づく集計ロジック検証
  test('SCEN-1113: メタデータから項目情報を取得し集計ロジックに適用する', () => {
    // Setup: メタデータを準備（項目名、単位、データ型、計算式を含む）
    const metadata = {
      fieldId: 'apo_count',
      fieldName: 'アポイント数',
      unit: '件',
      dataType: 'integer',
      calculationFormula: 'SUM',
      reportMapping: 'monthly_apo_total',
    };

    const salesData = [
      { fieldId: 'apo_count', customerId: 'customer_001', serviceId: 'service_A', value: 10, recordDate: '2024-01-15' },
      { fieldId: 'apo_count', customerId: 'customer_001', serviceId: 'service_A', value: 15, recordDate: '2024-01-16' },
      { fieldId: 'apo_count', customerId: 'customer_001', serviceId: 'service_B', value: 8, recordDate: '2024-01-17' },
    ];

    // Step 1: メタデータから項目名を取得する
    const retrievedFieldName = retrieveMetadataFieldName(metadata);
    expect(retrievedFieldName).toBe('アポイント数');

    // Step 2: メタデータから単位情報を取得する
    const retrievedUnit = retrieveMetadataUnit(metadata);
    expect(retrievedUnit).toBe('件');

    // Step 3: メタデータからデータ型を取得する
    const retrievedDataType = retrieveMetadataDataType(metadata);
    expect(retrievedDataType).toBe('integer');

    // Step 4: メタデータから計算式を取得する
    const retrievedFormula = retrieveMetadataCalculationFormula(metadata);
    expect(retrievedFormula).toBe('SUM');

    // Step 5: 取得したメタデータ情報を集計ロジックに適用する
    const aggregationInput = {
      metadata,
      salesData,
      groupBy: ['customerId', 'serviceId'],
      aggregationPeriod: { startDate: '2024-01-15', endDate: '2024-01-17' },
    };

    // Step 6: 集計ロジックが正しく実行される
    const aggregationResult = applySalesDataAggregationLogic(aggregationInput);

    // Step 7: 集計結果を検証する
    // 期待結果: customer_001-service_A: 25件、customer_001-service_B: 8件
    expect(aggregationResult).toEqual({
      aggregationType: 'SUM',
      fieldName: 'アポイント数',
      unit: '件',
      dataType: 'integer',
      results: [
        {
          customerId: 'customer_001',
          serviceId: 'service_A',
          aggregatedValue: 25,
          count: 2,
          period: { startDate: '2024-01-15', endDate: '2024-01-17' },
        },
        {
          customerId: 'customer_001',
          serviceId: 'service_B',
          aggregatedValue: 8,
          count: 1,
          period: { startDate: '2024-01-15', endDate: '2024-01-17' },
        },
      ],
      totalAggregatedValue: 33,
      reportMapping: 'monthly_apo_total',
      executionTimestamp: '2024-01-17T23:59:59Z',
      status: 'completed',
    });

    // 追加検証: メタデータ抽出の正確性
    expect(aggregationResult.fieldName).toBe(retrievedFieldName);
    expect(aggregationResult.unit).toBe(retrievedUnit);
    expect(aggregationResult.dataType).toBe(retrievedDataType);
    expect(aggregationResult.aggregationType).toBe(retrievedFormula);
  });
});