import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  detectExceptionCases,
  registerImprovementPoints,
  saveDocumentWithImprovements,
  retrieveDocumentWithHistory,
  validateExceptionCaseMapping,
} from '../../src/logic/it-1781935279444-2-2-1';

describe('ドキュメント改善管理機能 - 例外ケースと改善点の反映', () => {
  // SCEN-1119
  test('発見された例外ケースと改善点が正しくドキュメントに反映される', () => {
    // Arrange: テストデータ準備
    const documentId = 'doc-2024-01-15-001';
    const sampleDocument = {
      id: documentId,
      title: '請求ロジック・割引基準の明文化と運用マニュアル',
      content:
        '基本料金は顧客ごとに設定される。成果報酬は契約書に基づき計算。割引は最大30%まで適用可能。',
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-10T09:00:00Z',
      version: 1,
    };

    const exceptionCasesDetected = [
      {
        id: 'exc-001',
        location: '請求額計算ロジック',
        content: '負の金額が計算結果に現れる場合の処理が未定義',
        severity: 'high',
        detectedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 'exc-002',
        location: '顧客マスタ検証',
        content: '無効な顧客IDに対する請求を試みた場合の対応',
        severity: 'high',
        detectedAt: '2024-01-15T10:05:00Z',
      },
      {
        id: 'exc-003',
        location: '請求集計処理',
        content: '同一顧客への重複請求が発生した場合の検出と防止',
        severity: 'medium',
        detectedAt: '2024-01-15T10:10:00Z',
      },
    ];

    const improvementPointsInput = [
      {
        exceptionCaseId: 'exc-001',
        improvement:
          '負の金額が計算される場合は、最小請求額（ゼロ円）を設定し、計算結果が負にならないよう制御する。',
        actionItems: [
          '計算ロジックに最小値チェックを追加',
          '異常値検出時にアラート発行',
        ],
      },
      {
        exceptionCaseId: 'exc-002',
        improvement:
          '顧客ID入力時に顧客マスタとの照合を必須にし、無効なIDの場合は入力エラーを表示して処理を中断する。',
        actionItems: [
          '顧客マスタ照合ロジックの追加',
          'エラーメッセージの統一',
        ],
      },
      {
        exceptionCaseId: 'exc-003',
        improvement:
          '月次請求集計時に顧客ごとの請求実績を確認し、既に請求済みのデータは除外する。重複検出時は警告ログを出力する。',
        actionItems: [
          '重複排除ロジックの実装',
          'チェック用SQLクエリの作成',
        ],
      },
    ];

    // Act: 例外ケースを検出
    const detectedResult = detectExceptionCases({
      documentId,
      document: sampleDocument,
    });

    expect(detectedResult.success).toBe(true);
    expect(detectedResult.exceptionCasesFound).toBe(3);
    expect(detectedResult.exceptionCases).toHaveLength(3);
    expect(detectedResult.exceptionCases[0]).toEqual(
      expect.objectContaining({
        id: 'exc-001',
        location: '請求額計算ロジック',
        severity: 'high',
      })
    );
    expect(detectedResult.exceptionCases[1]).toEqual(
      expect.objectContaining({
        id: 'exc-002',
        location: '顧客マスタ検証',
        severity: 'high',
      })
    );
    expect(detectedResult.exceptionCases[2]).toEqual(
      expect.objectContaining({
        id: 'exc-003',
        location: '請求集計処理',
        severity: 'medium',
      })
    );

    // Act: 改善点を登録
    const improvementResult = registerImprovementPoints({
      documentId,
      improvementPoints: improvementPointsInput,
    });

    expect(improvementResult.success).toBe(true);
    expect(improvementResult.improvementPointsRegistered).toBe(3);
    expect(improvementResult.improvementPoints).toHaveLength(3);
    expect(improvementResult.improvementPoints[0]).toEqual(
      expect.objectContaining({
        exceptionCaseId: 'exc-001',
        improvement: expect.stringContaining('最小請求額'),
      })
    );
    expect(improvementResult.improvementPoints[1]).toEqual(
      expect.objectContaining({
        exceptionCaseId: 'exc-002',
        improvement: expect.stringContaining('顧客マスタ照合'),
      })
    );
    expect(improvementResult.improvementPoints[2]).toEqual(
      expect.objectContaining({
        exceptionCaseId: 'exc-003',
        improvement: expect.stringContaining('重複排除'),
      })
    );

    // Act: ドキュメントを改善点を含めて保存
    const saveResult = saveDocumentWithImprovements({
      documentId,
      exceptionCases: detectedResult.exceptionCases,
      improvementPoints: improvementResult.improvementPoints,
      previousVersion: sampleDocument.version,
    });

    expect(saveResult.success).toBe(true);
    expect(saveResult.documentId).toBe(documentId);
    expect(saveResult.newVersion).toBe(2);
    expect(saveResult.updatedAt).toBeDefined();
    expect(new Date(saveResult.updatedAt).toISOString()).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
    expect(saveResult.exceptionCasesEmbedded).toBe(3);
    expect(saveResult.improvementPointsEmbedded).toBe(3);

    // Act: 保存されたドキュメントを再度開く
    const retrieveResult = retrieveDocumentWithHistory({
      documentId,
      version: 2,
    });

    expect(retrieveResult.success).toBe(true);
    expect(retrieveResult.document.id).toBe(documentId);
    expect(retrieveResult.document.version).toBe(2);
    expect(retrieveResult.document.exceptionCases).toHaveLength(3);
    expect(retrieveResult.document.improvementPoints).toHaveLength(3);

    // Assert: 例外ケースの詳細情報がドキュメントに正確に反映されているか検証
    const documentExceptionCases = retrieveResult.document.exceptionCases;
    expect(documentExceptionCases[0]).toEqual(
      expect.objectContaining({
        id: 'exc-001',
        location: '請求額計算ロジック',
        content: '負の金額が計算結果に現れる場合の処理が未定義',
        severity: 'high',
      })
    );
    expect(documentExceptionCases[1]).toEqual(
      expect.objectContaining({
        id: 'exc-002',
        location: '顧客マスタ検証',
        content: '無効な顧客IDに対する請求を試みた場合の対応',
        severity: 'high',
      })
    );
    expect(documentExceptionCases[2]).toEqual(
      expect.objectContaining({
        id: 'exc-003',
        location: '請求集計処理',
        content: '同一顧客への重複請求が発生した場合の検出と防止',
        severity: 'medium',
      })
    );

    // Assert: 改善点が対応する例外ケースに紐付けられて正しく記載されているか検証
    const documentImprovementPoints =
      retrieveResult.document.improvementPoints;
    expect(documentImprovementPoints[0]).toEqual(
      expect.objectContaining({
        exceptionCaseId: 'exc-001',
        improvement: expect.stringContaining('最小請求額'),
        actionItems: expect.arrayContaining([
          '計算ロジックに最小値チェックを追加',
          '異常値検出時にアラート発行',
        ]),
      })
    );
    expect(documentImprovementPoints[1]).toEqual(
      expect.objectContaining({
        exceptionCaseId: 'exc-002',
        improvement: expect.stringContaining('顧客マスタ照合'),
        actionItems: expect.arrayContaining([
          '顧客マスタ照合ロジックの追加',
          'エラーメッセージの統一',
        ]),
      })
    );
    expect(documentImprovementPoints[2]).toEqual(
      expect.objectContaining({
        exceptionCaseId: 'exc-003',
        improvement: expect.stringContaining('重複排除'),
        actionItems: expect.arrayContaining([
          '重複排除ロジックの実装',
          'チェック用SQLクエリの作成',
        ]),
      })
    );

    // Assert: 例外ケースと改善点のマッピング検証
    const mappingValidation = validateExceptionCaseMapping({
      exceptionCases: documentExceptionCases,
      improvementPoints: documentImprovementPoints,
    });

    expect(mappingValidation.isValid).toBe(true);
    expect(mappingValidation.totalExceptionCases).toBe(3);
    expect(mappingValidation.totalMappedImprovements).toBe(3);
    expect(mappingValidation.unmappedExceptionCases).toBe(0);
    expect(mappingValidation.mappingStatus).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          exceptionCaseId: 'exc-001',
          isMapped: true,
        }),
        expect.objectContaining({
          exceptionCaseId: 'exc-002',
          isMapped: true,
        }),
        expect.objectContaining({
          exceptionCaseId: 'exc-003',
          isMapped: true,
        }),
      ])
    );

    // Assert: ドキュメントの更新日時とバージョン情報が正常に更新されているか確認
    expect(retrieveResult.document.version).toBe(2);
    expect(retrieveResult.document.version).toBeGreaterThan(
      sampleDocument.version
    );
    expect(retrieveResult.document.updatedAt).toBeDefined();
    expect(new Date(retrieveResult.document.updatedAt).getTime()).toBeGreaterThan(
      new Date(sampleDocument.updatedAt).getTime()
    );

    // Assert: ドキュメント履歴が正常に記録されているか確認
    expect(retrieveResult.history).toBeDefined();
    expect(retrieveResult.history).toHaveLength(2);
    expect(retrieveResult.history[0].version).toBe(1);
    expect(retrieveResult.history[1].version).toBe(2);
    expect(retrieveResult.history[1].changeType).toBe('exception_improvement');
    expect(retrieveResult.history[1].changedAt).toBeDefined();
  });
});