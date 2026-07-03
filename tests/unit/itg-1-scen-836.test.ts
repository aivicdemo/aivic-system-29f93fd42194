import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { consolidateContractDeadlineChanges } from '../../src/logic/it-1-2-1';

describe('契約納期変更自動通知機能 - 複数納期変更の統合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // SCEN-836: 同一契約について複数の納期変更が短時間に連続発生したとき、最新の変更内容のみ通知される
  test('短時間に連続発生した複数の納期変更のうち、最新の変更内容のみが1件の通知として発行される', async () => {
    const contractId = 'TEST-001';
    const baseTime = new Date('2024-01-15T10:00:00Z');

    // 初期状態：通知ログは空
    const changeLog = [
      {
        contractId: contractId,
        changeSequence: 1,
        originalDeadline: '2024-03-15',
        newDeadline: '2024-03-31',
        changedAt: new Date(baseTime.getTime() + 0),
        changedBy: 'user_001'
      },
      {
        contractId: contractId,
        changeSequence: 2,
        originalDeadline: '2024-03-31',
        newDeadline: '2024-04-15',
        changedAt: new Date(baseTime.getTime() + 2000),
        changedBy: 'user_001'
      },
      {
        contractId: contractId,
        changeSequence: 3,
        originalDeadline: '2024-04-15',
        newDeadline: '2024-04-30',
        changedAt: new Date(baseTime.getTime() + 5000),
        changedBy: 'user_001'
      }
    ];

    const result = consolidateContractDeadlineChanges({
      contractId: contractId,
      changes: changeLog,
      consolidationWindowMs: 10000
    });

    // 検証1: 通知は1件のみ発行される
    expect(result.notifications).toHaveLength(1);

    // 検証2: 通知に含まれるのは最新の変更内容のみ
    const notification = result.notifications[0];
    expect(notification.contractId).toBe(contractId);
    expect(notification.newDeadline).toBe('2024-04-30');
    expect(notification.originalDeadline).toBe('2024-03-15');

    // 検証3: 通知に含まれる変更数が正確
    expect(notification.consolidatedChangeCount).toBe(3);

    // 検証4: 通知の発行対象に最新変更者が含まれる
    expect(notification.notificationRecipientUserId).toBe('user_001');

    // 検証5: 中間の変更内容（2024-03-31、2024-04-15）は通知に含まれない
    expect(notification.newDeadline).not.toBe('2024-03-31');
    expect(notification.newDeadline).not.toBe('2024-04-15');

    // 検証6: 統合ウィンドウ内に収まった変更のみが処理される
    expect(result.consolidatedChanges).toHaveLength(1);
    expect(result.consolidatedChanges[0].finalDeadline).toBe('2024-04-30');
    expect(result.consolidatedChanges[0].changeCount).toBe(3);
  });

  // 境界値テスト：ちょうどウィンドウ境界での変更
  test('統合ウィンドウの境界時間における複数変更を正しく処理する', async () => {
    const contractId = 'TEST-002';
    const baseTime = new Date('2024-01-15T10:00:00Z');
    const windowMs = 10000;

    const changeLog = [
      {
        contractId: contractId,
        changeSequence: 1,
        originalDeadline: '2024-03-15',
        newDeadline: '2024-03-31',
        changedAt: new Date(baseTime.getTime()),
        changedBy: 'user_002'
      },
      {
        contractId: contractId,
        changeSequence: 2,
        originalDeadline: '2024-03-31',
        newDeadline: '2024-04-30',
        changedAt: new Date(baseTime.getTime() + windowMs - 1),
        changedBy: 'user_002'
      }
    ];

    const result = consolidateContractDeadlineChanges({
      contractId: contractId,
      changes: changeLog,
      consolidationWindowMs: windowMs
    });

    // ウィンドウ内の変更は統合される
    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0].newDeadline).toBe('2024-04-30');
    expect(result.notifications[0].consolidatedChangeCount).toBe(2);
  });

  // エラーテスト：データの型検証
  test('不正な契約IDが渡された場合、エラーを検出する', () => {
    expect(() =>
      consolidateContractDeadlineChanges({
        contractId: '',
        changes: [],
        consolidationWindowMs: 10000
      })
    ).toThrow(/契約ID/);
  });

  // エラーテスト：変更レコードが不足している場合
  test('変更レコードが空の場合、適切に処理する', () => {
    const result = consolidateContractDeadlineChanges({
      contractId: 'TEST-003',
      changes: [],
      consolidationWindowMs: 10000
    });

    expect(result.notifications).toHaveLength(0);
    expect(result.consolidatedChanges).toHaveLength(0);
  });

  // エラーテスト：統合ウィンドウが無効な値
  test('負の統合ウィンドウが指定された場合、エラーを検出する', () => {
    const changeLog = [
      {
        contractId: 'TEST-004',
        changeSequence: 1,
        originalDeadline: '2024-03-15',
        newDeadline: '2024-03-31',
        changedAt: new Date('2024-01-15T10:00:00Z'),
        changedBy: 'user_004'
      }
    ];

    expect(() =>
      consolidateContractDeadlineChanges({
        contractId: 'TEST-004',
        changes: changeLog,
        consolidationWindowMs: -1000
      })
    ).toThrow(/ウィンドウ/);
  });

  // ビジネスロジック検証：単一変更の場合
  test('単一の納期変更の場合、その変更内容が通知される', () => {
    const contractId = 'TEST-005';
    const baseTime = new Date('2024-01-15T10:00:00Z');

    const changeLog = [
      {
        contractId: contractId,
        changeSequence: 1,
        originalDeadline: '2024-03-15',
        newDeadline: '2024-03-31',
        changedAt: baseTime,
        changedBy: 'user_005'
      }
    ];

    const result = consolidateContractDeadlineChanges({
      contractId: contractId,
      changes: changeLog,
      consolidationWindowMs: 10000
    });

    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0].contractId).toBe(contractId);
    expect(result.notifications[0].newDeadline).toBe('2024-03-31');
    expect(result.notifications[0].originalDeadline).toBe('2024-03-15');
    expect(result.notifications[0].consolidatedChangeCount).toBe(1);
  });

  // ビジネスロジック検証：ウィンドウを超えた変更は別々に通知される
  test('統合ウィンドウを超えた時間差の変更は別々の通知として発行される', () => {
    const contractId = 'TEST-006';
    const baseTime = new Date('2024-01-15T10:00:00Z');
    const windowMs = 5000;

    const changeLog = [
      {
        contractId: contractId,
        changeSequence: 1,
        originalDeadline: '2024-03-15',
        newDeadline: '2024-03-31',
        changedAt: new Date(baseTime.getTime()),
        changedBy: 'user_006'
      },
      {
        contractId: contractId,
        changeSequence: 2,
        originalDeadline: '2024-03-31',
        newDeadline: '2024-04-15',
        changedAt: new Date(baseTime.getTime() + windowMs + 1000),
        changedBy: 'user_006'
      }
    ];

    const result = consolidateContractDeadlineChanges({
      contractId: contractId,
      changes: changeLog,
      consolidationWindowMs: windowMs
    });

    // ウィンドウを超えた変更は2つの通知として発行される
    expect(result.notifications).toHaveLength(2);
    expect(result.notifications[0].newDeadline).toBe('2024-03-31');
    expect(result.notifications[1].newDeadline).toBe('2024-04-15');
  });

  // ビジネスロジック検証：異なる契約の変更は分離される
  test('複数の契約に対する変更は独立して処理される', () => {
    const contract1 = 'TEST-007';
    const contract2 = 'TEST-008';
    const baseTime = new Date('2024-01-15T10:00:00Z');

    const changeLog = [
      {
        contractId: contract1,
        changeSequence: 1,
        originalDeadline: '2024-03-15',
        newDeadline: '2024-03-31',
        changedAt: new Date(baseTime.getTime()),
        changedBy: 'user_007'
      },
      {
        contractId: contract2,
        changeSequence: 1,
        originalDeadline: '2024-04-15',
        newDeadline: '2024-04-30',
        changedAt: new Date(baseTime.getTime() + 2000),
        changedBy: 'user_007'
      }
    ];

    // contract1の処理
    const result1 = consolidateContractDeadlineChanges({
      contractId: contract1,
      changes: changeLog.filter(c => c.contractId === contract1),
      consolidationWindowMs: 10000
    });

    // contract2の処理
    const result2 = consolidateContractDeadlineChanges({
      contractId: contract2,
      changes: changeLog.filter(c => c.contractId === contract2),
      consolidationWindowMs: 10000
    });

    // 各契約の通知が正確に発行されること
    expect(result1.notifications).toHaveLength(1);
    expect(result1.notifications[0].contractId).toBe(contract1);
    expect(result1.notifications[0].newDeadline).toBe('2024-03-31');

    expect(result2.notifications).toHaveLength(1);
    expect(result2.notifications[0].contractId).toBe(contract2);
    expect(result2.notifications[0].newDeadline).toBe('2024-04-30');
  });

  // ビジネスロジック検証：時系列順序の検証
  test('変更レコードが時系列順に並んでいることを確認する', () => {
    const contractId = 'TEST-009';
    const baseTime = new Date('2024-01-15T10:00:00Z');

    const changeLog = [
      {
        contractId: contractId,
        changeSequence: 1,
        originalDeadline: '2024-03-15',
        newDeadline: '2024-03-20',
        changedAt: new Date(baseTime.getTime()),
        changedBy: 'user_009'
      },
      {
        contractId: contractId,
        changeSequence: 2,
        originalDeadline: '2024-03-20',
        newDeadline: '2024-03-25',
        changedAt: new Date(baseTime.getTime() + 1000),
        changedBy: 'user_009'
      },
      {
        contractId: contractId,
        changeSequence: 3,
        originalDeadline: '2024-03-25',
        newDeadline: '2024-03-31',
        changedAt: new Date(baseTime.getTime() + 2000),
        changedBy: 'user_009'
      }
    ];

    const result = consolidateContractDeadlineChanges({
      contractId: contractId,
      changes: changeLog,
      consolidationWindowMs: 10000
    });

    // 統合ウィンドウ内のすべての変更が統合される
    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0].consolidatedChangeCount).toBe(3);

    // 最終的な納期は最後の変更を反映
    expect(result.notifications[0].newDeadline).toBe('2024-03-31');

    // 元の納期は最初の変更から
    expect(result.notifications[0].originalDeadline).toBe('2024-03-15');
  });
});