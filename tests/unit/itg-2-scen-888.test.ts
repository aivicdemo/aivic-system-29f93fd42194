import { matchPricebookItems } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  test('SCEN-888: 物価本との項目マッピング・適用基準特定 - 対応する物価本が存在しない見積項目が適切に検出される', () => {
    // テストデータ: 見積項目
    const estimateItems = [
      {
        item_id: 'EST001',
        item_name: '鉄筋工事',
        item_category: '鉄筋',
        unit_price: 15000,
        quantity: 100,
        total_amount: 1500000,
        region_code: '13', // 東京都
        work_type_code: 'STL001'
      },
      {
        item_id: 'EST002',
        item_name: '珍しい建設工法X',
        item_category: 'UNKNOWN_CATEGORY',
        unit_price: 25000,
        quantity: 50,
        total_amount: 1250000,
        region_code: '13',
        work_type_code: 'UNKNOWN_WRK'
      },
      {
        item_id: 'EST003',
        item_name: 'コンクリート工事',
        item_category: 'コンクリート',
        unit_price: 12000,
        quantity: 200,
        total_amount: 2400000,
        region_code: '27', // 大阪府
        work_type_code: 'CON001'
      },
      {
        item_id: 'EST004',
        item_name: '存在しない工法Y',
        item_category: 'NONEXISTENT_CAT',
        unit_price: 30000,
        quantity: 30,
        total_amount: 900000,
        region_code: '13',
        work_type_code: 'NONEXISTENT'
      }
    ];

    // テストデータ: 物価本マスタ
    const pricebookMaster = [
      {
        pricebook_id: 'PB001',
        category: '鉄筋',
        work_type: 'STL001',
        region: '13',
        standard_price: 14800,
        effective_from: '2024-01-01',
        effective_to: '2024-12-31'
      },
      {
        pricebook_id: 'PB002',
        category: 'コンクリート',
        work_type: 'CON001',
        region: '27',
        standard_price: 11950,
        effective_from: '2024-01-01',
        effective_to: '2024-12-31'
      },
      {
        pricebook_id: 'PB003',
        category: 'コンクリート',
        work_type: 'CON001',
        region: '13',
        standard_price: 12100,
        effective_from: '2024-01-01',
        effective_to: '2024-12-31'
      }
    ];

    // マッピング処理を実行
    const result = matchPricebookItems(estimateItems, pricebookMaster);

    // 期待結果の検証
    // 1. 対応する物価本が存在しない項目が正確に検出される
    expect(result.unmapped_items).toHaveLength(2);
    
    // 2. 検出されたはずの項目IDを確認
    const unmapped_item_ids = result.unmapped_items.map((item: any) => item.item_id);
    expect(unmapped_item_ids).toContain('EST002');
    expect(unmapped_item_ids).toContain('EST004');
    
    // 3. 該当項目が『物価本マッピング不可』または『対応する物価本なし』としてフラグ付けされる
    const unmapped_item_2 = result.unmapped_items.find((item: any) => item.item_id === 'EST002');
    expect(unmapped_item_2.mapping_status).toBe('物価本マッピング不可');
    expect(unmapped_item_2.error_reason).toMatch(/対応する物価本/);
    
    const unmapped_item_4 = result.unmapped_items.find((item: any) => item.item_id === 'EST004');
    expect(unmapped_item_4.mapping_status).toBe('対応する物価本なし');
    expect(unmapped_item_4.error_reason).toMatch(/該当する/);
    
    // 4. 正常にマッピングされた項目も確認
    expect(result.mapped_items).toHaveLength(2);
    const mapped_item_ids = result.mapped_items.map((item: any) => item.item_id);
    expect(mapped_item_ids).toContain('EST001');
    expect(mapped_item_ids).toContain('EST003');
    
    // 5. マッピング成功した項目の詳細を確認
    const mapped_item_1 = result.mapped_items.find((item: any) => item.item_id === 'EST001');
    expect(mapped_item_1.pricebook_id).toBe('PB001');
    expect(mapped_item_1.matched_price).toBe(14800);
    expect(mapped_item_1.price_deviation).toBe(200); // 15000 - 14800
    
    const mapped_item_3 = result.mapped_items.find((item: any) => item.item_id === 'EST003');
    expect(mapped_item_3.pricebook_id).toBe('PB002');
    expect(mapped_item_3.matched_price).toBe(11950);
    expect(mapped_item_3.price_deviation).toBe(50); // 12000 - 11950
    
    // 6. エラーログが記録されているか確認
    expect(result.error_logs).toHaveLength(2);
    expect(result.error_logs[0].item_id).toBe('EST002');
    expect(result.error_logs[0].error_type).toMatch(/マッピング/);
    expect(result.error_logs[1].item_id).toBe('EST004');
    expect(result.error_logs[1].error_type).toMatch(/マッピング/);
    
    // 7. システムの全体的な処理結果が正常完了
    expect(result.processing_status).toBe('completed_with_warnings');
    expect(result.total_items_processed).toBe(4);
    expect(result.successful_mappings).toBe(2);
    expect(result.failed_mappings).toBe(2);
    expect(result.mapping_success_rate).toBe(50); // 2/4 = 50%
  });

  test('SCEN-888: エラーハンドリング - 入力データが不正な場合', () => {
    // 不正なデータケース
    expect(() => {
      matchPricebookItems(null as any, []);
    }).toThrow(/見積項目/);
    
    expect(() => {
      matchPricebookItems([], null as any);
    }).toThrow(/物価本/);
    
    // 空の配列は許容される（結果は空）
    const result = matchPricebookItems([], []);
    expect(result.total_items_processed).toBe(0);
    expect(result.mapped_items).toHaveLength(0);
    expect(result.unmapped_items).toHaveLength(0);
  });

  test('SCEN-888: 複数地域・工種の複雑なマッピングシナリオ', () => {
    const complexEstimateItems = [
      {
        item_id: 'C001',
        item_name: '溶接工事',
        item_category: '溶接',
        unit_price: 8000,
        quantity: 300,
        total_amount: 2400000,
        region_code: '13',
        work_type_code: 'WLD001'
      },
      {
        item_id: 'C002',
        item_name: '木工事',
        item_category: '木工',
        unit_price: 5000,
        quantity: 500,
        total_amount: 2500000,
        region_code: '13',
        work_type_code: 'WOD001'
      },
      {
        item_id: 'C003',
        item_name: '溶接工事',
        item_category: '溶接',
        unit_price: 8000,
        quantity: 200,
        total_amount: 1600000,
        region_code: '27',
        work_type_code: 'WLD001'
      },
      {
        item_id: 'C004',
        item_name: '地域特異工法',
        item_category: '特殊工法',
        unit_price: 50000,
        quantity: 10,
        total_amount: 500000,
        region_code: '99',
        work_type_code: 'SPECIAL'
      }
    ];

    const complexPricebookMaster = [
      {
        pricebook_id: 'PB_WLD_13',
        category: '溶接',
        work_type: 'WLD001',
        region: '13',
        standard_price: 7900,
        effective_from: '2024-01-01',
        effective_to: '2024-12-31'
      },
      {
        pricebook_id: 'PB_WOD_13',
        category: '木工',
        work_type: 'WOD001',
        region: '13',
        standard_price: 4950,
        effective_from: '2024-01-01',
        effective_to: '2024-12-31'
      },
      {
        pricebook_id: 'PB_WLD_27',
        category: '溶接',
        work_type: 'WLD001',
        region: '27',
        standard_price: 8100,
        effective_from: '2024-01-01',
        effective_to: '2024-12-31'
      }
      // region=99, category=特殊工法の物価本は存在しない
    ];

    const result = matchPricebookItems(complexEstimateItems, complexPricebookMaster);

    // マッピング成功: 3件
    expect(result.mapped_items).toHaveLength(3);
    expect(result.successful_mappings).toBe(3);
    
    // マッピング失敗: 1件（C004）
    expect(result.unmapped_items).toHaveLength(1);
    expect(result.failed_mappings).toBe(1);
    expect(result.unmapped_items[0].item_id).toBe('C004');
    expect(result.unmapped_items[0].mapping_status).toMatch(/マッピング不可|対応する物価本なし/);
    
    // 成功率
    expect(result.mapping_success_rate).toBe(75); // 3/4 = 75%
    
    // 各マッピング結果を確認
    const mapped_c001 = result.mapped_items.find((m: any) => m.item_id === 'C001');
    expect(mapped_c001.pricebook_id).toBe('PB_WLD_13');
    expect(mapped_c001.price_deviation).toBe(100); // 8000 - 7900
    
    const mapped_c003 = result.mapped_items.find((m: any) => m.item_id === 'C003');
    expect(mapped_c003.pricebook_id).toBe('PB_WLD_27');
    expect(mapped_c003.price_deviation).toBe(-100); // 8000 - 8100
  });
});