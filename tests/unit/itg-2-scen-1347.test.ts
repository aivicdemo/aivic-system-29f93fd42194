import { classifyFormatDifferenceCause } from '../../src/logic/it-6-3-1';

describe('査定判定ロジック適用履歴と根拠の記録・検索機能', () => {
  // SCEN-1347: [error] フォーマット差異原因分類 - 分類対象の項目が存在しない場合に分類不可として扱われる
  test('分類対象の項目が存在しない場合、分類不可エラーを返すこと', () => {
    const input_ocr_result = {
      construction_type: '土工事',
      unit_price: 1500,
      quantity: 50,
    };

    const input_reference_format = {
      construction_type: '工事種別',
      unit_price: '単価',
      quantity: '数量',
      labor_cost: '労務費',
      material_cost: '材料費',
    };

    const result = classifyFormatDifferenceCause({
      ocr_result: input_ocr_result,
      reference_format: input_reference_format,
    });

    expect(result.classification_status).toBe('unclassifiable');
    expect(result.error_message).toMatch(/項目/);
    expect(result.missing_fields).toContain('labor_cost');
    expect(result.missing_fields).toContain('material_cost');
    expect(result.missing_fields.length).toBe(2);
  });
});