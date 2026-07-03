import { determinePriority } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能 - 改善項目優先度判定', () => {
  // SCEN-913
  test('優先度判定ルール未定義の場合、デフォルトルール適用またはエラーハンドリングを返す', () => {
    // 1. テストデータ準備: ルール未定義の状態で改善項目を作成
    const improvementItems = [
      {
        itemId: 'item-001',
        title: '営業データ品質チェックの自動化',
        category: 'automation',
        impactScore: 8,
        effortScore: 3,
        discoveredDate: '2024-01-15T10:30:00Z'
      },
      {
        itemId: 'item-002',
        title: 'レポート生成テンプレートの標準化',
        category: 'template',
        impactScore: 6,
        effortScore: 5,
        discoveredDate: '2024-01-14T09:15:00Z'
      },
      {
        itemId: 'item-003',
        title: '請求額計算ルールの明文化',
        category: 'documentation',
        impactScore: 7,
        effortScore: 2,
        discoveredDate: '2024-01-13T14:45:00Z'
      }
    ];

    // 2. ルール未定義フラグを明示的に設定
    const priorityRules = null;
    const useDefaultRules = true;

    // 3. 改善項目優先度判定APIを実行
    const result = determinePriority(improvementItems, priorityRules, useDefaultRules);

    // 4. レスポンスの検証
    // 4-1. nullポインタ例外やシステムエラーが発生していないことを確認
    expect(result).not.toBeNull();
    expect(result).toBeDefined();

    // 4-2. デフォルトルール適用時の結果を検証
    if (result.status === 'success') {
      expect(result.priorityAssignments).toBeDefined();
      expect(Array.isArray(result.priorityAssignments)).toBe(true);
      expect(result.priorityAssignments.length).toBe(3);

      // 優先度が割り当てられていることを確認
      const assignedItems = result.priorityAssignments.filter(
        (a) => a.priority !== null && a.priority !== undefined
      );
      expect(assignedItems.length).toBeGreaterThan(0);

      // 各割り当てがFIFO順（日付の古い順）またはデフォルト優先度ルールに従っていることを確認
      // デフォルトルール: impact/effort比が高い順（impact/effort）
      const expectedOrder = improvementItems
        .map((item) => ({
          itemId: item.itemId,
          ratio: item.impactScore / item.effortScore
        }))
        .sort((a, b) => b.ratio - a.ratio)
        .map((x) => x.itemId);

      const actualOrder = result.priorityAssignments
        .sort((a, b) => a.priority - b.priority)
        .map((a) => a.itemId);

      expect(actualOrder).toEqual(expectedOrder);

      // 判定方法がデフォルトルール使用であることを確認
      expect(result.ruleName).toBe('DEFAULT_PRIORITY_RULE');
      expect(result.appliedRuleType).toBe('default');
    } else if (result.status === 'pending') {
      // 4-3. 判定保留ステータスの場合の検証
      expect(result.status).toBe('pending');
      expect(result.message).toMatch(/ルール未定義/);
      expect(result.priorityAssignments).not.toBeDefined();
      expect(result.errorDetails).toBeDefined();
    } else if (result.status === 'error') {
      // 4-4. エラーハンドリング時の検証（ただしシステムエラーではなく業務エラー）
      expect(result.status).toBe('error');
      expect(result.message).toMatch(/優先度/);
      expect(result.errorCode).toBeDefined();
      expect(['RULE_NOT_DEFINED', 'PRIORITY_DETERMINATION_FAILED']).toContain(
        result.errorCode
      );
    }

    // 5. いずれのケースでもレスポンスが整形されていることを確認
    expect(result.timestamp).toBeDefined();
    expect(typeof result.timestamp).toBe('string');

    // 6. 結果構造の型安全性を確認
    expect(result).toHaveProperty('status');
    expect(['success', 'pending', 'error']).toContain(result.status);
  });
});