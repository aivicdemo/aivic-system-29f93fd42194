import { mapSalesDataToMonthlySummaryTemplate } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレート定義・管理機能', () => {
  // SCEN-1150: [edge] 営業データから月次サマリーテンプレートへの自動マッピング - 空の営業データセットに対してマッピングを実行した場合、空のテンプレート構造が正常に生成される
  test('空の営業データセットからマッピング実行時、エラーなくヘッダー行と空データ行を含む有効なテンプレート構造が生成される', () => {
    const emptyDataset: Array<Record<string, unknown>> = [];
    const templateDefinition = {
      template_id: 'tpl_monthly_summary_001',
      template_name: '月次売上サマリー',
      columns: [
        { column_id: 'col_001', column_name: '顧客名', data_type: 'string', required: true },
        { column_id: 'col_002', column_name: 'アポ数', data_type: 'number', required: false },
        { column_id: 'col_003', column_name: '成約数', data_type: 'number', required: false },
        { column_id: 'col_004', column_name: '売上金額', data_type: 'number', required: false },
      ],
    };

    const result = mapSalesDataToMonthlySummaryTemplate(emptyDataset, templateDefinition);

    expect(result).toBeDefined();
    expect(result.status).toBe('success');
    expect(result.template_id).toBe('tpl_monthly_summary_001');
    expect(result.rows).toEqual([]);
    expect(result.columns).toHaveLength(4);
    expect(result.columns[0]).toEqual({
      column_id: 'col_001',
      column_name: '顧客名',
      data_type: 'string',
      required: true,
    });
    expect(result.columns[1]).toEqual({
      column_id: 'col_002',
      column_name: 'アポ数',
      data_type: 'number',
      required: false,
    });
    expect(result.columns[2]).toEqual({
      column_id: 'col_003',
      column_name: '成約数',
      data_type: 'number',
      required: false,
    });
    expect(result.columns[3]).toEqual({
      column_id: 'col_004',
      column_name: '売上金額',
      data_type: 'number',
      required: false,
    });
    expect(result.error_count).toBe(0);
    expect(result.warning_count).toBe(0);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});