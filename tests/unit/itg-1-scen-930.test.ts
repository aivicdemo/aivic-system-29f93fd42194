import { describe, test, expect } from "@jest/globals";
import {
  createStandardProcedureNewVersion,
  recordChangeHistory,
  identifyLatestVersion,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能 - 手順書バージョン管理・自動特定", () => {
  test("SCEN-930: 標準手順書の新バージョンが作成され、変更履歴が記録され、最新版が自動特定される", () => {
    // ===== Setup: 既存の標準手順書 =====
    const existingProcedureId = "PROC-001";
    const existingVersionNumber = 1;
    const existingCreatedAt = new Date("2024-01-01T09:00:00Z");
    const existingCreatedBy = "user_admin_01";

    // ===== Input: 新バージョン作成のパラメータ =====
    const newVersionInput = {
      procedureId: existingProcedureId,
      baseVersionNumber: existingVersionNumber,
      editedContent: {
        title: "月次締め業務標準手順書",
        steps: [
          {
            stepNumber: 1,
            description: "営業システムからデータを抽出する",
          },
          {
            stepNumber: 2,
            description: "営業データ品質チェックを実行する（新規ステップ）",
          },
          {
            stepNumber: 3,
            description: "請求対象項目を確認する（修正内容）",
          },
        ],
      },
      changeReason:
        "月次締め日の業務フローを明確化し、新規ステップを追加しました。",
      createdAt: new Date("2024-02-15T10:30:00Z"),
      createdBy: "user_manager_02",
    };

    // ===== Step 1: 新バージョンを作成する =====
    const createResult = createStandardProcedureNewVersion(newVersionInput);

    // ===== Assertion: 新バージョンが正しく作成されたか =====
    expect(createResult).toBeDefined();
    expect(createResult.versionNumber).toBe(2);
    expect(createResult.procedureId).toBe(existingProcedureId);
    expect(createResult.content).toEqual(newVersionInput.editedContent);
    expect(createResult.createdAt).toEqual(
      new Date("2024-02-15T10:30:00Z").toISOString()
    );
    expect(createResult.createdBy).toBe("user_manager_02");

    // ===== Step 2: 変更履歴を記録する =====
    const changeHistoryInput = {
      procedureId: existingProcedureId,
      versionNumber: createResult.versionNumber,
      changeReason: newVersionInput.changeReason,
      changedFields: ["steps[1]", "steps[2].description"],
      createdAt: newVersionInput.createdAt,
      createdBy: newVersionInput.createdBy,
    };

    const changeHistoryResult = recordChangeHistory(changeHistoryInput);

    // ===== Assertion: 変更履歴が正しく記録されたか =====
    expect(changeHistoryResult).toBeDefined();
    expect(changeHistoryResult.procedureId).toBe(existingProcedureId);
    expect(changeHistoryResult.versionNumber).toBe(2);
    expect(changeHistoryResult.changeReason).toBe(
      "月次締め日の業務フローを明確化し、新規ステップを追加しました。"
    );
    expect(changeHistoryResult.changedFields).toEqual([
      "steps[1]",
      "steps[2].description",
    ]);
    expect(changeHistoryResult.recordedAt).toEqual(
      new Date("2024-02-15T10:30:00Z").toISOString()
    );
    expect(changeHistoryResult.recordedBy).toBe("user_manager_02");

    // ===== Step 3: 複数バージョンから最新版を自動特定する =====
    const allVersions = [
      {
        procedureId: existingProcedureId,
        versionNumber: 1,
        createdAt: new Date("2024-01-01T09:00:00Z").toISOString(),
        createdBy: "user_admin_01",
      },
      {
        procedureId: existingProcedureId,
        versionNumber: 2,
        createdAt: new Date("2024-02-15T10:30:00Z").toISOString(),
        createdBy: "user_manager_02",
      },
    ];

    const latestVersionResult = identifyLatestVersion({
      procedureId: existingProcedureId,
      versions: allVersions,
    });

    // ===== Assertion: 最新版が正しく特定されたか =====
    expect(latestVersionResult).toBeDefined();
    expect(latestVersionResult.latestVersionNumber).toBe(2);
    expect(latestVersionResult.latestCreatedAt).toBe(
      new Date("2024-02-15T10:30:00Z").toISOString()
    );
    expect(latestVersionResult.latestCreatedBy).toBe("user_manager_02");
    expect(latestVersionResult.previousVersionNumber).toBe(1);
    expect(latestVersionResult.totalVersionCount).toBe(2);

    // ===== Assertion: 新バージョンが表示対象として選択されるか =====
    expect(latestVersionResult.isLatestVersionForDisplay).toBe(true);

    // ===== Assertion: 複数バージョンの場合の正確性 =====
    expect(latestVersionResult.latestVersionNumber).toBeGreaterThan(
      latestVersionResult.previousVersionNumber
    );
  });
});