import { defineModelRetrainingExecutionCriteria } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1540: [edge] モデル再学習実行判定基準の定義 - 過去案件データに季節変動が反映されていない場合、再学習の実行判定が正しく行われる
  test('should correctly identify retraining requirement when seasonal variation is missing from past project data', () => {
    // Arrange: 季節変動が反映されていない過去案件データセット
    const pastProjectDataset = [
      {
        projectId: 'proj_001',
        workType: '鉄骨工事',
        quotedAmount: 5000000,
        season: 'winter',
        region: '東京',
        recordDate: '2024-01-15'
      },
      {
        projectId: 'proj_002',
        workType: '鉄骨工事',
        quotedAmount: 5100000,
        season: 'winter',
        region: '東京',
        recordDate: '2024-02-20'
      },
      {
        projectId: 'proj_003',
        workType: '鉄骨工事',
        quotedAmount: 5050000,
        season: 'winter',
        region: '東京',
        recordDate: '2024-03-10'
      },
      {
        projectId: 'proj_004',
        workType: '鉄骨工事',
        quotedAmount: 4950000,
        season: 'winter',
        region: '東京',
        recordDate: '2024-04-05'
      }
    ];

    const requiredSeasonCount = 4; // 春夏秋冬の4季節が必要
    const minimumSamplesPerSeason = 3;

    // Act: モデル再学習実行判定基準の定義モジュールを初期化・実行
    const retrainingJudgment = defineModelRetrainingExecutionCriteria({
      pastProjectDataset,
      requiredSeasonCount,
      minimumSamplesPerSeason
    });

    // Assert: 季節変動検出ロジックが正しく『季節変動なし』を識別
    expect(retrainingJudgment.hasSeasonalVariation).toBe(false);

    // Assert: 再学習実行フラグが『true（実行必要）』に設定
    expect(retrainingJudgment.requiresRetraining).toBe(true);

    // Assert: 再学習推奨理由が『季節変動パターンの不足』として正しく記録
    expect(retrainingJudgment.retrainingReason).toBe('季節変動パターンの不足');

    // Assert: 検出された季節数が正しく記録されている
    expect(retrainingJudgment.detectedSeasonCount).toBe(1);

    // Assert: 欠落している季節が正しく識別されている
    expect(retrainingJudgment.missingSeasons).toEqual(['spring', 'summer', 'autumn']);

    // Assert: 再学習の優先度が高く設定されている
    expect(retrainingJudgment.retrainingPriority).toBe('high');

    // Assert: 推奨される追加学習データ件数が正しく計算されている
    expect(retrainingJudgment.recommendedAdditionalDataCount).toBe(9); // (4 - 1) * 3 = 9
  });
});