import { analyzeOCRReadingErrors } from '../../src/logic/it-6-2-2-2';

describe('OCR読取誤り判定機能 - 欠落項目検出と分類', () => {
  test('SCEN-1395: 必須項目欠落時に欠落項目が正確に検出・分類される', () => {
    // ハッピーパス: 1項目欠落パターン
    const singleMissingInput = {
      ocr_result: {
        product_name: '鉄骨柱',
        model_number: '',
        condition: '新品',
        quantity: 5,
        unit_price: 12500,
      },
      required_fields: ['product_name', 'model_number', 'condition', 'quantity', 'unit_price'],
    };

    const singleMissingResult = analyzeOCRReadingErrors(singleMissingInput);
    expect(singleMissingResult.missing_fields).toEqual(['model_number']);
    expect(singleMissingResult.missing_count).toBe(1);
    expect(singleMissingResult.classification).toEqual({
      model_number: '型番が入力されていません',
    });
    expect(singleMissingResult.is_critical).toBe(true);

    // 複数項目欠落パターン
    const multipleMissingInput = {
      ocr_result: {
        product_name: '',
        model_number: '',
        condition: '新品',
        quantity: 0,
        unit_price: 12500,
      },
      required_fields: ['product_name', 'model_number', 'condition', 'quantity', 'unit_price'],
    };

    const multipleMissingResult = analyzeOCRReadingErrors(multipleMissingInput);
    expect(multipleMissingResult.missing_fields.sort()).toEqual(['model_number', 'product_name', 'quantity'].sort());
    expect(multipleMissingResult.missing_count).toBe(3);
    expect(multipleMissingResult.classification).toEqual({
      product_name: '商品名が入力されていません',
      model_number: '型番が入力されていません',
      quantity: '数量が入力されていません',
    });
    expect(multipleMissingResult.is_critical).toBe(true);

    // 全項目完全パターン（エラーなし）
    const completInput = {
      ocr_result: {
        product_name: '鉄骨柱',
        model_number: 'H-250x250x12',
        condition: '新品',
        quantity: 5,
        unit_price: 12500,
      },
      required_fields: ['product_name', 'model_number', 'condition', 'quantity', 'unit_price'],
    };

    const completeResult = analyzeOCRReadingErrors(completInput);
    expect(completeResult.missing_fields).toEqual([]);
    expect(completeResult.missing_count).toBe(0);
    expect(completeResult.classification).toEqual({});
    expect(completeResult.is_critical).toBe(false);

    // 欠落内容フォーマット検証
    expect(singleMissingResult.format_version).toBe('1.0');
    expect(multipleMissingResult.format_version).toBe('1.0');
    expect(completeResult.format_version).toBe('1.0');

    // 欠落項目順序の一貫性検証（複数欠落時に全項目が含まれることを確認）
    const allMissingInput = {
      ocr_result: {
        product_name: '',
        model_number: '',
        condition: '',
        quantity: 0,
        unit_price: 0,
      },
      required_fields: ['product_name', 'model_number', 'condition', 'quantity', 'unit_price'],
    };

    const allMissingResult = analyzeOCRReadingErrors(allMissingInput);
    expect(allMissingResult.missing_count).toBe(5);
    expect(allMissingResult.missing_fields.length).toBe(5);
    expect(Object.keys(allMissingResult.classification).length).toBe(5);
    expect(allMissingResult.is_critical).toBe(true);
  });

  test('SCEN-1395: 欠落検出エラーケース - 入力形式が不正な場合にエラーが発生する', () => {
    // 入力null時のエラー
    expect(() => {
      analyzeOCRReadingErrors(null as any);
    }).toThrow(/入力値/);

    // ocr_result が null の場合
    expect(() => {
      analyzeOCRReadingErrors({
        ocr_result: null,
        required_fields: ['product_name'],
      } as any);
    }).toThrow(/OCR結果/);

    // required_fields が空配列の場合
    expect(() => {
      analyzeOCRReadingErrors({
        ocr_result: { product_name: '商品A' },
        required_fields: [],
      });
    }).toThrow(/必須項目/);

    // required_fields に対応する ocr_result フィールドが存在しない場合
    expect(() => {
      analyzeOCRReadingErrors({
        ocr_result: { product_name: '商品A' },
        required_fields: ['product_name', 'undefined_field'],
      });
    }).toThrow(/フィールド定義/);
  });
});