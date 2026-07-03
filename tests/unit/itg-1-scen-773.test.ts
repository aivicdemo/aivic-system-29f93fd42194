import { describe, test, expect } from '@jest/globals';
import { identifyApplicableContractDocument } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 契約書・提案資料の自動特定', () => {
  // SCEN-773: [normal] 契約書・提案資料の自動特定・適用機能 - 顧客IDと案件IDから適用可能な最新版資料を正常に特定し、資料名・バージョン・有効期限・変更内容を返す
  test('顧客IDと案件IDから適用可能な最新版資料を正常に特定し、資料名・バージョン・有効期限・変更内容を返す', () => {
    const customerId = 'CUST-001';
    const projectId = 'PROJ-001';
    const today = new Date('2024-06-15');

    const result = identifyApplicableContractDocument({
      customerId,
      projectId,
      asOfDate: today,
    });

    // 期待値: 複数候補がある場合、最新版（バージョン番号が最高）が優先される
    // 有効期限が本日以降の資料のみが対象
    // 資料名、バージョン、有効期限、変更内容を含む

    expect(result).toEqual({
      documentId: 'DOC-CUST001-PROJ001-V003',
      documentName: '提案資料_CUSTプロジェクト',
      version: 3,
      versionString: 'v3.0',
      expiryDate: new Date('2024-12-31'),
      effectiveDate: new Date('2024-06-01'),
      changeLog: '単価見直し（10%割引適用）、納期短縮対応',
      status: 'active',
      documentType: 'proposal',
      applicableCustomerId: 'CUST-001',
      applicableProjectId: 'PROJ-001',
    });

    // 資料名フィールドが正確に返されていることを検証
    expect(result.documentName).toBe('提案資料_CUSTプロジェクト');

    // バージョン番号が最高版であることを検証
    expect(result.version).toBe(3);
    expect(result.versionString).toBe('v3.0');

    // 有効期限が本日以降であることを検証
    expect(result.expiryDate.getTime()).toBeGreaterThanOrEqual(today.getTime());

    // 変更内容フィールドに前バージョンからの更新履歴が記載されていることを検証
    expect(result.changeLog).toContain('単価見直し');
    expect(result.changeLog).toContain('割引');

    // ステータスが有効であることを検証
    expect(result.status).toBe('active');

    // 効果開始日が正確に返されていることを検証
    expect(result.effectiveDate).toEqual(new Date('2024-06-01'));
  });

  test('複数の有効な資料候補がある場合、最新版が最優先で返される', () => {
    const customerId = 'CUST-002';
    const projectId = 'PROJ-002';
    const today = new Date('2024-06-15');

    const result = identifyApplicableContractDocument({
      customerId,
      projectId,
      asOfDate: today,
    });

    // 複数の有効な資料の中から最新版（v2.0）が返されることを検証
    expect(result.version).toBe(2);
    expect(result.versionString).toBe('v2.0');
    expect(result.documentName).toBe('基本契約書_CUST002');
  });

  test('有効期限切れの資料は除外される', () => {
    const customerId = 'CUST-003';
    const projectId = 'PROJ-003';
    const today = new Date('2024-06-15');

    const result = identifyApplicableContractDocument({
      customerId,
      projectId,
      asOfDate: today,
    });

    // 有効期限が本日以降であることを検証
    expect(result.expiryDate.getTime()).toBeGreaterThanOrEqual(today.getTime());

    // 無効期限切れ資料は返却されないことを検証（v1.0は期限切れ、v2.0が返される）
    expect(result.version).toBe(2);
  });

  test('適用可能な資料が存在しない場合、エラーを発生させる', () => {
    const customerId = 'CUST-999';
    const projectId = 'PROJ-999';
    const today = new Date('2024-06-15');

    expect(() =>
      identifyApplicableContractDocument({
        customerId,
        projectId,
        asOfDate: today,
      })
    ).toThrow(/資料/);
  });

  test('変更内容フィールドに前バージョンからの更新履歴が正確に記載されている', () => {
    const customerId = 'CUST-001';
    const projectId = 'PROJ-001';
    const today = new Date('2024-06-15');

    const result = identifyApplicableContractDocument({
      customerId,
      projectId,
      asOfDate: today,
    });

    // 変更内容フィールドが空文字列ではなく、実際の更新内容を含んでいることを検証
    expect(result.changeLog).toBeTruthy();
    expect(result.changeLog.length).toBeGreaterThan(0);
    expect(typeof result.changeLog).toBe('string');
  });

  test('JSON形式で完全な情報が返却される', () => {
    const customerId = 'CUST-001';
    const projectId = 'PROJ-001';
    const today = new Date('2024-06-15');

    const result = identifyApplicableContractDocument({
      customerId,
      projectId,
      asOfDate: today,
    });

    // 必須フィールドがすべて存在することを検証
    expect(result).toHaveProperty('documentId');
    expect(result).toHaveProperty('documentName');
    expect(result).toHaveProperty('version');
    expect(result).toHaveProperty('versionString');
    expect(result).toHaveProperty('expiryDate');
    expect(result).toHaveProperty('effectiveDate');
    expect(result).toHaveProperty('changeLog');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('documentType');
    expect(result).toHaveProperty('applicableCustomerId');
    expect(result).toHaveProperty('applicableProjectId');

    // 各フィールドの型が正確であることを検証
    expect(typeof result.documentId).toBe('string');
    expect(typeof result.documentName).toBe('string');
    expect(typeof result.version).toBe('number');
    expect(typeof result.versionString).toBe('string');
    expect(result.expiryDate instanceof Date).toBe(true);
    expect(result.effectiveDate instanceof Date).toBe(true);
    expect(typeof result.changeLog).toBe('string');
    expect(typeof result.status).toBe('string');
    expect(typeof result.documentType).toBe('string');
    expect(typeof result.applicableCustomerId).toBe('string');
    expect(typeof result.applicableProjectId).toBe('string');
  });
});