import { defineAggregationRules } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  test('SCEN-1026: 空の集計項目リストが入力されたときにエラーが返却される', () => {
    const input = {
      extraction_rule_name: '営業成果抽出ルール_202501',
      aggregation_items: [],
      report_format: 'pdf',
      target_period_start: '2025-01-01',
      target_period_end: '2025-01-31'
    };

    expect(() => defineAggregationRules(input)).toThrow(/集計項目/);
  });
});