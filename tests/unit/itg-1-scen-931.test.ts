import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  initializeTestDatabase,
  createChecklistVersion,
  createJudgmentCriteriaVersion,
  setMutualReferences,
  updateChecklistVersion,
  updateJudgmentCriteriaVersion,
  executeMonthlySummaryVersionManagement,
  getChecklistReferences,
  getJudgmentCriteriaReferences,
  detectCircularReferences,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレート・チェックリスト・判断基準のバージョン管理と相互参照", () => {
  // SCEN-931
  test("チェックリストと判断基準が同時に更新された場合、すべてのドキュメントの新バージョンが相互参照される", async () => {
    // テストデータベースの初期化
    await initializeTestDatabase();

    // チェックリスト（バージョン1.0）を作成
    const checklistV1 = await createChecklistVersion({
      documentId: "checklist-001",
      version: "1.0",
      title: "請求書作成業務チェックリスト",
      items: [
        {
          itemId: "cl-001",
          itemName: "営業データの完全性確認",
          checkRule: "必須項目が全て入力されていること",
        },
        {
          itemId: "cl-002",
          itemName: "データ型の正確性確認",
          checkRule: "各項目がデータ型基準に合致していること",
        },
      ],
      createdAt: new Date("2024-01-10T09:00:00Z"),
      createdBy: "operator-001",
      isActive: true,
    });

    // 判断基準（バージョン1.0）を作成
    const judgmentV1 = await createJudgmentCriteriaVersion({
      documentId: "judgment-001",
      version: "1.0",
      title: "請求額計算結果検証判断基準",
      criteria: [
        {
          criteriaId: "jc-001",
          criteriaName: "計算誤り判定基準",
          rule: "計算結果の許容誤差は±0.5%以内であること",
        },
        {
          criteriaId: "jc-002",
          criteriaName: "異常値検出基準",
          rule: "前月比異常値は±30%超過時に要確認",
        },
      ],
      createdAt: new Date("2024-01-10T09:30:00Z"),
      createdBy: "operator-001",
      isActive: true,
    });

    // 相互参照を設定：チェックリストが判断基準を参照
    await setMutualReferences({
      sourceDocumentId: "checklist-001",
      sourceVersion: "1.0",
      targetDocumentId: "judgment-001",
      targetVersion: "1.0",
      referenceType: "depends_on",
      referencedAt: new Date("2024-01-10T10:00:00Z"),
    });

    // 相互参照を設定：判断基準がチェックリストを参照
    await setMutualReferences({
      sourceDocumentId: "judgment-001",
      sourceVersion: "1.0",
      targetDocumentId: "checklist-001",
      targetVersion: "1.0",
      referenceType: "depends_on",
      referencedAt: new Date("2024-01-10T10:05:00Z"),
    });

    // チェックリストを更新してバージョン1.1に変更
    const checklistV11 = await updateChecklistVersion({
      documentId: "checklist-001",
      oldVersion: "1.0",
      newVersion: "1.1",
      items: [
        {
          itemId: "cl-001",
          itemName: "営業データの完全性確認",
          checkRule: "必須項目が全て入力されていること",
        },
        {
          itemId: "cl-002",
          itemName: "データ型の正確性確認",
          checkRule: "各項目がデータ型基準に合致していること",
        },
        {
          itemId: "cl-003",
          itemName: "異常値判定基準の確認",
          checkRule: "判断基準ドキュメントに基づき異常値を検出",
        },
      ],
      updatedAt: new Date("2024-01-15T09:00:00Z"),
      updatedBy: "operator-002",
    });

    // 判断基準を同時に更新してバージョン1.1に変更
    const judgmentV11 = await updateJudgmentCriteriaVersion({
      documentId: "judgment-001",
      oldVersion: "1.0",
      newVersion: "1.1",
      criteria: [
        {
          criteriaId: "jc-001",
          criteriaName: "計算誤り判定基準",
          rule: "計算結果の許容誤差は±0.5%以内であること",
        },
        {
          criteriaId: "jc-002",
          criteriaName: "異常値検出基準",
          rule: "前月比異常値は±30%超過時に要確認",
        },
        {
          criteriaId: "jc-003",
          criteriaName: "チェックリスト統合基準",
          rule: "チェックリストの全項目に対応する判断基準を保持",
        },
      ],
      updatedAt: new Date("2024-01-15T09:15:00Z"),
      updatedBy: "operator-002",
    });

    // バージョン管理・自動特定機能を実行
    const managementResult = await executeMonthlySummaryVersionManagement({
      executedAt: new Date("2024-01-15T10:00:00Z"),
      executedBy: "system",
      targetDocuments: [
        { documentId: "checklist-001", oldVersion: "1.0", newVersion: "1.1" },
        {
          documentId: "judgment-001",
          oldVersion: "1.0",
          newVersion: "1.1",
        },
      ],
    });

    // チェックリスト（バージョン1.1）の相互参照情報を確認
    const checklistReferences = await getChecklistReferences({
      documentId: "checklist-001",
      version: "1.1",
    });

    // 判断基準（バージョン1.1）の相互参照情報を確認
    const judgmentReferences = await getJudgmentCriteriaReferences({
      documentId: "judgment-001",
      version: "1.1",
    });

    // 両ドキュメント内の参照先バージョン番号が一致していることを検証
    expect(checklistReferences.references).toHaveLength(1);
    const checklistTargetRef = checklistReferences.references[0];
    expect(checklistTargetRef.targetDocumentId).toBe("judgment-001");
    expect(checklistTargetRef.targetVersion).toBe("1.1");
    expect(checklistTargetRef.referenceType).toBe("depends_on");

    expect(judgmentReferences.references).toHaveLength(1);
    const judgmentTargetRef = judgmentReferences.references[0];
    expect(judgmentTargetRef.targetDocumentId).toBe("checklist-001");
    expect(judgmentTargetRef.targetVersion).toBe("1.1");
    expect(judgmentTargetRef.referenceType).toBe("depends_on");

    // 参照関係の循環参照がないことを確認
    const circularRefResult = await detectCircularReferences({
      startDocumentId: "checklist-001",
      startVersion: "1.1",
      maxDepth: 10,
    });

    expect(circularRefResult.hasCircularReference).toBe(false);
    expect(circularRefResult.circularPath).toHaveLength(0);

    // バージョン管理実行結果の検証
    expect(managementResult.executionStatus).toBe("success");
    expect(managementResult.updatedReferencesCount).toBe(2);
    expect(managementResult.errors).toHaveLength(0);

    // 相互参照の更新日時が記録されていることを確認
    expect(
      new Date(checklistTargetRef.updatedAt).getTime()
    ).toBeGreaterThanOrEqual(
      new Date("2024-01-15T10:00:00Z").getTime()
    );
    expect(
      new Date(judgmentTargetRef.updatedAt).getTime()
    ).toBeGreaterThanOrEqual(
      new Date("2024-01-15T10:00:00Z").getTime()
    );

    // ドキュメント内のすべての参照が有効であることを確認
    expect(checklistReferences.isAllReferencesValid).toBe(true);
    expect(judgmentReferences.isAllReferencesValid).toBe(true);
  });
});