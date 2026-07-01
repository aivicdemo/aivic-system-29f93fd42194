import { generateSalesDataMappingSpecification } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データマッピング仕様書の生成機能 - 重複マッピング処理', () => {
  test('SCEN-1353: 1つのシステムデータ項目が複数の請求項目にマッピングされる場合に重複が正確に処理される', () => {
    // ========== 準備: テストデータ定義 ==========
    // パターン1: 顧客IDが3つの請求項目にマッピング
    const system_data_items_1 = [
      {
        item_id: 'SYS_001',
        item_name: '顧客ID',
        data_type: 'STRING',
        unit: '番号',
      },
      {
        item_id: 'SYS_002',
        item_name: 'アポ数',
        data_type: 'NUMBER',
        unit: '件',
      },
    ];

    const mapping_rules_1 = [
      {
        system_item_id: 'SYS_001',
        billing_item_id: 'BILL_001',
        billing_item_name: '請求先顧客ID',
        transformation_logic: 'DIRECT',
      },
      {
        system_item_id: 'SYS_001',
        billing_item_id: 'BILL_002',
        billing_item_name: '督促先顧客ID',
        transformation_logic: 'DIRECT',
      },
      {
        system_item_id: 'SYS_001',
        billing_item_id: 'BILL_003',
        billing_item_name: '代金回収先顧客ID',
        transformation_logic: 'DIRECT',
      },
      {
        system_item_id: 'SYS_002',
        billing_item_id: 'BILL_004',
        billing_item_name: 'アポ数',
        transformation_logic: 'DIRECT',
      },
    ];

    // 実行: マッピング仕様書生成（パターン1）
    const result_1 = generateSalesDataMappingSpecification({
      system_data_items: system_data_items_1,
      mapping_rules: mapping_rules_1,
    });

    // 検証: パターン1の重複マッピング処理
    // (1) 各請求項目への個別のマッピング定義が正確に記録されている
    expect(result_1.mapping_definitions).toHaveLength(4);
    expect(result_1.mapping_definitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          system_item_id: 'SYS_001',
          billing_item_id: 'BILL_001',
          billing_item_name: '請求先顧客ID',
          transformation_logic: 'DIRECT',
        }),
        expect.objectContaining({
          system_item_id: 'SYS_001',
          billing_item_id: 'BILL_002',
          billing_item_name: '督促先顧客ID',
          transformation_logic: 'DIRECT',
        }),
        expect.objectContaining({
          system_item_id: 'SYS_001',
          billing_item_id: 'BILL_003',
          billing_item_name: '代金回収先顧客ID',
          transformation_logic: 'DIRECT',
        }),
        expect.objectContaining({
          system_item_id: 'SYS_002',
          billing_item_id: 'BILL_004',
          billing_item_name: 'アポ数',
          transformation_logic: 'DIRECT',
        }),
      ])
    );

    // (2) データの重複排除により不要な冗長情報が削除されている
    const unique_system_items_1 = [
      ...new Set(result_1.mapping_definitions.map((m) => m.system_item_id)),
    ];
    expect(unique_system_items_1).toEqual(['SYS_001', 'SYS_002']);

    const unique_billing_items_1 = [
      ...new Set(result_1.mapping_definitions.map((m) => m.billing_item_id)),
    ];
    expect(unique_billing_items_1).toEqual([
      'BILL_001',
      'BILL_002',
      'BILL_003',
      'BILL_004',
    ]);

    // (3) マッピング仕様書の整合性が保たれており、請求処理に必要な情報が過不足なく含まれている
    expect(result_1.specification_status).toBe('VALID');
    expect(result_1.duplicate_count).toBe(0);
    expect(result_1.total_mappings).toBe(4);

    // ========== パターン2: 複数システム項目が複数請求項目にマッピング（2個重複） ==========
    const system_data_items_2 = [
      {
        item_id: 'SYS_A',
        item_name: '成約数',
        data_type: 'NUMBER',
        unit: '件',
      },
      {
        item_id: 'SYS_B',
        item_name: '顧客反応',
        data_type: 'STRING',
        unit: 'テキスト',
      },
    ];

    const mapping_rules_2 = [
      {
        system_item_id: 'SYS_A',
        billing_item_id: 'BILL_X',
        billing_item_name: '成約数（基本請求）',
        transformation_logic: 'DIRECT',
      },
      {
        system_item_id: 'SYS_A',
        billing_item_id: 'BILL_Y',
        billing_item_name: '成約数（ボーナス対象）',
        transformation_logic: 'DIRECT',
      },
      {
        system_item_id: 'SYS_B',
        billing_item_id: 'BILL_Z',
        billing_item_name: '顧客反応',
        transformation_logic: 'CATEGORY_MAP',
      },
    ];

    const result_2 = generateSalesDataMappingSpecification({
      system_data_items: system_data_items_2,
      mapping_rules: mapping_rules_2,
    });

    // (4) 複数の重複パターンに対しても同じ処理ロジックが一貫して適用されている
    expect(result_2.mapping_definitions).toHaveLength(3);
    expect(result_2.duplicate_count).toBe(0);

    // パターン2での整合性確認
    const sys_a_mappings_2 = result_2.mapping_definitions.filter(
      (m) => m.system_item_id === 'SYS_A'
    );
    expect(sys_a_mappings_2).toHaveLength(2);
    expect(sys_a_mappings_2.map((m) => m.billing_item_id)).toEqual(
      expect.arrayContaining(['BILL_X', 'BILL_Y'])
    );

    const sys_b_mappings_2 = result_2.mapping_definitions.filter(
      (m) => m.system_item_id === 'SYS_B'
    );
    expect(sys_b_mappings_2).toHaveLength(1);
    expect(sys_b_mappings_2[0].billing_item_id).toBe('BILL_Z');

    // ========== パターン3: 3個以上の重複マッピング ==========
    const system_data_items_3 = [
      {
        item_id: 'SYS_MULTI',
        item_name: '契約金額',
        data_type: 'NUMBER',
        unit: '円',
      },
    ];

    const mapping_rules_3 = [
      {
        system_item_id: 'SYS_MULTI',
        billing_item_id: 'BILL_CONTRACT_1',
        billing_item_name: '契約金額（基本）',
        transformation_logic: 'DIRECT',
      },
      {
        system_item_id: 'SYS_MULTI',
        billing_item_id: 'BILL_CONTRACT_2',
        billing_item_name: '契約金額（消費税対象）',
        transformation_logic: 'DIRECT',
      },
      {
        system_item_id: 'SYS_MULTI',
        billing_item_id: 'BILL_CONTRACT_3',
        billing_item_name: '契約金額（割引前）',
        transformation_logic: 'DIRECT',
      },
      {
        system_item_id: 'SYS_MULTI',
        billing_item_id: 'BILL_CONTRACT_4',
        billing_item_name: '契約金額（請求額確定）',
        transformation_logic: 'DIRECT',
      },
    ];

    const result_3 = generateSalesDataMappingSpecification({
      system_data_items: system_data_items_3,
      mapping_rules: mapping_rules_3,
    });

    // 3個以上の重複に対する処理ロジック検証
    expect(result_3.mapping_definitions).toHaveLength(4);
    expect(result_3.duplicate_count).toBe(0);
    expect(result_3.specification_status).toBe('VALID');

    const multi_mappings = result_3.mapping_definitions.filter(
      (m) => m.system_item_id === 'SYS_MULTI'
    );
    expect(multi_mappings).toHaveLength(4);
    expect(multi_mappings.map((m) => m.billing_item_id)).toEqual(
      expect.arrayContaining([
        'BILL_CONTRACT_1',
        'BILL_CONTRACT_2',
        'BILL_CONTRACT_3',
        'BILL_CONTRACT_4',
      ])
    );

    // ========== 最終検証: 複合パターン（複数システム項目が複数請求項目にマッピング） ==========
    const system_data_items_complex = [
      {
        item_id: 'SYS_ID',
        item_name: 'ID',
        data_type: 'STRING',
        unit: '番号',
      },
      {
        item_id: 'SYS_AMOUNT',
        item_name: '金額',
        data_type: 'NUMBER',
        unit: '円',
      },
      {
        item_id: 'SYS_STATUS',
        item_name: 'ステータス',
        data_type: 'STRING',
        unit: 'テキスト',
      },
    ];

    const mapping_rules_complex = [
      {
        system_item_id: 'SYS_ID',
        billing_item_id: 'BILL_ID_PRIMARY',
        billing_item_name: 'ID（プライマリ）',
        transformation_logic: 'DIRECT',
      },
      {
        system_item_id: 'SYS_ID',
        billing_item_id: 'BILL_ID_SECONDARY',
        billing_item_name: 'ID（セカンダリ）',
        transformation_logic: 'DIRECT',
      },
      {
        system_item_id: 'SYS_AMOUNT',
        billing_item_id: 'BILL_AMOUNT_BASE',
        billing_item_name: '基本金額',
        transformation_logic: 'DIRECT',
      },
      {
        system_item_id: 'SYS_AMOUNT',
        billing_item_id: 'BILL_AMOUNT_TAX',
        billing_item_name: '消費税',
        transformation_logic: 'CALC_TAX',
      },
      {
        system_item_id: 'SYS_AMOUNT',
        billing_item_id: 'BILL_AMOUNT_TOTAL',
        billing_item_name: '合計金額',
        transformation_logic: 'CALC_TOTAL',
      },
      {
        system_item_id: 'SYS_STATUS',
        billing_item_id: 'BILL_STATUS',
        billing_item_name: 'ステータス',
        transformation_logic: 'CATEGORY_MAP',
      },
    ];

    const result_complex = generateSalesDataMappingSpecification({
      system_data_items: system_data_items_complex,
      mapping_rules: mapping_rules_complex,
    });

    // 複合パターンでの最終検証
    expect(result_complex.mapping_definitions).toHaveLength(6);
    expect(result_complex.duplicate_count).toBe(0);
    expect(result_complex.total_mappings).toBe(6);
    expect(result_complex.specification_status).toBe('VALID');

    // 各システムデータ項目ごとのマッピング数確認
    const id_count = result_complex.mapping_definitions.filter(
      (m) => m.system_item_id === 'SYS_ID'
    ).length;
    const amount_count = result_complex.mapping_definitions.filter(
      (m) => m.system_item_id === 'SYS_AMOUNT'
    ).length;
    const status_count = result_complex.mapping_definitions.filter(
      (m) => m.system_item_id === 'SYS_STATUS'
    ).length;

    expect(id_count).toBe(2);
    expect(amount_count).toBe(3);
    expect(status_count).toBe(1);

    // 請求項目の一意性確認
    const billing_ids = result_complex.mapping_definitions.map(
      (m) => m.billing_item_id
    );
    const unique_billing_ids = new Set(billing_ids);
    expect(unique_billing_ids.size).toBe(billing_ids.length);
  });
});