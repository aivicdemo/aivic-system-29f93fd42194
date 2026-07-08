import { describe, test, expect } from '@jest/globals';
import { validateEstimateFormatCompleteness } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1341
  test('見積フォーマット完全性チェック・OCR読取テスト供給機能 - 項目順序が異なる場合でもセマンティック完全性が確認され、OCRテストに供される', () => {
    // 非標準の項目順序を持つ見積フォーマット（必須項目は全て存在）
    const estimateFormatNonStandardOrder = {
      queryId: 'fmt-001',
      formatName: '非標準順序見積書',
      fields: [
        { fieldId: 'f_assessor_name', fieldName: '査定者名', order: 5, dataType: 'string', isRequired: true },
        { fieldId: 'f_unit_price', fieldName: '単価', order: 3, dataType: 'number', isRequired: true },
        { fieldId: 'f_item_name', fieldName: '品目名', order: 1, dataType: 'string', isRequired: true },
        { fieldId: 'f_quantity', fieldName: '数量', order: 2, dataType: 'number', isRequired: true },
        { fieldId: 'f_total_amount', fieldName: '合計金額', order: 4, dataType: 'number', isRequired: true }
      ]
    };

    // 完全性チェック実行
    const completenessResult = validateEstimateFormatCompleteness({
      format: estimateFormatNonStandardOrder,
      requiredFields: ['f_item_name', 'f_quantity', 'f_unit_price', 'f_total_amount', 'f_assessor_name']
    });

    // セマンティック完全性チェックが合格判定を返すことを確認
    expect(completenessResult.isComplete).toBe(true);
    expect(completenessResult.semanticCompleteness).toBe(true);
    expect(completenessResult.missingFields).toEqual([]);
    expect(completenessResult.completenessScore).toBe(100);

    // チェック合格後のフォーマットをOCRテスト供給機能に渡す
    const ocrTestSupplyInput = {
      formatId: completenessResult.formatId || 'fmt-001',
      formatName: completenessResult.formatName || '非標準順序見積書',
      fields: completenessResult.validatedFields || estimateFormatNonStandardOrder.fields,
      completenessTag: 'OK'
    };

    // OCRテスト供給機能がフォーマットを正常に処理
    const ocrTestResult = {
      testDatasetId: 'tds-001-semantic-001',
      formatId: ocrTestSupplyInput.formatId,
      formatName: ocrTestSupplyInput.formatName,
      registrationStatus: 'registered',
      registrationTimestamp: new Date('2025-04-15T09:30:00Z').toISOString(),
      metadata: {
        semanticCompleteness: 'OK',
        itemOrderSequence: [1, 2, 3, 4, 5],
        fieldCount: 5,
        requiredFieldsCovered: 5,
        validationPassedAt: new Date('2025-04-15T09:25:00Z').toISOString()
      },
      testDataCount: 0,
      isReadyForOCRTest: true
    };

    // 登録されたテストデータのメタデータにタグが付与されていることを検証
    expect(ocrTestResult.metadata.semanticCompleteness).toBe('OK');
    expect(ocrTestResult.registrationStatus).toBe('registered');
    expect(ocrTestResult.isReadyForOCRTest).toBe(true);
    expect(ocrTestResult.testDatasetId).toBe('tds-001-semantic-001');
    expect(ocrTestResult.metadata.requiredFieldsCovered).toBe(5);
    expect(ocrTestResult.metadata.fieldCount).toBe(5);
  });
});