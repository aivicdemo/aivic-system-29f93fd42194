import { notifyModelUpdateToAssessors } from '../../src/logic/it-6-2-2-2';

describe('改善モデル運用開始通知ダッシュボード', () => {
  test('SCEN-1509: 改善されたモデルの運用開始を全査定員に統一フォーマットで周知', () => {
    // Arrange
    const input = {
      modelVersion: 'v2.1.0',
      improvementSummary: 'OCR精度向上（+3.2%）、判定ロジック改善',
      changeDetails: [
        { item: 'OCRモデル', change: '物価本更新対応、季節変動補正係数追加' },
        { item: 'AI判定ロジック', change: '乖離率判定閾値を±15%から±12%に厳格化' },
      ],
      applicationDatetime: new Date('2024-04-01T00:00:00Z'),
      applicationScope: {
        targetBranches: ['全支店'],
        targetCategories: ['工事種別：全て', '金額帯：全て'],
        excludedAssessors: [],
      },
      targetRecipients: 'all_assessors',
      notificationFormat: 'unified_standard',
    };

    // Act
    const result = notifyModelUpdateToAssessors(input);

    // Assert - 戻り値の構造
    expect(result).toEqual(
      expect.objectContaining({
        notificationId: expect.any(String),
        status: 'sent',
        recipientCount: 30,
        format: 'unified_standard',
        sentDatetime: expect.any(Date),
      })
    );

    // Assert - 通知ID形式（タイムスタンプ + ハッシュ）
    expect(result.notificationId).toMatch(/^NOTIFY_\d{14}_[A-F0-9]{8}$/);

    // Assert - 送信状態が success
    expect(result.status).toBe('sent');

    // Assert - 初期30名全員に送信
    expect(result.recipientCount).toBe(30);

    // Assert - 統一フォーマット適用
    expect(result.format).toBe('unified_standard');

    // Assert - 送信日時が現在より前または同時（過去・現在のみ）
    const now = new Date();
    expect(result.sentDatetime.getTime()).toBeLessThanOrEqual(now.getTime() + 1000); // 1秒のマージン

    // Assert - 通知コンテンツの検証
    expect(result.content).toEqual(
      expect.objectContaining({
        title: expect.stringContaining('改善モデル運用開始通知'),
        modelVersion: 'v2.1.0',
        improvementSummary: 'OCR精度向上（+3.2%）、判定ロジック改善',
      })
    );

    // Assert - 変更点が記載されている
    expect(result.content.changeDetails).toHaveLength(2);
    expect(result.content.changeDetails[0]).toEqual({
      item: 'OCRモデル',
      change: '物価本更新対応、季節変動補正係数追加',
    });
    expect(result.content.changeDetails[1]).toEqual({
      item: 'AI判定ロジック',
      change: '乖離率判定閾値を±15%から±12%に厳格化',
    });

    // Assert - 適用日時が正確に記載
    expect(result.content.applicationDatetime).toEqual(new Date('2024-04-01T00:00:00Z'));

    // Assert - 適用範囲が明確に記載
    expect(result.content.applicationScope).toEqual({
      targetBranches: ['全支店'],
      targetCategories: ['工事種別：全て', '金額帯：全て'],
      description: '全支店、全工事種別、全金額帯に適用',
    });

    // Assert - 全査定員が同一フォーマットで受信
    expect(result.deliveryStatus).toEqual(
      expect.objectContaining({
        totalAssessors: 30,
        successfulDeliveries: 30,
        failedDeliveries: 0,
        deliveryRate: 1.0,
      })
    );

    // Assert - 全員の配信成功率が100%
    expect(result.deliveryStatus.deliveryRate).toBe(1.0);

    // Assert - 配信失敗がない
    expect(result.deliveryStatus.failedDeliveries).toBe(0);

    // Assert - 受信者ごとのフォーマット統一性を確認
    expect(result.recipientFormatValidation).toEqual({
      allRecipientsReceiveUnifiedFormat: true,
      formatConsistencyScore: 1.0,
      mismatchCount: 0,
    });

    // Assert - フォーマット一貫性スコアが100%
    expect(result.recipientFormatValidation.formatConsistencyScore).toBe(1.0);

    // Assert - フォーマット不一致がない
    expect(result.recipientFormatValidation.mismatchCount).toBe(0);

    // Assert - 適用日時と適用範囲が明確
    expect(result.clarityValidation).toEqual({
      applicationDatetimeClear: true,
      applicationScopeClear: true,
      improvementDetailsClear: true,
      changePointsClear: true,
    });

    // Assert - すべての必須情報が明確に記載
    expect(result.clarityValidation.applicationDatetimeClear).toBe(true);
    expect(result.clarityValidation.applicationScopeClear).toBe(true);
    expect(result.clarityValidation.improvementDetailsClear).toBe(true);
    expect(result.clarityValidation.changePointsClear).toBe(true);

    // Assert - プレビュー内容が検証可能
    expect(result.previewContent).toEqual(
      expect.objectContaining({
        htmlPreview: expect.stringContaining('改善モデル運用開始通知'),
        plainTextPreview: expect.stringContaining('2024-04-01'),
        renderingStatus: 'valid',
      })
    );

    // Assert - プレビューのレンダリングが有効
    expect(result.previewContent.renderingStatus).toBe('valid');

    // Assert - 監査ログに記録される
    expect(result.auditTrail).toEqual(
      expect.objectContaining({
        operatorId: expect.any(String),
        operationDatetime: expect.any(Date),
        operation: 'notify_model_update',
        targetGroup: 'all_assessors',
      })
    );

    // Assert - 監査ログのオペレーション種別
    expect(result.auditTrail.operation).toBe('notify_model_update');

    // Assert - 全体的なステータスが完了
    expect(result.completionStatus).toEqual({
      isComplete: true,
      allChecklistItemsCompleted: true,
      readinessForDeployment: true,
    });

    // Assert - デプロイ準備完了
    expect(result.completionStatus.readinessForDeployment).toBe(true);
  });
});