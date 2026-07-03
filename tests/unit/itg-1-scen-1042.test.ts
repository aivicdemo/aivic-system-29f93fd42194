import { generateMonthlySummaryTemplate } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理', () => {
  // SCEN-1042
  test('月次サマリーテンプレートの定義項目が標準化されたテンプレート形式に従って正常に生成される', () => {
    const input = {
      reportName: '2024年1月営業成果月次サマリー',
      targetPeriod: '2024-01-01~2024-01-31',
      targetDepartments: ['営業部', '営業サポート部'],
      definedItems: ['売上', '利益率', '顧客数', '案件数'],
      templateFormat: 'CSV',
    };

    const result = generateMonthlySummaryTemplate(input);

    // テンプレート生成成功の基本構造
    expect(result).toHaveProperty('templateId');
    expect(result).toHaveProperty('templateContent');
    expect(result).toHaveProperty('fileFormat');
    expect(result).toHaveProperty('fileName');
    expect(result).toHaveProperty('headers');
    expect(result).toHaveProperty('itemSequence');

    // ファイル形式の確認
    expect(result.fileFormat).toBe('CSV');

    // ファイル名の確認（レポート名と期間を含む）
    expect(result.fileName).toMatch(/2024年1月営業成果月次サマリー/);
    expect(result.fileName).toMatch(/\.csv$/i);

    // テンプレートヘッダーの確認
    expect(result.headers).toEqual(['レポート名', '対象期間', '部門', '売上', '利益率', '顧客数', '案件数']);

    // 定義項目の順序確認
    expect(result.itemSequence).toEqual(['売上', '利益率', '顧客数', '案件数']);

    // テンプレート内容の標準化形式チェック
    expect(result.templateContent).toContain('レポート名');
    expect(result.templateContent).toContain('2024年1月営業成果月次サマリー');
    expect(result.templateContent).toContain('2024-01-01~2024-01-31');
    expect(result.templateContent).toContain('営業部');
    expect(result.templateContent).toContain('営業サポート部');
    expect(result.templateContent).toContain('売上');
    expect(result.templateContent).toContain('利益率');
    expect(result.templateContent).toContain('顧客数');
    expect(result.templateContent).toContain('案件数');

    // ヘッダー行がテンプレート内容に含まれていることを確認
    expect(result.templateContent).toMatch(/レポート名.*対象期間.*部門.*売上.*利益率.*顧客数.*案件数/);

    // テンプレートが空ではないことを確認
    expect(result.templateContent.length).toBeGreaterThan(0);

    // CSVフォーマットの確認（改行で複数行）
    const lines = result.templateContent.split('\n');
    expect(lines.length).toBeGreaterThan(1);

    // 定義項目がすべて正しい順序で配置されていることを確認
    const itemIndices = {
      売上: result.templateContent.indexOf('売上'),
      利益率: result.templateContent.indexOf('利益率'),
      顧客数: result.templateContent.indexOf('顧客数'),
      案件数: result.templateContent.indexOf('案件数'),
    };
    expect(itemIndices.売上).toBeLessThan(itemIndices.利益率);
    expect(itemIndices.利益率).toBeLessThan(itemIndices.顧客数);
    expect(itemIndices.顧客数).toBeLessThan(itemIndices.案件数);

    // テンプレートIDが生成されていることを確認（ユニークな識別子）
    expect(result.templateId).toMatch(/^TMPL-/);
    expect(result.templateId.length).toBeGreaterThan(5);
  });
});