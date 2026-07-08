import { diagnoseLearnDataBias } from '../../src/logic/it-6-2-1-1';

describe('学習データ偏り診断機能 - ゼロ件データセット対応', () => {
  test('SCEN-1466: 学習データがゼロ件の場合、適切なエラーハンドリングと診断結果を返す', () => {
    // Arrange: 学習データ偏り診断機能を初期化し、空のデータセットを設定
    const emptyDataset = {
      items: [],
      totalCount: 0,
    };

    // Act: 診断処理を実行
    const diagnosisResult = diagnoseLearnDataBias(emptyDataset);

    // Assert: 診断結果のステータスを検証（正常系コード 200 または クライアントエラーコード 400）
    expect(
      diagnosisResult.statusCode === 200 || diagnosisResult.statusCode === 400
    ).toBe(true);

    // Assert: 診断結果がJSONフォーマットで正常にパース可能であることを検証
    expect(typeof diagnosisResult).toBe('object');
    expect(diagnosisResult).not.toBeNull();

    // Assert: 必須フィールド（ステータス、メッセージ、診断日時）が全て揃っていることを検証
    expect(diagnosisResult).toHaveProperty('statusCode');
    expect(diagnosisResult).toHaveProperty('message');
    expect(diagnosisResult).toHaveProperty('diagnosisDateTime');

    // Assert: エラーメッセージが適切であることを検証
    expect(diagnosisResult.message).toMatch(
      /診断対象の学習データが存在しません|学習データの件数がゼロです/
    );

    // Assert: 診断日時が ISO 8601 形式の文字列であることを検証
    expect(typeof diagnosisResult.diagnosisDateTime).toBe('string');
    expect(diagnosisResult.diagnosisDateTime).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // Assert: 診断結果に診断対象データセットのサマリーが含まれていることを検証
    expect(diagnosisResult).toHaveProperty('datasetSummary');
    expect(diagnosisResult.datasetSummary).toHaveProperty('totalItems');
    expect(diagnosisResult.datasetSummary.totalItems).toBe(0);

    // Assert: ビジネスルールに基づき、データ件数ゼロ時の診断ステータスを検証
    expect(diagnosisResult).toHaveProperty('diagnosisStatus');
    expect(['DATA_NOT_AVAILABLE', 'NO_DATA', 'INSUFFICIENT_DATA']).toContain(
      diagnosisResult.diagnosisStatus
    );
  });
});