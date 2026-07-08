import { calculateErrorPriority } from '../../src/logic/it-6-2-2-2';

describe('読取誤り優先度自動スコアリング機能', () => {
  // SCEN-1447
  test('複数件の誤り報告で発生頻度が最高値に達した場合に優先度が最大化される', () => {
    // テストデータ: 複数の読取誤りタイプと発生頻度
    const errorReports = [
      { errorType: 'amount_misread', frequency: 15, threshold: 15 },
      { errorType: 'quantity_misread', frequency: 3, threshold: 15 },
      { errorType: 'unit_misread', frequency: 1, threshold: 15 },
    ];

    // 読取誤り優先度自動スコアリング機能を実行
    const priorityScores = calculateErrorPriority(errorReports);

    // 検証1: 発生頻度が最高値に達した誤り（amount_misread）の優先度スコアが最大値（100）であることを検証
    const amountMisreadScore = priorityScores.find(
      (item) => item.errorType === 'amount_misread'
    );
    expect(amountMisreadScore?.priorityScore).toBe(100);

    // 検証2: 発生頻度が低い誤り（quantity_misread）の優先度スコアが低いことを検証
    const quantityMisreadScore = priorityScores.find(
      (item) => item.errorType === 'quantity_misread'
    );
    expect(quantityMisreadScore?.priorityScore).toBe(20);

    // 検証3: 発生頻度が最も低い誤り（unit_misread）の優先度スコアが最も低いことを検証
    const unitMisreadScore = priorityScores.find(
      (item) => item.errorType === 'unit_misread'
    );
    expect(unitMisreadScore?.priorityScore).toBe(7);

    // 検証4: 優先度スコアが正しく差別化されていることを確認
    expect(amountMisreadScore!.priorityScore).toBeGreaterThan(
      quantityMisreadScore!.priorityScore
    );
    expect(quantityMisreadScore!.priorityScore).toBeGreaterThan(
      unitMisreadScore!.priorityScore
    );

    // 検証5: スコアリング結果の配列長が期待値と一致すること
    expect(priorityScores).toHaveLength(3);

    // 検証6: すべての誤りタイプがスコアリング結果に含まれていること
    const resultErrorTypes = priorityScores.map((item) => item.errorType);
    expect(resultErrorTypes).toContain('amount_misread');
    expect(resultErrorTypes).toContain('quantity_misread');
    expect(resultErrorTypes).toContain('unit_misread');
  });
});