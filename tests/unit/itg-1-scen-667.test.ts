import { describe, test, expect } from '@jest/globals';
import {
  generateMonthlySummaryReport,
} from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレート定義・管理機能', () => {
  test('SCEN-667: 月次成果指標自動集計機能 - 集計結果がレポートテンプレートに基づいて標準化される', () => {
    // 入力: テスト用の月次営業データ
    const monthlyData = {
      sales: 5000000,
      orderCount: 45,
      customerCount: 120,
      appointmentCount: 180,
      conversionRate: 25.0,
      month: '2024-01',
    };

    // 標準レポートテンプレート（詳細版）の定義
    const detailedTemplate = {
      templateId: 'TEMPLATE_001',
      templateName: '詳細版',
      items: [
        {
          itemId: 'ITEM_001',
          itemName: '売上高',
          dataSource: 'sales',
          format: 'currency',
          unit: '円',
          decimals: 0,
          displayOrder: 1,
        },
        {
          itemId: 'ITEM_002',
          itemName: '受注数',
          dataSource: 'orderCount',
          format: 'number',
          unit: '件',
          decimals: 0,
          displayOrder: 2,
        },
        {
          itemId: 'ITEM_003',
          itemName: '顧客数',
          dataSource: 'customerCount',
          format: 'number',
          unit: '社',
          decimals: 0,
          displayOrder: 3,
        },
        {
          itemId: 'ITEM_004',
          itemName: 'アポイント数',
          dataSource: 'appointmentCount',
          format: 'number',
          unit: '件',
          decimals: 0,
          displayOrder: 4,
        },
        {
          itemId: 'ITEM_005',
          itemName: '成約率',
          dataSource: 'conversionRate',
          format: 'percentage',
          unit: '%',
          decimals: 1,
          displayOrder: 5,
        },
      ],
    };

    // 詳細版テンプレートでの集計実行
    const detailedResult = generateMonthlySummaryReport(
      monthlyData,
      detailedTemplate,
    );

    // 期待結果: 詳細版テンプレートに基づいたレポート生成
    expect(detailedResult).toEqual({
      templateId: 'TEMPLATE_001',
      templateName: '詳細版',
      month: '2024-01',
      items: [
        {
          itemId: 'ITEM_001',
          itemName: '売上高',
          value: 5000000,
          formattedValue: '5,000,000',
          unit: '円',
          displayOrder: 1,
        },
        {
          itemId: 'ITEM_002',
          itemName: '受注数',
          value: 45,
          formattedValue: '45',
          unit: '件',
          displayOrder: 2,
        },
        {
          itemId: 'ITEM_003',
          itemName: '顧客数',
          value: 120,
          formattedValue: '120',
          unit: '社',
          displayOrder: 3,
        },
        {
          itemId: 'ITEM_004',
          itemName: 'アポイント数',
          value: 180,
          formattedValue: '180',
          unit: '件',
          displayOrder: 4,
        },
        {
          itemId: 'ITEM_005',
          itemName: '成約率',
          value: 25.0,
          formattedValue: '25.0',
          unit: '%',
          displayOrder: 5,
        },
      ],
      generatedAt: detailedResult.generatedAt,
    });

    // サマリー版テンプレートの定義（項目数が少ないテンプレート）
    const summaryTemplate = {
      templateId: 'TEMPLATE_002',
      templateName: 'サマリー版',
      items: [
        {
          itemId: 'ITEM_001',
          itemName: '売上高',
          dataSource: 'sales',
          format: 'currency',
          unit: '円',
          decimals: 0,
          displayOrder: 1,
        },
        {
          itemId: 'ITEM_002',
          itemName: '受注数',
          dataSource: 'orderCount',
          format: 'number',
          unit: '件',
          decimals: 0,
          displayOrder: 2,
        },
        {
          itemId: 'ITEM_005',
          itemName: '成約率',
          dataSource: 'conversionRate',
          format: 'percentage',
          unit: '%',
          decimals: 1,
          displayOrder: 3,
        },
      ],
    };

    // サマリー版テンプレートでの集計実行
    const summaryResult = generateMonthlySummaryReport(
      monthlyData,
      summaryTemplate,
    );

    // 期待結果: サマリー版テンプレートに基づいたレポート生成
    expect(summaryResult).toEqual({
      templateId: 'TEMPLATE_002',
      templateName: 'サマリー版',
      month: '2024-01',
      items: [
        {
          itemId: 'ITEM_001',
          itemName: '売上高',
          value: 5000000,
          formattedValue: '5,000,000',
          unit: '円',
          displayOrder: 1,
        },
        {
          itemId: 'ITEM_002',
          itemName: '受注数',
          value: 45,
          formattedValue: '45',
          unit: '件',
          displayOrder: 2,
        },
        {
          itemId: 'ITEM_005',
          itemName: '成約率',
          value: 25.0,
          formattedValue: '25.0',
          unit: '%',
          displayOrder: 3,
        },
      ],
      generatedAt: summaryResult.generatedAt,
    });

    // テンプレート項目の配置順序が保持されていることを確認
    expect(summaryResult.items.length).toBe(3);
    expect(summaryResult.items[0].displayOrder).toBe(1);
    expect(summaryResult.items[1].displayOrder).toBe(2);
    expect(summaryResult.items[2].displayOrder).toBe(3);

    // データ形式が正しく適用されていることを確認
    expect(detailedResult.items[0].formattedValue).toBe('5,000,000');
    expect(detailedResult.items[0].unit).toBe('円');
    expect(detailedResult.items[4].formattedValue).toBe('25.0');
    expect(detailedResult.items[4].unit).toBe('%');

    // 同じデータが異なるテンプレートで集計されても、各テンプレート定義に従った結果になることを確認
    expect(detailedResult.items.length).toBe(5);
    expect(summaryResult.items.length).toBe(3);
    expect(detailedResult.templateId).toBe('TEMPLATE_001');
    expect(summaryResult.templateId).toBe('TEMPLATE_002');

    // テンプレート名が正しく反映されていることを確認
    expect(detailedResult.templateName).toBe('詳細版');
    expect(summaryResult.templateName).toBe('サマリー版');

    // 集計対象月が正しく記録されていることを確認
    expect(detailedResult.month).toBe('2024-01');
    expect(summaryResult.month).toBe('2024-01');

    // 生成日時がタイムスタンプとして記録されていることを確認
    expect(typeof detailedResult.generatedAt).toBe('string');
    expect(typeof summaryResult.generatedAt).toBe('string');
  });
});