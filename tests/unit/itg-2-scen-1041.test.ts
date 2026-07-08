import { recordAuditTrailForAssessmentValidation } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  test('SCEN-1041: 参照データが存在しない場合でも監査追跡として記録される', () => {
    // 初期化: 参照データベースを空の状態に設定
    const emptyReferenceDataStore: Record<string, unknown> = {};

    // テスト対象: 存在しない参照データIDを指定して検証処理を実行
    const nonExistentRefDataId = 'REF_DATA_ID_999999';
    const userId = 'ASSESSOR_001';
    const operationTimestamp = new Date('2024-01-15T11:00:00Z');
    const operationDescription = '参照データ検証実行';

    const auditRecord1 = recordAuditTrailForAssessmentValidation({
      referenceDataId: nonExistentRefDataId,
      userId: userId,
      operationTimestamp: operationTimestamp,
      operationDescription: operationDescription,
      referenceDataStore: emptyReferenceDataStore,
    });

    // 検証1: 監査追跡レコードが記録されている
    expect(auditRecord1).toBeDefined();
    expect(auditRecord1.auditId).toBeTruthy();

    // 検証2: 記録されたログに参照データ不在の事実が含まれている
    expect(auditRecord1.referenceDataFound).toBe(false);
    expect(auditRecord1.searchStatus).toBe('NOT_FOUND');

    // 検証3: タイムスタンプが正確に記録されている
    expect(auditRecord1.recordedAt).toEqual(operationTimestamp);

    // 検証4: ユーザーIDと操作内容が正確に記録されている
    expect(auditRecord1.userId).toBe(userId);
    expect(auditRecord1.operationDescription).toBe(operationDescription);

    // 検証5: 改ざん防止機能により、ハッシュ値が生成されている
    expect(auditRecord1.integrityHash).toBeTruthy();
    expect(typeof auditRecord1.integrityHash).toBe('string');
    expect(auditRecord1.integrityHash.length).toBeGreaterThan(0);

    // 検証6: デジタル署名が正常に生成されている
    expect(auditRecord1.digitalSignature).toBeDefined();
    expect(auditRecord1.digitalSignature).toBeTruthy();

    // 検証7: 複数回の検証処理を実行 - 第1回目
    const auditRecord2 = recordAuditTrailForAssessmentValidation({
      referenceDataId: nonExistentRefDataId,
      userId: 'ASSESSOR_002',
      operationTimestamp: new Date('2024-01-15T11:05:00Z'),
      operationDescription: '参照データ検証実行',
      referenceDataStore: emptyReferenceDataStore,
    });

    // 検証8: 複数回の検証処理を実行 - 第2回目
    const auditRecord3 = recordAuditTrailForAssessmentValidation({
      referenceDataId: nonExistentRefDataId,
      userId: 'ASSESSOR_003',
      operationTimestamp: new Date('2024-01-15T11:10:00Z'),
      operationDescription: '参照データ検証実行',
      referenceDataStore: emptyReferenceDataStore,
    });

    // 検証9: 各回のログが独立して記録され、auditId が異なることを確認
    expect(auditRecord1.auditId).not.toBe(auditRecord2.auditId);
    expect(auditRecord2.auditId).not.toBe(auditRecord3.auditId);
    expect(auditRecord1.auditId).not.toBe(auditRecord3.auditId);

    // 検証10: 各回のユーザーIDが異なることを確認
    expect(auditRecord1.userId).toBe('ASSESSOR_001');
    expect(auditRecord2.userId).toBe('ASSESSOR_002');
    expect(auditRecord3.userId).toBe('ASSESSOR_003');

    // 検証11: 各回のタイムスタンプが異なることを確認
    expect(auditRecord1.recordedAt.getTime()).toBe(
      new Date('2024-01-15T11:00:00Z').getTime()
    );
    expect(auditRecord2.recordedAt.getTime()).toBe(
      new Date('2024-01-15T11:05:00Z').getTime()
    );
    expect(auditRecord3.recordedAt.getTime()).toBe(
      new Date('2024-01-15T11:10:00Z').getTime()
    );

    // 検証12: 各回のハッシュ値が異なることを確認（改ざん防止が機能している）
    expect(auditRecord1.integrityHash).not.toBe(auditRecord2.integrityHash);
    expect(auditRecord2.integrityHash).not.toBe(auditRecord3.integrityHash);

    // 検証13: 各回のデジタル署名が異なることを確認
    expect(auditRecord1.digitalSignature).not.toBe(
      auditRecord2.digitalSignature
    );
    expect(auditRecord2.digitalSignature).not.toBe(
      auditRecord3.digitalSignature
    );

    // 検証14: 参照データが存在しない場合でも、全レコードで searchStatus が NOT_FOUND であることを確認
    expect(auditRecord1.searchStatus).toBe('NOT_FOUND');
    expect(auditRecord2.searchStatus).toBe('NOT_FOUND');
    expect(auditRecord3.searchStatus).toBe('NOT_FOUND');

    // 検証15: 全レコードで referenceDataFound が false であることを確認
    expect(auditRecord1.referenceDataFound).toBe(false);
    expect(auditRecord2.referenceDataFound).toBe(false);
    expect(auditRecord3.referenceDataFound).toBe(false);

    // 検証16: 記録されたレコードがすべて同じ referenceDataId を参照していることを確認
    expect(auditRecord1.referenceDataId).toBe(nonExistentRefDataId);
    expect(auditRecord2.referenceDataId).toBe(nonExistentRefDataId);
    expect(auditRecord3.referenceDataId).toBe(nonExistentRefDataId);

    // 検証17: 各レコードが改ざん防止機能で保護されていることを確認
    expect(auditRecord1.isProtected).toBe(true);
    expect(auditRecord2.isProtected).toBe(true);
    expect(auditRecord3.isProtected).toBe(true);

    // 検証18: 監査追跡レコードの完全性を確認
    expect(auditRecord1).toHaveProperty('auditId');
    expect(auditRecord1).toHaveProperty('userId');
    expect(auditRecord1).toHaveProperty('operationTimestamp');
    expect(auditRecord1).toHaveProperty('recordedAt');
    expect(auditRecord1).toHaveProperty('operationDescription');
    expect(auditRecord1).toHaveProperty('referenceDataId');
    expect(auditRecord1).toHaveProperty('referenceDataFound');
    expect(auditRecord1).toHaveProperty('searchStatus');
    expect(auditRecord1).toHaveProperty('integrityHash');
    expect(auditRecord1).toHaveProperty('digitalSignature');
    expect(auditRecord1).toHaveProperty('isProtected');
  });
});