import { recordManualRevisionHistory, trackPrecisionIndicatorChange } from '../../src/logic/it-6-2-2-1';

describe('IT-6-2-2-1: マニュアル改版精度追跡機能', () => {
  test('SCEN-1586: [normal] マニュアル改版精度追跡機能 - 改版履歴と精度指標変化を追跡', () => {
    // 前提: 査定部署でマニュアルが複数回改版され、改版前後の精度指標が測定されている状態

    // ■ ステップ1: 既存のマニュアルバージョンを確認
    const baselineRevision = {
      revisionId: 'MAN-REV-001',
      versionNumber: 1,
      updatedAt: new Date('2024-01-01T09:00:00Z'),
      updatedBy: 'user_admin_001',
      updateContent: '初期版: OCR精度基準、判定ロジック、データ更新手順を定義',
      baselineOCRAccuracy: 92.5,
      baselineJudgmentAccuracy: 88.3,
      baselineProcessingTime: 18.5,
    };

    // ■ ステップ2-3: マニュアルを更新し、改版を実行
    const revisionRecord1 = recordManualRevisionHistory({
      revisionId: 'MAN-REV-002',
      versionNumber: 2,
      updatedAt: new Date('2024-02-15T14:30:00Z'),
      updatedBy: 'user_manager_001',
      updateContent: '改版内容: OCR精度基準を90%→92%に引き上げ、異常対応フロー追加',
      ocrAccuracyAfterRevision: 93.2,
      judgmentAccuracyAfterRevision: 89.7,
      processingTimeAfterRevision: 17.8,
    });

    // ■ ステップ4-7: 改版履歴画面で更新日時・内容・更新者が記録されていることを確認
    expect(revisionRecord1).toEqual({
      revisionId: 'MAN-REV-002',
      versionNumber: 2,
      updatedAt: new Date('2024-02-15T14:30:00Z'),
      updatedBy: 'user_manager_001',
      updateContent: '改版内容: OCR精度基準を90%→92%に引き上げ、異常対応フロー追加',
      ocrAccuracyAfterRevision: 93.2,
      judgmentAccuracyAfterRevision: 89.7,
      processingTimeAfterRevision: 17.8,
    });

    // ■ ステップ8-10: 改版前後の精度指標差分を計算し、変化が追跡されていることを確認
    const precisionChange1 = trackPrecisionIndicatorChange({
      baselineRevision,
      currentRevision: revisionRecord1,
    });

    // 改版前後の精度指標の差分値を検証
    // OCR精度: 92.5% → 93.2% = +0.7%
    // 判定精度: 88.3% → 89.7% = +1.4%
    // 処理時間: 18.5分 → 17.8分 = -0.7分（短縮）
    expect(precisionChange1.ocrAccuracyDelta).toBe(0.7);
    expect(precisionChange1.judgmentAccuracyDelta).toBe(1.4);
    expect(precisionChange1.processingTimeDelta).toBe(-0.7);
    expect(precisionChange1.revisionImpactLevel).toBe('positive');

    // ■ ステップ11: 精度指標変化のレポート/グラフが正しく表示されることを確認
    expect(precisionChange1.changeReport).toEqual({
      revisionId: 'MAN-REV-002',
      versionNumber: 2,
      updatedAt: new Date('2024-02-15T14:30:00Z'),
      baselineOCRAccuracy: 92.5,
      currentOCRAccuracy: 93.2,
      ocrAccuracyDelta: 0.7,
      baselineJudgmentAccuracy: 88.3,
      currentJudgmentAccuracy: 89.7,
      judgmentAccuracyDelta: 1.4,
      baselineProcessingTime: 18.5,
      currentProcessingTime: 17.8,
      processingTimeDelta: -0.7,
      revisionImpactLevel: 'positive',
    });

    // ■ 複数改版シナリオ: 2番目の改版を追加
    const revisionRecord2 = recordManualRevisionHistory({
      revisionId: 'MAN-REV-003',
      versionNumber: 3,
      updatedAt: new Date('2024-03-20T11:15:00Z'),
      updatedBy: 'user_lead_001',
      updateContent: '改版内容: 学習データ更新手順の詳細化、季節変動対応ガイド追加',
      ocrAccuracyAfterRevision: 94.1,
      judgmentAccuracyAfterRevision: 90.5,
      processingTimeAfterRevision: 17.2,
    });

    // 2番目の改版の差分を計算
    const precisionChange2 = trackPrecisionIndicatorChange({
      baselineRevision: revisionRecord1,
      currentRevision: revisionRecord2,
    });

    // 改版前後の精度指標の差分値を検証
    // OCR精度: 93.2% → 94.1% = +0.9%
    // 判定精度: 89.7% → 90.5% = +0.8%
    // 処理時間: 17.8分 → 17.2分 = -0.6分（短縮）
    expect(precisionChange2.ocrAccuracyDelta).toBe(0.9);
    expect(precisionChange2.judgmentAccuracyDelta).toBe(0.8);
    expect(precisionChange2.processingTimeDelta).toBe(-0.6);
    expect(precisionChange2.revisionImpactLevel).toBe('positive');

    // ■ ステップ12: 複数改版が時系列順に並んでいることを確認
    const revisionTimeline = [revisionRecord1, revisionRecord2];

    // 時系列順序チェック
    expect(revisionTimeline[0].updatedAt).toEqual(new Date('2024-02-15T14:30:00Z'));
    expect(revisionTimeline[1].updatedAt).toEqual(new Date('2024-03-20T11:15:00Z'));
    expect(revisionTimeline[0].versionNumber).toBe(2);
    expect(revisionTimeline[1].versionNumber).toBe(3);

    // タイムスタンプが昇順であることを確認
    const isChronological =
      revisionTimeline[0].updatedAt < revisionTimeline[1].updatedAt;
    expect(isChronological).toBe(true);

    // 改版履歴全体の累積精度変化を検証
    // 初期版(v1): OCR 92.5%, 判定 88.3%
    // 改版v2: OCR 93.2%, 判定 89.7%
    // 改版v3: OCR 94.1%, 判定 90.5%
    // 累積改善: OCR +1.6%, 判定 +2.2%
    const cumulativePrecisionChange = trackPrecisionIndicatorChange({
      baselineRevision,
      currentRevision: revisionRecord2,
    });

    expect(cumulativePrecisionChange.ocrAccuracyDelta).toBe(1.6);
    expect(cumulativePrecisionChange.judgmentAccuracyDelta).toBe(2.2);
    expect(cumulativePrecisionChange.processingTimeDelta).toBe(-1.3);
    expect(cumulativePrecisionChange.revisionImpactLevel).toBe('positive');

    // 改版記録の完全性チェック: 各改版に必須フィールドが存在することを確認
    expect(revisionRecord1).toHaveProperty('revisionId');
    expect(revisionRecord1).toHaveProperty('versionNumber');
    expect(revisionRecord1).toHaveProperty('updatedAt');
    expect(revisionRecord1).toHaveProperty('updatedBy');
    expect(revisionRecord1).toHaveProperty('updateContent');
    expect(revisionRecord1).toHaveProperty('ocrAccuracyAfterRevision');
    expect(revisionRecord1).toHaveProperty('judgmentAccuracyAfterRevision');
    expect(revisionRecord1).toHaveProperty('processingTimeAfterRevision');

    expect(revisionRecord2).toHaveProperty('revisionId');
    expect(revisionRecord2).toHaveProperty('versionNumber');
    expect(revisionRecord2).toHaveProperty('updatedAt');
    expect(revisionRecord2).toHaveProperty('updatedBy');
    expect(revisionRecord2).toHaveProperty('updateContent');
    expect(revisionRecord2).toHaveProperty('ocrAccuracyAfterRevision');
    expect(revisionRecord2).toHaveProperty('judgmentAccuracyAfterRevision');
    expect(revisionRecord2).toHaveProperty('processingTimeAfterRevision');

    // 更新者(updatedBy)フィールドが正確に記録されていることを確認
    expect(revisionRecord1.updatedBy).toBe('user_manager_001');
    expect(revisionRecord2.updatedBy).toBe('user_lead_001');

    // 更新内容(updateContent)が詳細に記録されていることを確認
    expect(revisionRecord1.updateContent).toContain('OCR精度基準');
    expect(revisionRecord1.updateContent).toContain('異常対応フロー');
    expect(revisionRecord2.updateContent).toContain('学習データ更新手順');
    expect(revisionRecord2.updateContent).toContain('季節変動対応');

    // 改版日時が正確に記録されていることを確認（ISO形式での整合性）
    expect(revisionRecord1.updatedAt.toISOString()).toBe('2024-02-15T14:30:00.000Z');
    expect(revisionRecord2.updatedAt.toISOString()).toBe('2024-03-20T11:15:00.000Z');

    // 精度指標の型と値域チェック
    expect(typeof precisionChange1.ocrAccuracyDelta).toBe('number');
    expect(typeof precisionChange1.judgmentAccuracyDelta).toBe('number');
    expect(typeof precisionChange1.processingTimeDelta).toBe('number');
    expect(precisionChange1.ocrAccuracyDelta).toBeGreaterThan(-100);
    expect(precisionChange1.ocrAccuracyDelta).toBeLessThan(100);
    expect(precisionChange1.judgmentAccuracyDelta).toBeGreaterThan(-100);
    expect(precisionChange1.judgmentAccuracyDelta).toBeLessThan(100);
  });
});