import { extractSalesDataMetadata } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能', () => {
  // SCEN-1317
  test('営業システムの全データ項目が単位・データ型・計算ロジック付きで抽出される', () => {
    // 抽出パラメータを設定（単位情報、データ型情報、計算ロジック情報を含める）
    const extraction_params = {
      target_system: 'sales_system_full',
      include_unit_info: true,
      include_data_type_info: true,
      include_calculation_logic_info: true,
      extraction_format: 'structured',
    };

    // 抽出実行
    const result = extractSalesDataMetadata(extraction_params);

    // 期待値：抽出されたデータ項目が構造化された形式で返却される
    expect(result).toBeDefined();
    expect(result.status).toBe('success');
    expect(result.total_items_extracted).toBeGreaterThan(0);

    // 抽出結果に必須列が存在することを検証
    expect(result.metadata_structure).toEqual({
      columns: expect.arrayContaining([
        'item_name',
        'unit',
        'data_type',
        'calculation_logic',
        'description',
      ]),
    });

    // サンプルデータ項目の検証：複数のデータ項目が単位・データ型・計算ロジック付きで抽出される
    expect(result.extracted_items).toBeDefined();
    expect(Array.isArray(result.extracted_items)).toBe(true);
    expect(result.extracted_items.length).toBeGreaterThanOrEqual(1);

    // サンプル項目1：アポ数
    const apo_count_item = result.extracted_items.find(
      (item: any) => item.item_name === 'apo_count'
    );
    expect(apo_count_item).toBeDefined();
    expect(apo_count_item.unit).toBe('個');
    expect(apo_count_item.data_type).toBe('integer');
    expect(apo_count_item.calculation_logic).toBe('SUM');
    expect(apo_count_item.description).toMatch(/アポイント/);

    // サンプル項目2：成約数
    const contract_count_item = result.extracted_items.find(
      (item: any) => item.item_name === 'contract_count'
    );
    expect(contract_count_item).toBeDefined();
    expect(contract_count_item.unit).toBe('個');
    expect(contract_count_item.data_type).toBe('integer');
    expect(contract_count_item.calculation_logic).toBe('SUM');
    expect(contract_count_item.description).toMatch(/成約/);

    // サンプル項目3：売上金額
    const revenue_item = result.extracted_items.find(
      (item: any) => item.item_name === 'revenue_amount'
    );
    expect(revenue_item).toBeDefined();
    expect(revenue_item.unit).toBe('円');
    expect(revenue_item.data_type).toBe('decimal');
    expect(revenue_item.calculation_logic).toBe('SUM');
    expect(revenue_item.description).toMatch(/売上/);

    // サンプル項目4：顧客反応率
    const customer_response_rate_item = result.extracted_items.find(
      (item: any) => item.item_name === 'customer_response_rate'
    );
    expect(customer_response_rate_item).toBeDefined();
    expect(customer_response_rate_item.unit).toBe('%');
    expect(customer_response_rate_item.data_type).toBe('decimal');
    expect(customer_response_rate_item.calculation_logic).toBe(
      'AVG or WEIGHTED_AVG'
    );
    expect(customer_response_rate_item.description).toMatch(/顧客反応/);

    // サンプル項目5：営業活動日数
    const activity_days_item = result.extracted_items.find(
      (item: any) => item.item_name === 'activity_days'
    );
    expect(activity_days_item).toBeDefined();
    expect(activity_days_item.unit).toBe('日数');
    expect(activity_days_item.data_type).toBe('integer');
    expect(activity_days_item.calculation_logic).toBe('COUNT_DISTINCT');
    expect(activity_days_item.description).toMatch(/営業活動日数/);

    // 抽出漏れがないことを検証：最小限の項目セットが抽出されている
    const extracted_item_names = result.extracted_items.map(
      (item: any) => item.item_name
    );
    expect(extracted_item_names).toContain('apo_count');
    expect(extracted_item_names).toContain('contract_count');
    expect(extracted_item_names).toContain('revenue_amount');
    expect(extracted_item_names).toContain('customer_response_rate');
    expect(extracted_item_names).toContain('activity_days');

    // データの完全性検証：すべての項目で必須フィールドが揃っている
    result.extracted_items.forEach((item: any) => {
      expect(item.item_name).toBeTruthy();
      expect(typeof item.item_name).toBe('string');
      expect(item.unit).toBeTruthy();
      expect(typeof item.unit).toBe('string');
      expect(item.data_type).toBeTruthy();
      expect(['integer', 'decimal', 'string', 'date'].includes(item.data_type))
        .toBe(true);
      expect(item.calculation_logic).toBeTruthy();
      expect(typeof item.calculation_logic).toBe('string');
      expect(item.description).toBeTruthy();
      expect(typeof item.description).toBe('string');
    });

    // 出力形式が正確に構造化されていることを検証
    expect(result.output_format).toBe('structured');
    expect(result.extraction_timestamp).toBeTruthy();
    expect(result.completeness_percentage).toBe(100);
  });
});