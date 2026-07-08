import { validateAndApproveDataQuality } from '../../src/logic/it-6-2-2-1';

describe('データ品質検証・承認基準判定機能', () => {
  test('SCEN-924: 過去案件データ件数・カバー率・データ品質指標が全て承認基準を満たす場合に承認可能と判定される', () => {
    // Arrange: テストデータの準備
    // 承認基準: 過去案件データ件数 >= 500件、カバー率 >= 80%、データ品質指標スコア >= 90
    const test_data_input = {
      past_project_count: 650,           // 承認基準(500件)以上
      coverage_rate_percent: 85,          // 承認基準(80%)以上
      data_quality_score: 92              // 承認基準(90)以上
    };

    // Act: データ品質検証・承認基準判定機能を実行
    const result = validateAndApproveDataQuality(test_data_input);

    // Assert: 返却された判定結果を確認
    // 全ての指標が承認基準を満たしているため、approval_status = 'approved'
    expect(result.approval_status).toBe('approved');
    expect(result.is_approvable).toBe(true);
    expect(result.past_project_count_approved).toBe(true);
    expect(result.coverage_rate_approved).toBe(true);
    expect(result.data_quality_score_approved).toBe(true);
    expect(result.approval_reason).toBe('全ての指標が承認基準を満たしています');
  });
});