import { assignProjectClassificationTags } from '../../src/logic/it-1-br-2-2-2-1';

describe('査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード', () => {
  test('SCEN-917: 過去案件データ分類タグ自動判定機能 - 補助分類タグなしの案件データに対して空文字列が正しく設定される', () => {
    // 初期化: テスト対象の過去案件データ分類タグ自動判定機能
    const input = {
      project_id: 'proj_001',
      region_code: '13',
      work_type_code: 'foundation',
      project_date: '2024-01-15',
      estimated_amount: 5000000,
      estimated_qty: 100,
      supplier_name: 'ZeneKo ABC Inc.',
      supplementary_tag: '',
    };

    // 自動判定機能に入力して戻り値を取得
    const result = assignProjectClassificationTags(input);

    // 戻り値の補助分類タグ項目を確認
    expect(result).toEqual({
      project_id: 'proj_001',
      region_code: '13',
      work_type_code: 'foundation',
      project_date: '2024-01-15',
      estimated_amount: 5000000,
      estimated_qty: 100,
      supplier_name: 'ZeneKo ABC Inc.',
      supplementary_tag: '',
      primary_classification: 'foundation_standard',
      secondary_classification: 'standard_tokyo',
    });

    // 補助分類タグ項目が空文字列であることを検証
    expect(result.supplementary_tag).toBe('');
  });
});