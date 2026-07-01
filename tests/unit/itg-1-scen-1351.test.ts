import { describe, test, expect } from '@jest/globals';
import { generateDataMappingSpecification } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データマッピング仕様書の生成機能', () => {
  test('SCEN-1351: 営業システムのデータ項目と請求・レポート出力の対応関係が正確にマッピングされる', () => {
    // Arrange: 営業システムの標準的なデータセットを構築
    const salesDataSet = {
      items: [
        {
          itemId: 'SALES_001',
          itemName: '顧客名',
          dataType: 'string',
          unit: '名',
          calculationLogic: 'raw',
          isMandatory: true,
        },
        {
          itemId: 'SALES_002',
          itemName: 'アポ数',
          dataType: 'number',
          unit: '件',
          calculationLogic: 'sum',
          isMandatory: true,
        },
        {
          itemId: 'SALES_003',
          itemName: '成約数',
          dataType: 'number',
          unit: '件',
          calculationLogic: 'sum',
          isMandatory: true,
        },
        {
          itemId: 'SALES_004',
          itemName: 'サービス種別',
          dataType: 'string',
          unit: '種',
          calculationLogic: 'raw',
          isMandatory: true,
        },
        {
          itemId: 'SALES_005',
          itemName: '顧客反応',
          dataType: 'string',
          unit: '件',
          calculationLogic: 'raw',
          isMandatory: false,
        },
      ],
    };

    // 請求出力テンプレートを構築
    const invoiceTemplate = {
      templateId: 'INV_001',
      templateName: '標準請求書',
      outputFields: [
        {
          fieldId: 'INV_FIELD_001',
          fieldName: '請求対象顧客',
          sourceItemId: 'SALES_001',
          transformationRule: 'string_to_text',
        },
        {
          fieldId: 'INV_FIELD_002',
          fieldName: '成約件数',
          sourceItemId: 'SALES_003',
          transformationRule: 'number_to_integer',
        },
        {
          fieldId: 'INV_FIELD_003',
          fieldName: 'サービス区分',
          sourceItemId: 'SALES_004',
          transformationRule: 'string_to_category',
        },
      ],
    };

    // レポート出力テンプレートを構築
    const reportTemplate = {
      templateId: 'RPT_001',
      templateName: '月次営業成果レポート',
      outputFields: [
        {
          fieldId: 'RPT_FIELD_001',
          fieldName: '顧客名',
          sourceItemId: 'SALES_001',
          transformationRule: 'string_to_text',
          displayOrder: 1,
        },
        {
          fieldId: 'RPT_FIELD_002',
          fieldName: 'アポ件数',
          sourceItemId: 'SALES_002',
          transformationRule: 'number_to_integer',
          displayOrder: 2,
        },
        {
          fieldId: 'RPT_FIELD_003',
          fieldName: '成約件数',
          sourceItemId: 'SALES_003',
          transformationRule: 'number_to_integer',
          displayOrder: 3,
        },
        {
          fieldId: 'RPT_FIELD_004',
          fieldName: 'サービス種別',
          sourceItemId: 'SALES_004',
          transformationRule: 'string_to_text',
          displayOrder: 4,
        },
      ],
    };

    // Act: データマッピング仕様書を生成
    const result = generateDataMappingSpecification({
      salesDataSet,
      invoiceTemplate,
      reportTemplate,
    });

    // Assert 1: 仕様書の基本構造を検証
    expect(result).toHaveProperty('specificationId');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('salesItems');
    expect(result).toHaveProperty('invoiceMapping');
    expect(result).toHaveProperty('reportMapping');
    expect(result).toHaveProperty('validationResult');

    // Assert 2: 営業データ項目が正確に記載されている
    expect(result.salesItems).toHaveLength(5);
    expect(result.salesItems[0]).toEqual({
      itemId: 'SALES_001',
      itemName: '顧客名',
      dataType: 'string',
      unit: '名',
      calculationLogic: 'raw',
      isMandatory: true,
    });
    expect(result.salesItems[1]).toEqual({
      itemId: 'SALES_002',
      itemName: 'アポ数',
      dataType: 'number',
      unit: '件',
      calculationLogic: 'sum',
      isMandatory: true,
    });
    expect(result.salesItems[2]).toEqual({
      itemId: 'SALES_003',
      itemName: '成約数',
      dataType: 'number',
      unit: '件',
      calculationLogic: 'sum',
      isMandatory: true,
    });

    // Assert 3: 請求出力項目のマッピングが正確に記載されている
    expect(result.invoiceMapping).toHaveLength(3);
    expect(result.invoiceMapping[0]).toEqual({
      invoiceFieldId: 'INV_FIELD_001',
      invoiceFieldName: '請求対象顧客',
      sourceItemId: 'SALES_001',
      sourceItemName: '顧客名',
      transformationRule: 'string_to_text',
      dataTypeSource: 'string',
      dataTypeTarget: 'string',
    });
    expect(result.invoiceMapping[1]).toEqual({
      invoiceFieldId: 'INV_FIELD_002',
      invoiceFieldName: '成約件数',
      sourceItemId: 'SALES_003',
      sourceItemName: '成約数',
      transformationRule: 'number_to_integer',
      dataTypeSource: 'number',
      dataTypeTarget: 'integer',
    });
    expect(result.invoiceMapping[2]).toEqual({
      invoiceFieldId: 'INV_FIELD_003',
      invoiceFieldName: 'サービス区分',
      sourceItemId: 'SALES_004',
      sourceItemName: 'サービス種別',
      transformationRule: 'string_to_category',
      dataTypeSource: 'string',
      dataTypeTarget: 'category',
    });

    // Assert 4: レポート出力項目のマッピングが正確に記載されている
    expect(result.reportMapping).toHaveLength(4);
    expect(result.reportMapping[0]).toEqual({
      reportFieldId: 'RPT_FIELD_001',
      reportFieldName: '顧客名',
      sourceItemId: 'SALES_001',
      sourceItemName: '顧客名',
      transformationRule: 'string_to_text',
      displayOrder: 1,
      dataTypeSource: 'string',
      dataTypeTarget: 'string',
    });
    expect(result.reportMapping[1]).toEqual({
      reportFieldId: 'RPT_FIELD_002',
      reportFieldName: 'アポ件数',
      sourceItemId: 'SALES_002',
      sourceItemName: 'アポ数',
      transformationRule: 'number_to_integer',
      displayOrder: 2,
      dataTypeSource: 'number',
      dataTypeTarget: 'integer',
    });
    expect(result.reportMapping[2]).toEqual({
      reportFieldId: 'RPT_FIELD_003',
      reportFieldName: '成約件数',
      sourceItemId: 'SALES_003',
      sourceItemName: '成約数',
      transformationRule: 'number_to_integer',
      displayOrder: 3,
      dataTypeSource: 'number',
      dataTypeTarget: 'integer',
    });
    expect(result.reportMapping[3]).toEqual({
      reportFieldId: 'RPT_FIELD_004',
      reportFieldName: 'サービス種別',
      sourceItemId: 'SALES_004',
      sourceItemName: 'サービス種別',
      transformationRule: 'string_to_text',
      displayOrder: 4,
      dataTypeSource: 'string',
      dataTypeTarget: 'string',
    });

    // Assert 5: 営業データ項目と請求出力項目の対応関係をバリデーション
    const invoiceMappedSourceIds = result.invoiceMapping.map(
      (m: any) => m.sourceItemId
    );
    expect(invoiceMappedSourceIds).toContain('SALES_001');
    expect(invoiceMappedSourceIds).toContain('SALES_003');
    expect(invoiceMappedSourceIds).toContain('SALES_004');
    expect(invoiceMappedSourceIds).toHaveLength(3);

    // Assert 6: 営業データ項目とレポート出力項目の対応関係をバリデーション
    const reportMappedSourceIds = result.reportMapping.map(
      (m: any) => m.sourceItemId
    );
    expect(reportMappedSourceIds).toContain('SALES_001');
    expect(reportMappedSourceIds).toContain('SALES_002');
    expect(reportMappedSourceIds).toContain('SALES_003');
    expect(reportMappedSourceIds).toContain('SALES_004');
    expect(reportMappedSourceIds).toHaveLength(4);

    // Assert 7: すべてのマッピング関係が正確に記載されていることを確認
    expect(result.validationResult).toHaveProperty('hasNoDuplicates');
    expect(result.validationResult).toHaveProperty('hasNoGaps');
    expect(result.validationResult).toHaveProperty('dataTypeMatches');
    expect(result.validationResult.hasNoDuplicates).toBe(true);
    expect(result.validationResult.hasNoGaps).toBe(true);
    expect(result.validationResult.dataTypeMatches).toBe(true);

    // Assert 8: 型変換ルールが正確に定義されている
    const stringToTextMappings = result.invoiceMapping.filter(
      (m: any) => m.transformationRule === 'string_to_text'
    );
    expect(stringToTextMappings).toHaveLength(1);
    expect(stringToTextMappings[0].dataTypeSource).toBe('string');
    expect(stringToTextMappings[0].dataTypeTarget).toBe('string');

    const numberToIntegerMappings = result.invoiceMapping.filter(
      (m: any) => m.transformationRule === 'number_to_integer'
    );
    expect(numberToIntegerMappings).toHaveLength(1);
    expect(numberToIntegerMappings[0].dataTypeSource).toBe('number');
    expect(numberToIntegerMappings[0].dataTypeTarget).toBe('integer');

    // Assert 9: マッピング仕様書に重複がないことを検証
    const allInvoiceFieldIds = result.invoiceMapping.map(
      (m: any) => m.invoiceFieldId
    );
    const uniqueInvoiceFieldIds = new Set(allInvoiceFieldIds);
    expect(uniqueInvoiceFieldIds.size).toBe(allInvoiceFieldIds.length);

    const allReportFieldIds = result.reportMapping.map(
      (m: any) => m.reportFieldId
    );
    const uniqueReportFieldIds = new Set(allReportFieldIds);
    expect(uniqueReportFieldIds.size).toBe(allReportFieldIds.length);

    // Assert 10: マッピング仕様書に漏落がないことを検証
    const invoiceSourceItemIds = result.invoiceMapping.map(
      (m: any) => m.sourceItemId
    );
    const reportSourceItemIds = result.reportMapping.map(
      (m: any) => m.sourceItemId
    );
    const allMappedSourceIds = new Set([
      ...invoiceSourceItemIds,
      ...reportSourceItemIds,
    ]);
    // 少なくとも4つの営業データ項目が請求またはレポートにマッピングされている
    expect(allMappedSourceIds.size).toBeGreaterThanOrEqual(4);

    // Assert 11: 仕様書のメタデータが正確に設定されている
    expect(result.specificationId).toMatch(/^SPEC-\d{4}-\d{2}-\d{2}/);
    expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});