import { aggregateAssessmentAccuracyByEvaluator } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-921: [normal] 物価本項目体系対応付け機能 - 統一形式の物価本各項目が見積書項目体系と正しく対応付けられ相場判定用形式で登録される
  test('物価本項目を見積書項目体系にマッピングし相場判定用形式で登録', () => {
    const material_price_book_items = [
      {
        item_id: 'PM001',
        item_name: '鉄筋D16',
        unit: 'kg',
        base_price: 150.5,
        effective_date: '2024-01-01',
        region_code: 'JP-13',
        material_category: '鋼材',
      },
      {
        item_id: 'PM002',
        item_name: 'コンクリート強度21N',
        unit: 'm3',
        base_price: 12500.0,
        effective_date: '2024-01-01',
        region_code: 'JP-13',
        material_category: 'コンクリート',
      },
      {
        item_id: 'PM003',
        item_name: '型枠大工（日当）',
        unit: '日',
        base_price: 18000.0,
        effective_date: '2024-01-01',
        region_code: 'JP-13',
        material_category: '労務費',
      },
    ];

    const quotation_item_schema = [
      {
        schema_item_id: 'QS001',
        schema_item_name: '鉄筋',
        schema_category: '材料費',
        schema_unit: 'kg',
        target_material_category: '鋼材',
      },
      {
        schema_item_id: 'QS002',
        schema_item_name: 'コンクリート',
        schema_category: '材料費',
        schema_unit: 'm3',
        target_material_category: 'コンクリート',
      },
      {
        schema_item_id: 'QS003',
        schema_item_name: '型枠工',
        schema_category: '労務費',
        schema_unit: '日',
        target_material_category: '労務費',
      },
    ];

    const mapping_rules = [
      {
        rule_id: 'MR001',
        price_book_item_id: 'PM001',
        quotation_schema_id: 'QS001',
        unit_conversion_factor: 1.0,
        region_adjustment_coefficient: 1.0,
        effective_from: '2024-01-01',
      },
      {
        rule_id: 'MR002',
        price_book_item_id: 'PM002',
        quotation_schema_id: 'QS002',
        unit_conversion_factor: 1.0,
        region_adjustment_coefficient: 1.0,
        effective_from: '2024-01-01',
      },
      {
        rule_id: 'MR003',
        price_book_item_id: 'PM003',
        quotation_schema_id: 'QS003',
        unit_conversion_factor: 1.0,
        region_adjustment_coefficient: 1.0,
        effective_from: '2024-01-01',
      },
    ];

    const result = aggregateAssessmentAccuracyByEvaluator({
      material_price_book_items,
      quotation_item_schema,
      mapping_rules,
      region_code: 'JP-13',
      effective_date: '2024-01-01',
    });

    expect(result).toHaveProperty('mapped_items');
    expect(result).toHaveProperty('conversion_format');
    expect(result).toHaveProperty('validation_status');
    expect(result).toHaveProperty('registration_timestamp');

    expect(Array.isArray(result.mapped_items)).toBe(true);
    expect(result.mapped_items.length).toBe(3);

    const mapped_item_1 = result.mapped_items[0];
    expect(mapped_item_1).toHaveProperty('mapping_id');
    expect(mapped_item_1).toHaveProperty('price_book_item_id', 'PM001');
    expect(mapped_item_1).toHaveProperty('quotation_schema_id', 'QS001');
    expect(mapped_item_1).toHaveProperty('unified_item_name');
    expect(mapped_item_1).toHaveProperty('unit', 'kg');
    expect(mapped_item_1).toHaveProperty('standard_price');
    expect(typeof mapped_item_1.standard_price).toBe('number');
    expect(mapped_item_1.standard_price).toBeGreaterThan(0);

    const mapped_item_2 = result.mapped_items[1];
    expect(mapped_item_2).toHaveProperty('price_book_item_id', 'PM002');
    expect(mapped_item_2).toHaveProperty('quotation_schema_id', 'QS002');
    expect(mapped_item_2).toHaveProperty('unit', 'm3');

    const mapped_item_3 = result.mapped_items[2];
    expect(mapped_item_3).toHaveProperty('price_book_item_id', 'PM003');
    expect(mapped_item_3).toHaveProperty('quotation_schema_id', 'QS003');
    expect(mapped_item_3).toHaveProperty('unit', '日');

    expect(result.conversion_format).toHaveProperty('format_version');
    expect(result.conversion_format).toHaveProperty('schema_compliance_status');
    expect(result.conversion_format.schema_compliance_status).toBe('compliant');

    expect(result.validation_status).toHaveProperty('is_valid');
    expect(result.validation_status.is_valid).toBe(true);
    expect(result.validation_status).toHaveProperty('validation_timestamp');
    expect(result.validation_status).toHaveProperty('total_items_mapped', 3);
    expect(result.validation_status).toHaveProperty('successful_mappings', 3);
    expect(result.validation_status).toHaveProperty('failed_mappings', 0);

    const success_rate = (result.validation_status.successful_mappings / result.validation_status.total_items_mapped) * 100;
    expect(success_rate).toBe(100);

    expect(typeof result.registration_timestamp).toBe('string');
    expect(result.registration_timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});