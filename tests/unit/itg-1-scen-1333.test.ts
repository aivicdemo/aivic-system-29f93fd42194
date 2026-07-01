import { describe, test, expect } from '@jest/globals';
import { generateMonthlySummaryFromTemplate } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレート定義・管理', () => {
  // SCEN-1333: [error] 月次サマリーテンプレート定義・管理 - 無効なテンプレート定義でサマリー生成を試行した場合、処理がエラーとなる
  test('無効なテンプレート定義でサマリー生成時にエラー発生', () => {
    // テンプレート定義なし（null）の場合
    expect(() =>
      generateMonthlySummaryFromTemplate({
        template: null as any,
        salesData: {
          appointmentCount: 10,
          contractCount: 3,
          serviceType: 'service_a',
        },
      })
    ).toThrow(/テンプレート/);

    // 必須フィールド（templateName）が空の場合
    expect(() =>
      generateMonthlySummaryFromTemplate({
        template: {
          templateId: 'tpl_001',
          templateName: '',
          version: 1,
          items: [
            {
              itemId: 'item_001',
              fieldName: 'appointmentCount',
              displayLabel: 'アポイント数',
              dataType: 'number',
              calculationFormula: '{appointmentCount}',
              displayOrder: 1,
              isRequired: true,
            },
          ],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        salesData: {
          appointmentCount: 10,
          contractCount: 3,
          serviceType: 'service_a',
        },
      })
    ).toThrow(/テンプレート名/);

    // 計算式が不正な場合（存在しないフィールド参照）
    expect(() =>
      generateMonthlySummaryFromTemplate({
        template: {
          templateId: 'tpl_002',
          templateName: '月次サマリー',
          version: 1,
          items: [
            {
              itemId: 'item_001',
              fieldName: 'total',
              displayLabel: '合計',
              dataType: 'number',
              calculationFormula: '{invalidField} + {appointmentCount}',
              displayOrder: 1,
              isRequired: true,
            },
          ],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        salesData: {
          appointmentCount: 10,
          contractCount: 3,
          serviceType: 'service_a',
        },
      })
    ).toThrow(/計算式/);

    // 必須フィールドが指定されていない場合
    expect(() =>
      generateMonthlySummaryFromTemplate({
        template: {
          templateId: 'tpl_003',
          templateName: '月次サマリー',
          version: 1,
          items: [
            {
              itemId: 'item_001',
              fieldName: 'appointmentCount',
              displayLabel: 'アポイント数',
              dataType: 'number',
              calculationFormula: '{appointmentCount}',
              displayOrder: 1,
              isRequired: true,
            },
          ],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        salesData: {
          contractCount: 3,
          serviceType: 'service_a',
        },
      })
    ).toThrow(/必須フィールド/);

    // データ型不一致（number期待だがstring型の場合）
    expect(() =>
      generateMonthlySummaryFromTemplate({
        template: {
          templateId: 'tpl_004',
          templateName: '月次サマリー',
          version: 1,
          items: [
            {
              itemId: 'item_001',
              fieldName: 'appointmentCount',
              displayLabel: 'アポイント数',
              dataType: 'number',
              calculationFormula: '{appointmentCount} * 2',
              displayOrder: 1,
              isRequired: true,
            },
          ],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        salesData: {
          appointmentCount: 'ten',
          contractCount: 3,
          serviceType: 'service_a',
        },
      })
    ).toThrow(/データ型/);

    // テンプレートアイテムが空の場合
    expect(() =>
      generateMonthlySummaryFromTemplate({
        template: {
          templateId: 'tpl_005',
          templateName: '月次サマリー',
          version: 1,
          items: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        salesData: {
          appointmentCount: 10,
          contractCount: 3,
          serviceType: 'service_a',
        },
      })
    ).toThrow(/アイテム/);

    // 計算式が無効な場合（括弧の不一致）
    expect(() =>
      generateMonthlySummaryFromTemplate({
        template: {
          templateId: 'tpl_006',
          templateName: '月次サマリー',
          version: 1,
          items: [
            {
              itemId: 'item_001',
              fieldName: 'calculation',
              displayLabel: '計算結果',
              dataType: 'number',
              calculationFormula: '({appointmentCount} * 2',
              displayOrder: 1,
              isRequired: true,
            },
          ],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        salesData: {
          appointmentCount: 10,
          contractCount: 3,
          serviceType: 'service_a',
        },
      })
    ).toThrow(/計算式/);
  });
});