import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
  initializeStaffOnboarding,
  completeChecklistItem,
  getStaffCurrentStage,
  getStaffProgressHistory,
} from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('新入スタッフ習熟度判定・段階育成機能', () => {
  let staffId: string;
  let stageProgressMap: Map<string, { stage: number; completedAt: string | null; checklistItemsCompleted: Set<string> }>;

  beforeEach(() => {
    staffId = 'staff-001';
    stageProgressMap = new Map();
    stageProgressMap.set(staffId, {
      stage: 1,
      completedAt: null,
      checklistItemsCompleted: new Set(),
    });
  });

  afterEach(() => {
    stageProgressMap.clear();
  });

  // SCEN-920: 新入スタッフ習熟度判定・段階育成機能 - スタッフが各段階のチェックリストを完了した場合、次の段階へ自動昇格し、進捗が記録される
  test('段階1のすべてのチェックリスト項目を完了後、段階2に自動昇格し進捗が記録される', () => {
    // 初期化: テストユーザー（新入スタッフ）でログイン状態を想定
    const initResult = initializeStaffOnboarding({
      staffId: staffId,
      staffName: '新入スタッフA',
      joinDate: '2024-01-15',
    });
    expect(initResult.success).toBe(true);
    expect(initResult.initialStage).toBe(1);

    // 段階1の現在段階を確認
    let currentStage = getStaffCurrentStage({ staffId: staffId });
    expect(currentStage).toBe(1);

    // 段階1のチェックリスト項目定義（基本操作、データ入力方法、品質チェックなど）
    const stage1ChecklistItems = [
      'basic-operation-1',
      'data-input-method-1',
      'quality-check-1',
    ];

    // 段階1のチェックリスト項目を1つずつ完了にマークする
    let checklistCompleteResult;
    for (let i = 0; i < stage1ChecklistItems.length - 1; i++) {
      checklistCompleteResult = completeChecklistItem({
        staffId: staffId,
        stage: 1,
        checklistItemId: stage1ChecklistItems[i],
        completedAt: `2024-01-20T09:${String(30 + i).padStart(2, '0')}:00Z`,
      });
      expect(checklistCompleteResult.success).toBe(true);
      expect(checklistCompleteResult.stageChanged).toBe(false);
    }

    // 最後のチェックリスト項目を完了にマークする（段階昇格トリガー）
    const lastItemCompletedAt = '2024-01-20T09:32:00Z';
    checklistCompleteResult = completeChecklistItem({
      staffId: staffId,
      stage: 1,
      checklistItemId: stage1ChecklistItems[stage1ChecklistItems.length - 1],
      completedAt: lastItemCompletedAt,
    });
    expect(checklistCompleteResult.success).toBe(true);
    expect(checklistCompleteResult.stageChanged).toBe(true);
    expect(checklistCompleteResult.newStage).toBe(2);
    expect(checklistCompleteResult.message).toMatch(/段階2/);

    // 段階1のチェックリスト完了状態を確認
    const stage1Completion = {
      itemsCount: 3,
      completedItemsCount: 3,
      completionPercentage: 100,
    };
    expect(stage1Completion.completedItemsCount).toBe(stage1Completion.itemsCount);
    expect(stage1Completion.completionPercentage).toBe(100);

    // 育成機能の現在段階を再度確認（段階2に昇格）
    currentStage = getStaffCurrentStage({ staffId: staffId });
    expect(currentStage).toBe(2);

    // 進捗管理画面から段階1完了日時が記録されていることを確認
    const progressRecord = {
      staffId: staffId,
      stage1CompletedAt: lastItemCompletedAt,
      stage1CompletedAtISO: new Date(lastItemCompletedAt).toISOString(),
      currentStage: 2,
    };
    expect(progressRecord.stage1CompletedAt).toBe('2024-01-20T09:32:00Z');
    expect(progressRecord.currentStage).toBe(2);

    // 段階2のチェックリストが利用可能になっていることを確認
    const stage2AvailableChecklistItems = [
      'advanced-operation-1',
      'complex-data-input-1',
      'error-handling-1',
    ];
    expect(stage2AvailableChecklistItems.length).toBe(3);
    expect(stage2AvailableChecklistItems[0]).toMatch(/advanced|complex|error/);

    // 管理画面からスタッフの進捗履歴を確認
    const progressHistory = getStaffProgressHistory({ staffId: staffId });
    expect(progressHistory.staffId).toBe(staffId);
    expect(progressHistory.transitions.length).toBe(1);
    expect(progressHistory.transitions[0].fromStage).toBe(1);
    expect(progressHistory.transitions[0].toStage).toBe(2);
    expect(progressHistory.transitions[0].transitionAt).toBe('2024-01-20T09:32:00Z');
    expect(progressHistory.currentStage).toBe(2);
    expect(progressHistory.lastCompletedStage).toBe(1);
  });
});