import { generateMonthlySummary } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレート定義・管理機能', () => {
  test('SCEN-624: 複数の月次サマリーテンプレートが定義されている場合、指定されたテンプレートに基づいてのみサマリーが生成される', () => {
    // テンプレート定義
    const templateA = {
      template_id: 'tpl_a_001',
      template_name: 'テンプレートA',
      items: [
        {
          item_id: 'item_a_001',
          item_name: '営業活動数',
          display_order: 1,
          calculation_logic: 'SUM(営業活動.件数)',
          format_type: 'numeric',
        },
        {
          item_id: 'item_a_002',
          item_name: '成約数',
          display_order: 2,
          calculation_logic: 'SUM(成約.件数)',
          format_type: 'numeric',
        },
      ],
      created_at: new Date('2024-01-01T09:00:00Z'),
      updated_at: new Date('2024-01-01T09:00:00Z'),
    };

    const templateB = {
      template_id: 'tpl_b_001',
      template_name: 'テンプレートB',
      items: [
        {
          item_id: 'item_b_001',
          item_name: '売上高',
          display_order: 1,
          calculation_logic: 'SUM(営業データ.売上)',
          format_type: 'currency',
        },
        {
          item_id: 'item_b_002',
          item_name: '顧客満足度',
          display_order: 2,
          calculation_logic: 'AVG(顧客反応.スコア)',
          format_type: 'percentage',
        },
      ],
      created_at: new Date('2024-01-01T09:00:00Z'),
      updated_at: new Date('2024-01-01T09:00:00Z'),
    };

    const templateC = {
      template_id: 'tpl_c_001',
      template_name: 'テンプレートC',
      items: [
        {
          item_id: 'item_c_001',
          item_name: '請求額合計',
          display_order: 1,
          calculation_logic: 'SUM(請求集計.金額)',
          format_type: 'currency',
        },
        {
          item_id: 'item_c_002',
          item_name: '請求件数',
          display_order: 2,
          calculation_logic: 'COUNT(請求.ID)',
          format_type: 'numeric',
        },
      ],
      created_at: new Date('2024-01-01T09:00:00Z'),
      updated_at: new Date('2024-01-01T09:00:00Z'),
    };

    const monthly_period = {
      year: 2024,
      month: 1,
      start_date: new Date('2024-01-01T00:00:00Z'),
      end_date: new Date('2024-01-31T23:59:59Z'),
    };

    // テンプレートAでサマリー生成
    const summaryA = generateMonthlySummary({
      template_id: templateA.template_id,
      monthly_period,
      aggregated_data: {
        営業活動件数: 45,
        成約件数: 12,
        売上高: 2500000,
        顧客満足度スコア: 85.5,
        請求額合計: 1800000,
        請求件数: 8,
      },
    });

    // テンプレートAのサマリー検証
    expect(summaryA).toEqual(
      expect.objectContaining({
        template_id: templateA.template_id,
        monthly_period,
        summary_data: expect.arrayContaining([
          expect.objectContaining({
            item_id: 'item_a_001',
            item_name: '営業活動数',
            value: 45,
            display_order: 1,
          }),
          expect.objectContaining({
            item_id: 'item_a_002',
            item_name: '成約数',
            value: 12,
            display_order: 2,
          }),
        ]),
      })
    );

    // テンプレートAにはテンプレートBの要素がないことを確認
    const summaryA_item_names = summaryA.summary_data.map(
      (item: { item_name: string }) => item.item_name
    );
    expect(summaryA_item_names).not.toContain('売上高');
    expect(summaryA_item_names).not.toContain('顧客満足度');

    // テンプレートAにはテンプレートCの要素がないことを確認
    expect(summaryA_item_names).not.toContain('請求額合計');
    expect(summaryA_item_names).not.toContain('請求件数');

    // テンプレートBでサマリー生成
    const summaryB = generateMonthlySummary({
      template_id: templateB.template_id,
      monthly_period,
      aggregated_data: {
        営業活動件数: 45,
        成約件数: 12,
        売上高: 2500000,
        顧客満足度スコア: 85.5,
        請求額合計: 1800000,
        請求件数: 8,
      },
    });

    // テンプレートBのサマリー検証
    expect(summaryB).toEqual(
      expect.objectContaining({
        template_id: templateB.template_id,
        monthly_period,
        summary_data: expect.arrayContaining([
          expect.objectContaining({
            item_id: 'item_b_001',
            item_name: '売上高',
            value: 2500000,
            display_order: 1,
          }),
          expect.objectContaining({
            item_id: 'item_b_002',
            item_name: '顧客満足度',
            value: 85.5,
            display_order: 2,
          }),
        ]),
      })
    );

    // テンプレートBにはテンプレートAの要素がないことを確認
    const summaryB_item_names = summaryB.summary_data.map(
      (item: { item_name: string }) => item.item_name
    );
    expect(summaryB_item_names).not.toContain('営業活動数');
    expect(summaryB_item_names).not.toContain('成約数');

    // テンプレートBにはテンプレートCの要素がないことを確認
    expect(summaryB_item_names).not.toContain('請求額合計');
    expect(summaryB_item_names).not.toContain('請求件数');

    // テンプレートCでサマリー生成
    const summaryC = generateMonthlySummary({
      template_id: templateC.template_id,
      monthly_period,
      aggregated_data: {
        営業活動件数: 45,
        成約件数: 12,
        売上高: 2500000,
        顧客満足度スコア: 85.5,
        請求額合計: 1800000,
        請求件数: 8,
      },
    });

    // テンプレートCのサマリー検証
    expect(summaryC).toEqual(
      expect.objectContaining({
        template_id: templateC.template_id,
        monthly_period,
        summary_data: expect.arrayContaining([
          expect.objectContaining({
            item_id: 'item_c_001',
            item_name: '請求額合計',
            value: 1800000,
            display_order: 1,
          }),
          expect.objectContaining({
            item_id: 'item_c_002',
            item_name: '請求件数',
            value: 8,
            display_order: 2,
          }),
        ]),
      })
    );

    // テンプレートCにはテンプレートAの要素がないことを確認
    const summaryC_item_names = summaryC.summary_data.map(
      (item: { item_name: string }) => item.item_name
    );
    expect(summaryC_item_names).not.toContain('営業活動数');
    expect(summaryC_item_names).not.toContain('成約数');

    // テンプレートCにはテンプレートBの要素がないことを確認
    expect(summaryC_item_names).not.toContain('売上高');
    expect(summaryC_item_names).not.toContain('顧客満足度');

    // 各テンプレートのサマリーデータ件数を確認
    expect(summaryA.summary_data).toHaveLength(2);
    expect(summaryB.summary_data).toHaveLength(2);
    expect(summaryC.summary_data).toHaveLength(2);
  });
});