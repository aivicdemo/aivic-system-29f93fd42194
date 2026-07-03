import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validatePortalReportVisibility } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-674: [edge] 顧客別ポータル表示制御機能 - 契約IDが未割り当ての営業責任者にはレポートが表示されない
  test('SCEN-674: 契約IDが未割り当ての営業責任者にはレポートが表示されない', () => {
    // 前提: 営業責任者がポータルにログインしており、契約IDが未割り当ての状態
    const unassignedExecutiveUserId = 'user_12345';
    const contractIds = null; // 契約IDが未割り当て
    const portalAccessTimestamp = new Date('2024-01-15T10:00:00Z');
    const cacheKey = `portal_report_${unassignedExecutiveUserId}`;
    const isSharedBrowserSession = false;
    const usePrivateMode = false;

    // 契約IDが未割り当てのユーザーがポータルにアクセスした場合、レポートが表示されない
    const result = validatePortalReportVisibility({
      executiveUserId: unassignedExecutiveUserId,
      assignedContractIds: contractIds,
      accessTimestamp: portalAccessTimestamp,
      useCache: true,
      cacheKey: cacheKey,
      isSharedBrowser: isSharedBrowserSession,
      usePrivateMode: usePrivateMode,
    });

    // 期待結果: レポート表示が不許可
    expect(result.isReportVisible).toBe(false);
    expect(result.reportDisplayStatus).toBe('hidden');
    expect(result.contractsAvailableForDisplay).toEqual([]);
    expect(result.displayMode).toBe('empty');
    expect(result.consoleErrorOccurred).toBe(false);
    expect(result.pageLoadSuccessful).toBe(true);

    // キャッシュをクリアして再度アクセスした場合も同じ結果となること
    const resultAfterCacheClear = validatePortalReportVisibility({
      executiveUserId: unassignedExecutiveUserId,
      assignedContractIds: contractIds,
      accessTimestamp: new Date('2024-01-15T10:05:00Z'),
      useCache: false,
      cacheKey: cacheKey,
      isSharedBrowser: isSharedBrowserSession,
      usePrivateMode: usePrivateMode,
    });

    expect(resultAfterCacheClear.isReportVisible).toBe(false);
    expect(resultAfterCacheClear.reportDisplayStatus).toBe('hidden');
    expect(resultAfterCacheClear.consoleErrorOccurred).toBe(false);
    expect(resultAfterCacheClear.pageLoadSuccessful).toBe(true);

    // シークレットモードでアクセスした場合も同じ結果となること
    const resultPrivateMode = validatePortalReportVisibility({
      executiveUserId: unassignedExecutiveUserId,
      assignedContractIds: contractIds,
      accessTimestamp: new Date('2024-01-15T10:10:00Z'),
      useCache: false,
      cacheKey: cacheKey,
      isSharedBrowser: isSharedBrowserSession,
      usePrivateMode: true,
    });

    expect(resultPrivateMode.isReportVisible).toBe(false);
    expect(resultPrivateMode.reportDisplayStatus).toBe('hidden');
    expect(resultPrivateMode.consoleErrorOccurred).toBe(false);
    expect(resultPrivateMode.pageLoadSuccessful).toBe(true);
    expect(resultPrivateMode.displayMode).toBe('empty');

    // 複数のアクセス方法でも一貫性が保たれることを確認
    expect(result.reportDisplayStatus).toEqual(resultAfterCacheClear.reportDisplayStatus);
    expect(result.reportDisplayStatus).toEqual(resultPrivateMode.reportDisplayStatus);
    expect(result.pageLoadSuccessful).toEqual(resultAfterCacheClear.pageLoadSuccessful);
    expect(result.pageLoadSuccessful).toEqual(resultPrivateMode.pageLoadSuccessful);
  });

  test('SCEN-674: 契約IDが割り当てられた営業責任者にはレポートが表示される', () => {
    // 前提: 営業責任者がポータルにログインしており、契約IDが割り当てられている状態
    const assignedExecutiveUserId = 'user_67890';
    const contractIds = ['contract_001', 'contract_002'];
    const portalAccessTimestamp = new Date('2024-01-15T11:00:00Z');
    const cacheKey = `portal_report_${assignedExecutiveUserId}`;
    const isSharedBrowserSession = false;
    const usePrivateMode = false;

    // 契約IDが割り当てられたユーザーがポータルにアクセスした場合、レポートが表示される
    const result = validatePortalReportVisibility({
      executiveUserId: assignedExecutiveUserId,
      assignedContractIds: contractIds,
      accessTimestamp: portalAccessTimestamp,
      useCache: true,
      cacheKey: cacheKey,
      isSharedBrowser: isSharedBrowserSession,
      usePrivateMode: usePrivateMode,
    });

    // 期待結果: レポート表示が許可
    expect(result.isReportVisible).toBe(true);
    expect(result.reportDisplayStatus).toBe('visible');
    expect(result.contractsAvailableForDisplay).toEqual(contractIds);
    expect(result.displayMode).toBe('full');
    expect(result.consoleErrorOccurred).toBe(false);
    expect(result.pageLoadSuccessful).toBe(true);
    expect(result.contractsAvailableForDisplay.length).toBe(2);
  });

  test('SCEN-674: 無効な入力でエラーが発生する', () => {
    // 前提: 無効なユーザーIDが指定された場合
    const invalidExecutiveUserId = '';
    const contractIds = ['contract_001'];
    const portalAccessTimestamp = new Date('2024-01-15T12:00:00Z');
    const cacheKey = `portal_report_`;
    const isSharedBrowserSession = false;
    const usePrivateMode = false;

    // 無効な入力でエラーが発生する
    expect(() =>
      validatePortalReportVisibility({
        executiveUserId: invalidExecutiveUserId,
        assignedContractIds: contractIds,
        accessTimestamp: portalAccessTimestamp,
        useCache: true,
        cacheKey: cacheKey,
        isSharedBrowser: isSharedBrowserSession,
        usePrivateMode: usePrivateMode,
      })
    ).toThrow(/ユーザーID/);
  });

  test('SCEN-674: キャッシュ機能が正常に動作する', () => {
    // 前提: キャッシュが有効な状態
    const executiveUserId = 'user_11111';
    const contractIds = null;
    const portalAccessTimestamp1 = new Date('2024-01-15T13:00:00Z');
    const portalAccessTimestamp2 = new Date('2024-01-15T13:05:00Z');
    const cacheKey = `portal_report_${executiveUserId}`;
    const isSharedBrowserSession = false;
    const usePrivateMode = false;

    // 1回目のアクセス（キャッシュに保存される）
    const result1 = validatePortalReportVisibility({
      executiveUserId: executiveUserId,
      assignedContractIds: contractIds,
      accessTimestamp: portalAccessTimestamp1,
      useCache: true,
      cacheKey: cacheKey,
      isSharedBrowser: isSharedBrowserSession,
      usePrivateMode: usePrivateMode,
    });

    // 2回目のアクセス（キャッシュから取得）
    const result2 = validatePortalReportVisibility({
      executiveUserId: executiveUserId,
      assignedContractIds: contractIds,
      accessTimestamp: portalAccessTimestamp2,
      useCache: true,
      cacheKey: cacheKey,
      isSharedBrowser: isSharedBrowserSession,
      usePrivateMode: usePrivateMode,
    });

    // キャッシュが正常に機能していることを確認
    expect(result1.isReportVisible).toEqual(result2.isReportVisible);
    expect(result1.reportDisplayStatus).toEqual(result2.reportDisplayStatus);
    expect(result1.consoleErrorOccurred).toBe(false);
    expect(result2.consoleErrorOccurred).toBe(false);
  });
});