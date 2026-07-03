import { determineProficiencyLevel, generateMaterials, assignChecklist } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('新入スタッフ習熟度判定・段階育成機能', () => {
  // SCEN-919
  test('新入スタッフがレベル1として判定され、対応する教材とチェックリストが割り当てられる', () => {
    // ===== Setup: 新入スタッフテストアカウント作成 =====
    const newStaffId = 'STAFF_TEST_001';
    const newStaffName = '田中太郎';
    const hireDate = new Date('2024-01-15T09:00:00Z');
    const departmentId = 'DEPT_001';

    // ===== 習熟度診断実行: レベル1判定の前提条件 =====
    // 新入スタッフが診断テストを受験、スコア: 40点（レベル1基準: 0-50点）
    const diagnosticScore = 40;
    const maxDiagnosticScore = 100;

    // ===== 習熟度レベル判定実行 =====
    const proficiencyResult = determineProficiencyLevel({
      staffId: newStaffId,
      staffName: newStaffName,
      hireDate: hireDate,
      departmentId: departmentId,
      diagnosticScore: diagnosticScore,
      maxScore: maxDiagnosticScore,
    });

    // ===== 期待: スタッフがレベル1として判定される =====
    expect(proficiencyResult).toEqual({
      staffId: newStaffId,
      assignedLevel: 1,
      levelName: '初期段階',
      diagnosticScore: diagnosticScore,
      scoreBand: '0-50',
      judgmentDate: expect.any(Date),
      eligibleForNextLevel: false,
    });

    // ===== 教材生成: レベル1対応教材リストの自動生成 =====
    const materialsResult = generateMaterials({
      staffId: newStaffId,
      proficiencyLevel: proficiencyResult.assignedLevel,
      departmentId: departmentId,
      trainingStartDate: hireDate,
    });

    // ===== 期待: レベル1用教材リスト生成 =====
    // レベル1教材: 基礎5項目 (請求書作成基礎・営業報告書集計基礎・契約書管理基礎・品質チェック基礎・例外ケース理解)
    expect(materialsResult).toEqual({
      staffId: newStaffId,
      proficiencyLevel: 1,
      materialCount: 5,
      materials: expect.arrayContaining([
        expect.objectContaining({
          materialId: expect.stringMatching(/^MAT_LEVEL1_/),
          title: expect.stringMatching(/基礎|基本/),
          completionStatus: 'NOT_STARTED',
          recommendedCompletionDays: 7,
        }),
      ]),
      estimatedCompletionDays: 35,
      lastUpdated: expect.any(Date),
    });

    // ===== 検証: レベル1教材が5件であることを確認 =====
    expect(materialsResult.materials).toHaveLength(5);
    expect(materialsResult.materials[0]).toHaveProperty('materialId');
    expect(materialsResult.materials[0]).toHaveProperty('title');
    expect(materialsResult.materials[0].recommendedCompletionDays).toBe(7);
    expect(materialsResult.estimatedCompletionDays).toBe(35);

    // ===== チェックリスト割り当て: レベル1対応チェックリストの自動割り当て =====
    const checklistResult = assignChecklist({
      staffId: newStaffId,
      proficiencyLevel: proficiencyResult.assignedLevel,
      departmentId: departmentId,
      materialIds: materialsResult.materials.map((m) => m.materialId),
    });

    // ===== 期待: レベル1用チェックリスト割り当て =====
    // レベル1チェックリスト: 基礎業務4項目 (請求書作成・営業報告書集計・契約書管理・品質チェック)
    expect(checklistResult).toEqual({
      staffId: newStaffId,
      checklistId: expect.stringMatching(/^CHKLIST_LEVEL1_/),
      proficiencyLevel: 1,
      checklistName: expect.stringMatching(/レベル1/),
      itemCount: 4,
      items: expect.arrayContaining([
        expect.objectContaining({
          itemId: expect.stringMatching(/^ITEM_/),
          taskName: expect.stringMatching(/請求書作成|営業報告書集計|契約書管理|品質チェック/),
          status: 'PENDING',
          dueDate: expect.any(Date),
        }),
      ]),
      assignedDate: expect.any(Date),
      targetCompletionDate: expect.any(Date),
    });

    // ===== 検証: チェックリストアイテム数 =====
    expect(checklistResult.items).toHaveLength(4);
    checklistResult.items.forEach((item) => {
      expect(item.status).toBe('PENDING');
      expect(item).toHaveProperty('taskName');
      expect(item).toHaveProperty('dueDate');
    });

    // ===== 検証: 学習ポータル表示データ構造 =====
    const learningPortalData = {
      staffId: newStaffId,
      currentLevel: proficiencyResult.assignedLevel,
      materials: materialsResult.materials,
      checklist: checklistResult,
      progressPercentage: 0,
      nextReviewDate: new Date('2024-02-15T09:00:00Z'),
    };

    expect(learningPortalData.materials).toBeDefined();
    expect(learningPortalData.materials.length).toBe(5);
    expect(learningPortalData.checklist.itemCount).toBe(4);
    expect(learningPortalData.progressPercentage).toBe(0);

    // ===== 検証: ダッシュボード表示データ構造 =====
    const dashboardData = {
      staffId: newStaffId,
      proficiencyLevel: proficiencyResult.assignedLevel,
      levelName: proficiencyResult.levelName,
      diagnosticScore: proficiencyResult.diagnosticScore,
      materialAssignedCount: materialsResult.materialCount,
      checklistAssignedCount: checklistResult.itemCount,
      completedMaterials: 0,
      completedChecklist: 0,
      lastUpdate: expect.any(Date),
    };

    expect(dashboardData.proficiencyLevel).toBe(1);
    expect(dashboardData.levelName).toBe('初期段階');
    expect(dashboardData.materialAssignedCount).toBe(5);
    expect(dashboardData.checklistAssignedCount).toBe(4);
    expect(dashboardData.completedMaterials).toBe(0);
    expect(dashboardData.completedChecklist).toBe(0);

    // ===== 検証: 教材とチェックリスト内容の妥当性 =====
    // 各教材が基礎レベルの推奨学習期間（7日）で構成されていることを確認
    materialsResult.materials.forEach((material) => {
      expect(material.recommendedCompletionDays).toBe(7);
      expect(material.completionStatus).toBe('NOT_STARTED');
      expect(material.materialId).toMatch(/^MAT_LEVEL1_/);
    });

    // チェックリスト全体の目標完了期間（合計28日: 4項目×7日）
    const totalChecklistDays = checklistResult.items.length * 7;
    expect(totalChecklistDays).toBe(28);

    // ===== 最終検証: レベル1基準の全要件充足 =====
    expect(proficiencyResult.assignedLevel).toBe(1);
    expect(proficiencyResult.levelName).toBe('初期段階');
    expect(materialsResult.materialCount).toBe(5);
    expect(checklistResult.itemCount).toBe(4);
    expect(learningPortalData.progressPercentage).toBe(0);
  });
});