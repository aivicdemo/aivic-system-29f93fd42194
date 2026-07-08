import { validateCriterionConsistency } from '../../src/logic/it-6-2-2-1';

describe('査定員別・案件別の判定ロジック・乖離パターン履歴の記録・抽出機能', () => {
  test('SCEN-897: 複数基準間で矛盾する定義が検出され登録不可と判定される', () => {
    // 既存の基準A：走行距離5万km以上で減点対象
    const criterionA = {
      id: 'CRIT-A-001',
      name: '走行距離による評価基準',
      type: 'distance',
      threshold: 50000,
      condition: 'ge', // greater than or equal
      evaluation: 'deduction', // 減点
      weight: 10,
    };

    // 矛盾する定義の基準B：走行距離5万km以上は加点対象
    const criterionB = {
      id: 'CRIT-B-001',
      name: '走行距離による走行性能評価',
      type: 'distance',
      threshold: 50000,
      condition: 'ge',
      evaluation: 'addition', // 加点（矛盾）
      weight: 5,
    };

    // 既存基準リスト（基準Aを含む）
    const existingCriteria = [criterionA];

    // validateCriterionConsistency を実行
    // 基準Bを新規登録する際に、既存基準との矛盾を検証
    const validationResult = validateCriterionConsistency(
      criterionB,
      existingCriteria
    );

    // 検証失敗の期待値
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.errorMessage).toMatch(/矛盾/);
    expect(validationResult.conflictingCriteriaIds).toContain('CRIT-A-001');
    expect(validationResult.conflictDetails).toBeDefined();
    expect(validationResult.conflictDetails.length).toBeGreaterThan(0);

    // 矛盾内容の詳細確認
    const conflict = validationResult.conflictDetails[0];
    expect(conflict.existingCriterionId).toBe('CRIT-A-001');
    expect(conflict.newCriterionId).toBe('CRIT-B-001');
    expect(conflict.conflictingField).toBe('evaluation');
    expect(conflict.existingValue).toBe('deduction');
    expect(conflict.newValue).toBe('addition');
    expect(conflict.reason).toMatch(/同一の条件/);

    // 登録不可であることを確認
    expect(validationResult.canBeRegistered).toBe(false);
  });
});