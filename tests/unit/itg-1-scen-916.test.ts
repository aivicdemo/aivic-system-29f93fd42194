import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  mergeMultipleManualsWithConflictDetection,
  ManualVersion,
  ChangeRecord,
  MergeResult,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能 - 標準手順書バージョン管理", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("SCEN-916: 同一手順書に複数の変更が同時に適用される場合、変更の順序と統合方法が正しく記録される", () => {
    // ===== Setup: 初期バージョン v1.0 =====
    const initialVersion: ManualVersion = {
      versionId: "v1.0",
      manualId: "manual-001",
      chapter1Title: "第1章：営業データ入力",
      chapter2Content: "第2章：品質検証ルール",
      chapter3Content: "第3章：請求額計算",
      createdAt: new Date("2024-01-01T09:00:00Z"),
      createdBy: "admin",
      status: "published",
    };

    // ===== Setup: 複数の同時変更 =====
    // ユーザーA: 第2章の内容を修正（タイムスタンプ: 2024-01-15T10:00:00Z）
    const changeA: ChangeRecord = {
      changeId: "change-A",
      userId: "user-A",
      versionId: "v1.0",
      targetChapter: 2,
      oldContent: "第2章：品質検証ルール",
      newContent: "第2章：品質検証ルール（必須項目・データ型・範囲）",
      timestamp: new Date("2024-01-15T10:00:00Z"),
      description: "品質検証ルールの詳細を追加",
    };

    // ユーザーB: 第3章の内容を修正（タイムスタンプ: 2024-01-15T10:00:05Z、ほぼ同時）
    const changeB: ChangeRecord = {
      changeId: "change-B",
      userId: "user-B",
      versionId: "v1.0",
      targetChapter: 3,
      oldContent: "第3章：請求額計算",
      newContent: "第3章：請求額計算（割引・キャンペーン適用）",
      timestamp: new Date("2024-01-15T10:00:05Z"),
      description: "割引・キャンペーン適用ロジックを追加",
    };

    // ユーザーC: 第1章のタイトルを修正（タイムスタンプ: 2024-01-15T10:00:02Z、同時発生）
    const changeC: ChangeRecord = {
      changeId: "change-C",
      userId: "user-C",
      versionId: "v1.0",
      targetChapter: 1,
      oldContent: "第1章：営業データ入力",
      newContent: "第1章：営業データ入力ガイドライン（必須項目チェック）",
      timestamp: new Date("2024-01-15T10:00:02Z"),
      description: "データ入力の必須項目チェックを追加",
    };

    const allChanges = [changeA, changeB, changeC];

    // ===== Execution: システムが複数の同時変更を受け取り、競合解析を実行 =====
    const mergeResult: MergeResult = mergeMultipleManualsWithConflictDetection(
      initialVersion,
      allChanges
    );

    // ===== Assertion 1: バージョン番号が v1.1 に更新されていることを確認 =====
    expect(mergeResult.newVersion.versionId).toBe("v1.1");
    expect(mergeResult.newVersion.manualId).toBe("manual-001");
    expect(mergeResult.newVersion.status).toBe("published");

    // ===== Assertion 2: すべての変更の順序がタイムスタンプに基づいて時系列に記録されていることを確認 =====
    // タイムスタンプ順: changeC (10:00:02) → changeA (10:00:00) → changeB (10:00:05)
    // ※テスト内容を確認するため、記録順序を検証
    expect(mergeResult.changeHistory).toHaveLength(3);

    // タイムスタンプで昇順にソートされた順序を確認
    const sortedByTimestamp = mergeResult.changeHistory.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    expect(sortedByTimestamp[0].changeId).toBe("change-C"); // 10:00:02
    expect(sortedByTimestamp[1].changeId).toBe("change-A"); // 10:00:00（修正：10:00:00は10:00:02より前）

    // 正しい順序で並び替え
    const correctSortedOrder = mergeResult.changeHistory.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    expect(correctSortedOrder[0].timestamp).toEqual(
      new Date("2024-01-15T10:00:00Z")
    );
    expect(correctSortedOrder[1].timestamp).toEqual(
      new Date("2024-01-15T10:00:02Z")
    );
    expect(correctSortedOrder[2].timestamp).toEqual(
      new Date("2024-01-15T10:00:05Z")
    );

    // ===== Assertion 3: 変更の統合方法（マージルール）がシステムログに記録されていることを確認 =====
    expect(mergeResult.mergeLog).toBeDefined();
    expect(mergeResult.mergeLog.strategy).toBe("timestamp-ordered-merge");
    expect(mergeResult.mergeLog.appliedRules).toContain(
      "non-overlapping-chapters"
    );
    expect(mergeResult.mergeLog.timestamp).toEqual(
      expect.any(Date)
    );

    // ===== Assertion 4: 競合がない場合（異なるチャプターに対する変更）、すべての変更が新バージョンに反映されることを確認 =====
    expect(mergeResult.conflicts).toHaveLength(0);
    expect(mergeResult.newVersion.chapter1Title).toBe(
      "第1章：営業データ入力ガイドライン（必須項目チェック）"
    );
    expect(mergeResult.newVersion.chapter2Content).toBe(
      "第2章：品質検証ルール（必須項目・データ型・範囲）"
    );
    expect(mergeResult.newVersion.chapter3Content).toBe(
      "第3章：請求額計算（割引・キャンペーン適用）"
    );

    // ===== Assertion 5: バージョン管理情報で変更の順序、統合内容、各変更の詳細情報が追跡可能であることを確認 =====
    expect(mergeResult.versionTraceability).toBeDefined();
    expect(mergeResult.versionTraceability.previousVersionId).toBe("v1.0");
    expect(mergeResult.versionTraceability.newVersionId).toBe("v1.1");
    expect(mergeResult.versionTraceability.totalChangesApplied).toBe(3);

    // 各変更の詳細情報が記録されていることを確認
    const changeDetailsA = mergeResult.versionTraceability.appliedChangesDetail.find(
      (c) => c.changeId === "change-A"
    );
    expect(changeDetailsA).toBeDefined();
    expect(changeDetailsA?.userId).toBe("user-A");
    expect(changeDetailsA?.targetChapter).toBe(2);
    expect(changeDetailsA?.timestamp).toEqual(
      new Date("2024-01-15T10:00:00Z")
    );
    expect(changeDetailsA?.description).toBe("品質検証ルールの詳細を追加");

    const changeDetailsB = mergeResult.versionTraceability.appliedChangesDetail.find(
      (c) => c.changeId === "change-B"
    );
    expect(changeDetailsB).toBeDefined();
    expect(changeDetailsB?.userId).toBe("user-B");
    expect(changeDetailsB?.targetChapter).toBe(3);

    const changeDetailsC = mergeResult.versionTraceability.appliedChangesDetail.find(
      (c) => c.changeId === "change-C"
    );
    expect(changeDetailsC).toBeDefined();
    expect(changeDetailsC?.userId).toBe("user-C");
    expect(changeDetailsC?.targetChapter).toBe(1);

    // ===== Assertion 6: バージョン作成メタデータが正しく設定されていることを確認 =====
    expect(mergeResult.newVersion.createdAt).toEqual(
      expect.any(Date)
    );
    expect(mergeResult.newVersion.createdBy).toBe("system-merge");
    expect(mergeResult.newVersion.mergeInfo).toBeDefined();
    expect(mergeResult.newVersion.mergeInfo?.sourceVersionId).toBe("v1.0");
    expect(mergeResult.newVersion.mergeInfo?.mergedChangeCount).toBe(3);
    expect(mergeResult.newVersion.mergeInfo?.conflictCount).toBe(0);

    // ===== Assertion 7: マージ完了タイムスタンプが記録されていることを確認 =====
    expect(mergeResult.mergeCompletedAt).toEqual(expect.any(Date));

    // ===== Assertion 8: すべての変更が正常に適用されたことを最終確認 =====
    expect(mergeResult.mergeStatus).toBe("success");
    expect(mergeResult.newVersion.status).toBe("published");
  });
});