import { validateReportApprovalCriteria } from '../../src/logic/it-1781935279444-2-1-1';

describe('レポート内容承認基準判定機能', () => {
  test('SCEN-654: 複数チェック項目のうち1項目のみ境界値で合格した場合に全体として承認可と判定される', () => {
    // Arrange: テスト環境初期化、複数のチェック項目を設定
    const checkItems = [
      {
        itemId: 'check_001',
        itemName: 'アポ数集計完全性',
        minThreshold: 50,
        actualValue: 40, // 境界値50より下、不合格
        isRequired: true,
      },
      {
        itemId: 'check_002',
        itemName: '成約数集計完全性',
        minThreshold: 30,
        actualValue: 20, // 境界値30より下、不合格
        isRequired: true,
      },
      {
        itemId: 'check_003',
        itemName: '金額計算正確性',
        minThreshold: 100,
        actualValue: 100, // 境界値ちょうど、合格条件
        isRequired: true,
      },
    ];

    // Act: レポート内容承認基準判定機能を実行
    const result = validateReportApprovalCriteria({
      reportId: 'report_2024_01',
      checkItems: checkItems,
      approvalThresholdCount: 1, // 最低1項目が合格基準を満たしていれば承認可
    });

    // Assert: 複数チェック項目のうち1項目のみが境界値で合格している場合、
    // 全体の承認判定結果が「承認可」となることを検証
    expect(result.isApprovalPermitted).toBe(true);
    expect(result.passedItemCount).toBe(1);
    expect(result.failedItemCount).toBe(2);
    expect(result.passedItems).toEqual(['check_003']);
    expect(result.failedItems).toEqual(['check_001', 'check_002']);
    expect(result.approvalReason).toBe('最低承認基準を満たしています');
    expect(result.evaluationTimestamp).toBeDefined();
    expect(typeof result.evaluationTimestamp).toBe('string');
  });
});