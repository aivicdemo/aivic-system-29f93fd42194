import { calculateAccuracyDifference } from '../../src/logic/it-6-2-1-1';

describe('モデル更新回帰テスト精度判定機能', () => {
  // SCEN-1451: [edge] モデル更新回帰テスト精度判定機能 - 更新前後の精度差がちょうど許容閾値の場合に本番適用承認判定が出される
  test('更新前後の精度差がちょうど許容閾値と一致した場合、本番適用承認判定が「承認」と判定される', () => {
    // Arrange: テスト環境でモデル更新回帰テスト精度判定機能を初期化
    const accuracy_before = 0.850;
    const accuracy_after = 0.840;
    const tolerance_threshold = -0.010;

    // Act: 精度差を計算し精度判定ロジックを実行
    const result = calculateAccuracyDifference({
      accuracy_before,
      accuracy_after,
      tolerance_threshold,
    });

    // Assert: 更新前後の精度差がちょうど許容閾値と一致した場合、本番適用承認判定が「承認」と判定される
    expect(result.approval_judgment).toBe('承認');
    expect(result.accuracy_difference).toBe(-0.010);
    expect(result.is_approved).toBe(true);
  });
});