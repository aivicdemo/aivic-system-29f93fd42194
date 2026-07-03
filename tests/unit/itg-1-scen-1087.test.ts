import { retrieveImprovementItems } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ検証・異常検出機能 - 改善点の優先度順整列', () => {
  test('SCEN-1087: 同一優先度の改善点が作成日時順に整列される', () => {
    // テストデータ: 同一優先度で異なる作成日時を持つ改善点レコード（3件以上）
    const improvement_items = [
      {
        id: 'imp-001',
        priority: 1,
        title: '必須項目の欠落検出',
        description: '顧客名フィールドが未入力',
        created_at: new Date('2024-01-01T11:30:00Z'),
      },
      {
        id: 'imp-002',
        priority: 1,
        title: 'データ型の不整合検出',
        description: '金額フィールドが文字列形式',
        created_at: new Date('2024-01-01T09:15:00Z'),
      },
      {
        id: 'imp-003',
        priority: 1,
        title: '値の範囲外検出',
        description: '割引率が100%を超えている',
        created_at: new Date('2024-01-01T10:00:00Z'),
      },
      {
        id: 'imp-004',
        priority: 1,
        title: '矛盾値検出',
        description: '成約数がアポ数を超えている',
        created_at: new Date('2024-01-01T12:45:00Z'),
      },
    ];

    // 改善点一覧取得関数を実行
    const result = retrieveImprovementItems(improvement_items);

    // 同一優先度の改善点が取得されたことを確認
    expect(result).toHaveLength(4);

    // 作成日時の昇順整列を検証
    expect(result[0].id).toBe('imp-002');
    expect(result[0].created_at).toEqual(new Date('2024-01-01T09:15:00Z'));

    expect(result[1].id).toBe('imp-003');
    expect(result[1].created_at).toEqual(new Date('2024-01-01T10:00:00Z'));

    expect(result[2].id).toBe('imp-001');
    expect(result[2].created_at).toEqual(new Date('2024-01-01T11:30:00Z'));

    expect(result[3].id).toBe('imp-004');
    expect(result[3].created_at).toEqual(new Date('2024-01-01T12:45:00Z'));

    // 時系列の整合性を検証（各要素の作成日時が昇順であることを確認）
    for (let i = 0; i < result.length - 1; i += 1) {
      const current_time = result[i].created_at.getTime();
      const next_time = result[i + 1].created_at.getTime();
      expect(current_time < next_time).toBe(true);
    }

    // すべての要素が同一優先度を持つことを確認
    const all_priority_one = result.every((item) => item.priority === 1);
    expect(all_priority_one).toBe(true);
  });
});