import { identifyImprovementThemesAndTargetLearners } from '../../src/logic/it-6-2-2-1';

describe('判定ロジック適用履歴が空の場合のエラーハンドリング', () => {
  // SCEN-1079: [error] 改善テーマ・指導対象者の特定 - 判定ロジック適用履歴が空の場合、エラーを返す
  test('判定ロジック適用履歴が空の場合、適切なエラーメッセージを含むエラーレスポンスが返される', () => {
    const input = {
      logicApplicationHistories: [],
      assessorPerformanceData: [
        {
          assessor_id: 'ASS001',
          judgment_accuracy_rate: 0.78,
          deviation_rate: 0.12,
          assessment_time_minutes: 25,
        },
        {
          assessor_id: 'ASS002',
          judgment_accuracy_rate: 0.92,
          deviation_rate: 0.05,
          assessment_time_minutes: 18,
        },
      ],
      baseline_accuracy_rate: 0.85,
      baseline_deviation_rate: 0.08,
      baseline_assessment_time_minutes: 20,
    };

    expect(() => identifyImprovementThemesAndTargetLearners(input)).toThrow(
      /適用履歴/
    );
  });
});