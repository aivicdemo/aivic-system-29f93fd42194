import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndAggregateInvoiceItems } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理 - 請求対象項目自動抽出・集計機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1061: [error] 請求対象項目自動抽出・集計機能 - 請求対象項目マッピングが不正な場合、エラーを返して処理が中断される
  test('不正なマッピング設定でエラーが返却され処理が中断される', () => {
    // テストデータ: 必須フィールド欠落のマッピング設定
    const invalidMappingConfig = {
      mappingId: 'MAP_001',
      salesDataFieldName: 'appointment_count',
      // invoiceFieldName が欠落（必須）
      dataType: 'integer',
      calculationLogic: 'SUM',
      isRequired: true,
      mappingStatus: 'active',
    };

    const invoiceItemsToExtract = [
      {
        itemId: 'ITEM_001',
        customerId: 'CUST_A',
        serviceId: 'SVC_001',
        appointmentCount: 5,
      },
    ];

    // 不正なマッピング設定で処理を実行
    expect(() =>
      extractAndAggregateInvoiceItems(invalidMappingConfig, invoiceItemsToExtract)
    ).toThrow(/請求対象項目マッピング/);
  });

  // SCEN-1061: データ型の不整合
  test('無効なデータ型を含むマッピング設定でエラーが返却される', () => {
    const invalidMappingConfig = {
      mappingId: 'MAP_002',
      salesDataFieldName: 'contract_amount',
      invoiceFieldName: 'invoice_amount',
      dataType: 'invalid_type', // 無効なデータ型
      calculationLogic: 'SUM',
      isRequired: true,
      mappingStatus: 'active',
    };

    const invoiceItemsToExtract = [
      {
        itemId: 'ITEM_002',
        customerId: 'CUST_B',
        serviceId: 'SVC_002',
        contractAmount: 100000,
      },
    ];

    expect(() =>
      extractAndAggregateInvoiceItems(invalidMappingConfig, invoiceItemsToExtract)
    ).toThrow(/データ型/);
  });

  // SCEN-1061: 計算ロジックの無効値
  test('無効な計算ロジックを含むマッピング設定でエラーが返却される', () => {
    const invalidMappingConfig = {
      mappingId: 'MAP_003',
      salesDataFieldName: 'sales_count',
      invoiceFieldName: 'sales_total',
      dataType: 'integer',
      calculationLogic: 'INVALID_LOGIC', // 無効な計算ロジック
      isRequired: true,
      mappingStatus: 'active',
    };

    const invoiceItemsToExtract = [
      {
        itemId: 'ITEM_003',
        customerId: 'CUST_C',
        serviceId: 'SVC_003',
        salesCount: 10,
      },
    ];

    expect(() =>
      extractAndAggregateInvoiceItems(invalidMappingConfig, invoiceItemsToExtract)
    ).toThrow(/計算ロジック/);
  });

  // SCEN-1061: マッピングステータスが無効
  test('無効なマッピングステータスを含む設定でエラーが返却される', () => {
    const invalidMappingConfig = {
      mappingId: 'MAP_004',
      salesDataFieldName: 'revenue_amount',
      invoiceFieldName: 'revenue_total',
      dataType: 'decimal',
      calculationLogic: 'SUM',
      isRequired: true,
      mappingStatus: 'suspended', // 無効なステータス
    };

    const invoiceItemsToExtract = [
      {
        itemId: 'ITEM_004',
        customerId: 'CUST_D',
        serviceId: 'SVC_004',
        revenueAmount: 50000,
      },
    ];

    expect(() =>
      extractAndAggregateInvoiceItems(invalidMappingConfig, invoiceItemsToExtract)
    ).toThrow(/マッピング/);
  });

  // SCEN-1061: 必須フィールド mappingId が欠落
  test('mappingId が欠落したマッピング設定でエラーが返却される', () => {
    const invalidMappingConfig = {
      // mappingId が欠落
      salesDataFieldName: 'discount_rate',
      invoiceFieldName: 'discount_amount',
      dataType: 'decimal',
      calculationLogic: 'MULTIPLY',
      isRequired: false,
      mappingStatus: 'active',
    };

    const invoiceItemsToExtract = [
      {
        itemId: 'ITEM_005',
        customerId: 'CUST_E',
        serviceId: 'SVC_005',
        discountRate: 0.1,
      },
    ];

    expect(() =>
      extractAndAggregateInvoiceItems(invalidMappingConfig, invoiceItemsToExtract)
    ).toThrow(/マッピング/);
  });

  // SCEN-1061: 必須フィールド salesDataFieldName が欠落
  test('salesDataFieldName が欠落したマッピング設定でエラーが返却される', () => {
    const invalidMappingConfig = {
      mappingId: 'MAP_005',
      // salesDataFieldName が欠落
      invoiceFieldName: 'adjustment_amount',
      dataType: 'decimal',
      calculationLogic: 'SUM',
      isRequired: false,
      mappingStatus: 'active',
    };

    const invoiceItemsToExtract = [
      {
        itemId: 'ITEM_006',
        customerId: 'CUST_F',
        serviceId: 'SVC_006',
      },
    ];

    expect(() =>
      extractAndAggregateInvoiceItems(invalidMappingConfig, invoiceItemsToExtract)
    ).toThrow(/営業データ項目/);
  });

  // SCEN-1061: 必須フィールド isRequired が null
  test('isRequired が null のマッピング設定でエラーが返却される', () => {
    const invalidMappingConfig = {
      mappingId: 'MAP_006',
      salesDataFieldName: 'completion_date',
      invoiceFieldName: 'completion_date',
      dataType: 'date',
      calculationLogic: 'NONE',
      isRequired: null, // 必須フラグが null
      mappingStatus: 'active',
    };

    const invoiceItemsToExtract = [
      {
        itemId: 'ITEM_007',
        customerId: 'CUST_G',
        serviceId: 'SVC_007',
        completionDate: '2024-01-15',
      },
    ];

    expect(() =>
      extractAndAggregateInvoiceItems(invalidMappingConfig, invoiceItemsToExtract)
    ).toThrow(/必須フラグ/);
  });

  // SCEN-1061: 正常なマッピング設定で処理が成功する（ハッピーパス）
  test('正常なマッピング設定で抽出・集計が成功する', () => {
    const validMappingConfig = {
      mappingId: 'MAP_VALID_001',
      salesDataFieldName: 'appointment_count',
      invoiceFieldName: 'invoice_appointment_total',
      dataType: 'integer',
      calculationLogic: 'SUM',
      isRequired: true,
      mappingStatus: 'active',
    };

    const invoiceItemsToExtract = [
      {
        itemId: 'ITEM_VALID_001',
        customerId: 'CUST_VALID_A',
        serviceId: 'SVC_VALID_001',
        appointmentCount: 5,
      },
      {
        itemId: 'ITEM_VALID_002',
        customerId: 'CUST_VALID_A',
        serviceId: 'SVC_VALID_001',
        appointmentCount: 3,
      },
    ];

    const result = extractAndAggregateInvoiceItems(
      validMappingConfig,
      invoiceItemsToExtract
    );

    expect(result).toEqual({
      mappingId: 'MAP_VALID_001',
      customerId: 'CUST_VALID_A',
      serviceId: 'SVC_VALID_001',
      invoiceFieldName: 'invoice_appointment_total',
      aggregatedValue: 8,
      dataType: 'integer',
      calculationLogic: 'SUM',
      status: 'success',
    });
  });

  // SCEN-1061: 空のマッピング設定オブジェクト
  test('空のマッピング設定オブジェクトでエラーが返却される', () => {
    const emptyMappingConfig = {};

    const invoiceItemsToExtract = [
      {
        itemId: 'ITEM_008',
        customerId: 'CUST_H',
        serviceId: 'SVC_008',
      },
    ];

    expect(() =>
      extractAndAggregateInvoiceItems(emptyMappingConfig, invoiceItemsToExtract)
    ).toThrow(/請求対象項目マッピング/);
  });

  // SCEN-1061: null マッピング設定
  test('null マッピング設定でエラーが返却される', () => {
    const invoiceItemsToExtract = [
      {
        itemId: 'ITEM_009',
        customerId: 'CUST_I',
        serviceId: 'SVC_009',
      },
    ];

    expect(() =>
      extractAndAggregateInvoiceItems(null, invoiceItemsToExtract)
    ).toThrow(/請求対象項目マッピング/);
  });
});