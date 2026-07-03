import { defineMonthlyTemplate } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理', () => {
  test('SCEN-1044: テンプレート項目の表示順序が空の場合、デフォルト順序として自動設定される', () => {
    // Precondition: 営業データ品質管理・請求自動化システムに月次サマリーテンプレート管理画面がある
    // Trigger: テンプレート項目を複数選択して追加し、表示順序フィールドを空のまま保存
    // Expected Outcome: 表示順序がデフォルト順序で自動設定され、プレビュー表示でも正しい順序で表示される

    const template_input = {
      template_id: 'template_001',
      template_name: '月次営業成果サマリー',
      description: '営業成果の月次集計テンプレート',
      items: [
        {
          item_id: 'item_sales',
          item_name: '売上',
          item_type: 'numeric',
          calculation_logic: 'SUM(revenue)',
          display_order: null // 表示順序未設定（空）
        },
        {
          item_id: 'item_count',
          item_name: '件数',
          item_type: 'numeric',
          calculation_logic: 'COUNT(transactions)',
          display_order: null // 表示順序未設定（空）
        },
        {
          item_id: 'item_rate',
          item_name: '達成率',
          item_type: 'percentage',
          calculation_logic: '(achievement / target) * 100',
          display_order: null // 表示順序未設定（空）
        }
      ],
      created_at: new Date('2024-01-15T10:00:00Z'),
      created_by: 'user_001',
      status: 'draft'
    };

    const result = defineMonthlyTemplate(template_input);

    // Assertion 1: テンプレートが正常に定義されている
    expect(result).toBeDefined();
    expect(result.template_id).toBe('template_001');
    expect(result.template_name).toBe('月次営業成果サマリー');

    // Assertion 2: テンプレート項目が3件存在する
    expect(result.items).toHaveLength(3);

    // Assertion 3: 表示順序がデフォルト順序で自動設定されている（追加順序＝1, 2, 3）
    expect(result.items[0].display_order).toBe(1);
    expect(result.items[1].display_order).toBe(2);
    expect(result.items[2].display_order).toBe(3);

    // Assertion 4: 各項目のデータが保持されている
    expect(result.items[0].item_id).toBe('item_sales');
    expect(result.items[0].item_name).toBe('売上');
    expect(result.items[1].item_id).toBe('item_count');
    expect(result.items[1].item_name).toBe('件数');
    expect(result.items[2].item_id).toBe('item_rate');
    expect(result.items[2].item_name).toBe('達成率');

    // Assertion 5: テンプレートのステータスが'active'に更新されている
    expect(result.status).toBe('active');

    // Assertion 6: テンプレート項目の計算ロジックが正確に保持されている
    expect(result.items[0].calculation_logic).toBe('SUM(revenue)');
    expect(result.items[1].calculation_logic).toBe('COUNT(transactions)');
    expect(result.items[2].calculation_logic).toBe('(achievement / target) * 100');

    // Assertion 7: テンプレート項目の型情報が正確に保持されている
    expect(result.items[0].item_type).toBe('numeric');
    expect(result.items[1].item_type).toBe('numeric');
    expect(result.items[2].item_type).toBe('percentage');

    // Assertion 8: プレビュー出力が正しい順序で構成される
    expect(result.preview_order).toEqual(['売上', '件数', '達成率']);

    // Assertion 9: テンプレートの作成者と作成日時が記録されている
    expect(result.created_by).toBe('user_001');
    expect(result.created_at).toEqual(new Date('2024-01-15T10:00:00Z'));

    // Assertion 10: エラーが発生していない
    expect(result.error).toBeUndefined();
  });
});