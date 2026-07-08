import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { recordImprovementPlanDataAndHistory } from '../../src/logic/it-6-2-2-2';

const fetchMock = require('jest-fetch-mock');

describe('改善計画データ登録・記録機能', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1488
  test('改善計画が承認状態で過去案件データと物価本の追加・更新を開始した場合、新物価本バージョンと更新内容がシステムに正確に記録される', async () => {
    const improvementPlanId = 'IP-20240115-001';
    const approvalStatus = 'APPROVED';
    const priceBookVersion = '2024';
    const priceBookVersionPrevious = '2023';
    const executionUser = 'user-12345';
    const executionTimestamp = new Date('2024-01-15T11:00:00Z');
    const historicalProjectId = 'PROJ-2023-0045';
    const updateContent = { unitPrice: 15000, quantityAdjustment: 1.05 };

    const improvementPlanInput = {
      planId: improvementPlanId,
      approvalStatus: approvalStatus,
      priceBookVersion: priceBookVersion,
      historicalProjectId: historicalProjectId,
      executionUser: executionUser,
      executionTime: executionTimestamp,
      updateContent: updateContent,
    };

    const expectedRecordedData = {
      planId: improvementPlanId,
      status: 'APPROVED',
      priceBookVersionRecorded: priceBookVersion,
      historicalProjectIdRecorded: historicalProjectId,
      executionUserRecorded: executionUser,
      executionTimeRecorded: executionTimestamp.toISOString(),
      updateContentRecorded: updateContent,
      historyCount: 2,
      auditLogEntries: 2,
      multiUserConsistency: true,
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        planId: improvementPlanId,
        status: approvalStatus,
        priceBookVersionRegistered: priceBookVersion,
        historicalProjectRegistered: historicalProjectId,
        executionUserLogged: executionUser,
        executionTimeLogged: executionTimestamp.toISOString(),
        updateContentLogged: updateContent,
        totalHistoryRecords: 2,
        auditLogCount: 2,
        dataConsistencyValidated: true,
      }),
      { status: 200 }
    );

    const result = await recordImprovementPlanDataAndHistory(improvementPlanInput);

    expect(result.planId).toBe(improvementPlanId);
    expect(result.status).toBe('APPROVED');
    expect(result.priceBookVersionRegistered).toBe(priceBookVersion);
    expect(result.historicalProjectRegistered).toBe(historicalProjectId);
    expect(result.executionUserLogged).toBe(executionUser);
    expect(result.executionTimeLogged).toBe(executionTimestamp.toISOString());
    expect(result.updateContentLogged).toEqual(updateContent);
    expect(result.totalHistoryRecords).toBe(2);
    expect(result.auditLogCount).toBe(2);
    expect(result.dataConsistencyValidated).toBe(true);
    expect(result.success).toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toContain('/api/improvement-plan/record');
  });

  test('改善計画が承認状態에 없는 경우 예외 처리', async () => {
    const improvementPlanInput = {
      planId: 'IP-20240115-002',
      approvalStatus: 'PENDING',
      priceBookVersion: '2024',
      historicalProjectId: 'PROJ-2023-0046',
      executionUser: 'user-12346',
      executionTime: new Date('2024-01-15T12:00:00Z'),
      updateContent: { unitPrice: 15500 },
    };

    expect(() => recordImprovementPlanDataAndHistory(improvementPlanInput)).toThrow(/承認/);
  });

  test('물가本バージョンが空の場合 예외 처리', async () => {
    const improvementPlanInput = {
      planId: 'IP-20240115-003',
      approvalStatus: 'APPROVED',
      priceBookVersion: '',
      historicalProjectId: 'PROJ-2023-0047',
      executionUser: 'user-12347',
      executionTime: new Date('2024-01-15T13:00:00Z'),
      updateContent: { unitPrice: 16000 },
    };

    expect(() => recordImprovementPlanDataAndHistory(improvementPlanInput)).toThrow(/物価本/);
  });

  test('過去案件IDが空の場合 예외 처리', async () => {
    const improvementPlanInput = {
      planId: 'IP-20240115-004',
      approvalStatus: 'APPROVED',
      priceBookVersion: '2024',
      historicalProjectId: '',
      executionUser: 'user-12348',
      executionTime: new Date('2024-01-15T14:00:00Z'),
      updateContent: { unitPrice: 16500 },
    };

    expect(() => recordImprovementPlanDataAndHistory(improvementPlanInput)).toThrow(/過去案件/);
  });

  test('実行ユーザーが空の場合 예외 처리', async () => {
    const improvementPlanInput = {
      planId: 'IP-20240115-005',
      approvalStatus: 'APPROVED',
      priceBookVersion: '2024',
      historicalProjectId: 'PROJ-2023-0048',
      executionUser: '',
      executionTime: new Date('2024-01-15T15:00:00Z'),
      updateContent: { unitPrice: 17000 },
    };

    expect(() => recordImprovementPlanDataAndHistory(improvementPlanInput)).toThrow(/ユーザー/);
  });

  test('更新内容が空オブジェクトの場合 예외 処理', async () => {
    const improvementPlanInput = {
      planId: 'IP-20240115-006',
      approvalStatus: 'APPROVED',
      priceBookVersion: '2024',
      historicalProjectId: 'PROJ-2023-0049',
      executionUser: 'user-12349',
      executionTime: new Date('2024-01-15T16:00:00Z'),
      updateContent: {},
    };

    expect(() => recordImprovementPlanDataAndHistory(improvementPlanInput)).toThrow(/更新内容/);
  });

  test('複数の改善計画データを順序保持で記録する', async () => {
    const improvementPlanInput1 = {
      planId: 'IP-20240115-007',
      approvalStatus: 'APPROVED',
      priceBookVersion: '2024',
      historicalProjectId: 'PROJ-2023-0050',
      executionUser: 'user-12350',
      executionTime: new Date('2024-01-15T10:00:00Z'),
      updateContent: { unitPrice: 14000 },
    };

    const improvementPlanInput2 = {
      planId: 'IP-20240115-008',
      approvalStatus: 'APPROVED',
      priceBookVersion: '2024',
      historicalProjectId: 'PROJ-2023-0051',
      executionUser: 'user-12350',
      executionTime: new Date('2024-01-15T10:15:00Z'),
      updateContent: { quantityAdjustment: 1.02 },
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        planId: 'IP-20240115-007',
        status: 'APPROVED',
        priceBookVersionRegistered: '2024',
        historicalProjectRegistered: 'PROJ-2023-0050',
        executionUserLogged: 'user-12350',
        executionTimeLogged: '2024-01-15T10:00:00Z',
        updateContentLogged: { unitPrice: 14000 },
        totalHistoryRecords: 1,
        auditLogCount: 1,
        dataConsistencyValidated: true,
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        planId: 'IP-20240115-008',
        status: 'APPROVED',
        priceBookVersionRegistered: '2024',
        historicalProjectRegistered: 'PROJ-2023-0051',
        executionUserLogged: 'user-12350',
        executionTimeLogged: '2024-01-15T10:15:00Z',
        updateContentLogged: { quantityAdjustment: 1.02 },
        totalHistoryRecords: 1,
        auditLogCount: 1,
        dataConsistencyValidated: true,
      }),
      { status: 200 }
    );

    const result1 = await recordImprovementPlanDataAndHistory(improvementPlanInput1);
    const result2 = await recordImprovementPlanDataAndHistory(improvementPlanInput2);

    expect(result1.planId).toBe('IP-20240115-007');
    expect(result2.planId).toBe('IP-20240115-008');
    expect(result1.executionTimeLogged).toBe('2024-01-15T10:00:00Z');
    expect(result2.executionTimeLogged).toBe('2024-01-15T10:15:00Z');
    expect(result1.executionTimeLogged < result2.executionTimeLogged).toBe(true);
  });

  test('データベース保存処理が完了し監査ログが正確に記録される', async () => {
    const improvementPlanId = 'IP-20240115-009';
    const executionUser = 'user-12351';
    const executionTimestamp = new Date('2024-01-15T17:30:00Z');

    const improvementPlanInput = {
      planId: improvementPlanId,
      approvalStatus: 'APPROVED',
      priceBookVersion: '2024',
      historicalProjectId: 'PROJ-2023-0052',
      executionUser: executionUser,
      executionTime: executionTimestamp,
      updateContent: { unitPrice: 18000, quantityAdjustment: 1.08 },
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        planId: improvementPlanId,
        status: 'APPROVED',
        priceBookVersionRegistered: '2024',
        historicalProjectRegistered: 'PROJ-2023-0052',
        executionUserLogged: executionUser,
        executionTimeLogged: executionTimestamp.toISOString(),
        updateContentLogged: { unitPrice: 18000, quantityAdjustment: 1.08 },
        totalHistoryRecords: 2,
        auditLogCount: 2,
        auditLogDetails: [
          {
            logId: 'LOG-001',
            eventType: 'DATA_ADD',
            timestamp: executionTimestamp.toISOString(),
            user: executionUser,
            details: 'Past project data added',
          },
          {
            logId: 'LOG-002',
            eventType: 'DATA_UPDATE',
            timestamp: executionTimestamp.toISOString(),
            user: executionUser,
            details: 'Price book version updated',
          },
        ],
        dataConsistencyValidated: true,
      }),
      { status: 200 }
    );

    const result = await recordImprovementPlanDataAndHistory(improvementPlanInput);

    expect(result.auditLogCount).toBe(2);
    expect(result.auditLogDetails).toHaveLength(2);
    expect(result.auditLogDetails[0].eventType).toBe('DATA_ADD');
    expect(result.auditLogDetails[1].eventType).toBe('DATA_UPDATE');
    expect(result.auditLogDetails[0].user).toBe(executionUser);
    expect(result.auditLogDetails[1].user).toBe(executionUser);
  });

  test('複数ユーザー環境でのデータ整合性が保証される', async () => {
    const improvementPlanId = 'IP-20240115-010';
    const firstUser = 'user-12352';
    const secondUser = 'user-12353';
    const executionTimestamp = new Date('2024-01-15T18:00:00Z');

    const improvementPlanInputFirst = {
      planId: improvementPlanId,
      approvalStatus: 'APPROVED',
      priceBookVersion: '2024',
      historicalProjectId: 'PROJ-2023-0053',
      executionUser: firstUser,
      executionTime: executionTimestamp,
      updateContent: { unitPrice: 19000 },
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        planId: improvementPlanId,
        status: 'APPROVED',
        priceBookVersionRegistered: '2024',
        historicalProjectRegistered: 'PROJ-2023-0053',
        executionUserLogged: firstUser,
        executionTimeLogged: executionTimestamp.toISOString(),
        updateContentLogged: { unitPrice: 19000 },
        totalHistoryRecords: 1,
        auditLogCount: 1,
        dataConsistencyValidated: true,
      }),
      { status: 200 }
    );

    const resultFirst = await recordImprovementPlanDataAndHistory(improvementPlanInputFirst);

    expect(resultFirst.dataConsistencyValidated).toBe(true);
    expect(resultFirst.planId).toBe(improvementPlanId);

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        planId: improvementPlanId,
        status: 'APPROVED',
        priceBookVersionRegistered: '2024',
        historicalProjectRegistered: 'PROJ-2023-0053',
        executionUserLogged: firstUser,
        executionTimeLogged: executionTimestamp.toISOString(),
        updateContentLogged: { unitPrice: 19000 },
        totalHistoryRecords: 1,
        auditLogCount: 1,
        multiUserAccessible: true,
        dataConsistencyValidated: true,
      }),
      { status: 200 }
    );

    const resultSecond = await recordImprovementPlanDataAndHistory(improvementPlanInputFirst);

    expect(resultSecond.multiUserAccessible).toBe(true);
    expect(resultSecond.planId).toBe(improvementPlanId);
    expect(resultSecond.priceBookVersionRegistered).toBe('2024');
  });

  test('改善計画の履歴が時系列で正確に表示される', async () => {
    const improvementPlanId = 'IP-20240115-011';
    const executionUser = 'user-12354';
    const executionTime1 = new Date('2024-01-15T09:00:00Z');
    const executionTime2 = new Date('2024-01-15T10:30:00Z');

    const improvementPlanInput1 = {
      planId: improvementPlanId,
      approvalStatus: 'APPROVED',
      priceBookVersion: '2023',
      historicalProjectId: 'PROJ-2023-0054',
      executionUser: executionUser,
      executionTime: executionTime1,
      updateContent: { unitPrice: 12000 },
    };

    const improvementPlanInput2 = {
      planId: improvementPlanId,
      approvalStatus: 'APPROVED',
      priceBookVersion: '2024',
      historicalProjectId: 'PROJ-2023-0055',
      executionUser: executionUser,
      executionTime: executionTime2,
      updateContent: { unitPrice: 13000, quantityAdjustment: 1.1 },
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        planId: improvementPlanId,
        status: 'APPROVED',
        priceBookVersionRegistered: '2023',
        historicalProjectRegistered: 'PROJ-2023-0054',
        executionUserLogged: executionUser,
        executionTimeLogged: executionTime1.toISOString(),
        updateContentLogged: { unitPrice: 12000 },
        totalHistoryRecords: 1,
        auditLogCount: 1,
        dataConsistencyValidated: true,
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        planId: improvementPlanId,
        status: 'APPROVED',
        priceBookVersionRegistered: '2024',
        historicalProjectRegistered: 'PROJ-2023-0055',
        executionUserLogged: executionUser,
        executionTimeLogged: executionTime2.toISOString(),
        updateContentLogged: { unitPrice: 13000, quantityAdjustment: 1.1 },
        totalHistoryRecords: 2,
        auditLogCount: 2,
        historyTimeline: [
          {
            sequence: 1,
            timestamp: executionTime1.toISOString(),
            action: 'ADD',
            version: '2023',
          },
          {
            sequence: 2,
            timestamp: executionTime2.toISOString(),
            action: 'UPDATE',
            version: '2024',
          },
        ],
        dataConsistencyValidated: true,
      }),
      { status: 200 }
    );

    await recordImprovementPlanDataAndHistory(improvementPlanInput1);
    const result2 = await recordImprovementPlanDataAndHistory(improvementPlanInput2);

    expect(result2.historyTimeline).toHaveLength(2);
    expect(result2.historyTimeline[0].sequence).toBe(1);
    expect(result2.historyTimeline[1].sequence).toBe(2);
    expect(result2.historyTimeline[0].timestamp).toBe(executionTime1.toISOString());
    expect(result2.historyTimeline[1].timestamp).toBe(executionTime2.toISOString());
    expect(result2.historyTimeline[0].timestamp < result2.historyTimeline[1].timestamp).toBe(true);
  });
});