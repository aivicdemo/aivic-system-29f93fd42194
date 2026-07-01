import { describe, test, expect } from "@jest/globals";
import {
  determineEffectiveDocumentVersion,
} from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-770: 複数バージョンが同一有効期限を持つ場合にエラーまたは優先順位適用", () => {
    // テストデータ: 同一顧客ID、案件ID、資料種別で複数バージョン
    const customerId = "CUST-001";
    const projectId = "PROJ-001";
    const documentType = "proposal";
    const commonEffectiveDate = "2024-12-31";

    const versions = [
      {
        versionId: "v1-001",
        versionNumber: 1.0,
        customerId,
        projectId,
        documentType,
        effectiveStartDate: "2024-01-01",
        effectiveEndDate: commonEffectiveDate,
        createdAt: "2024-06-01T10:00:00Z",
        status: "active",
      },
      {
        versionId: "v2-001",
        versionNumber: 2.0,
        customerId,
        projectId,
        documentType,
        effectiveStartDate: "2024-01-01",
        effectiveEndDate: commonEffectiveDate,
        createdAt: "2024-07-15T14:30:00Z",
        status: "active",
      },
      {
        versionId: "v3-001",
        versionNumber: 3.0,
        customerId,
        projectId,
        documentType,
        effectiveStartDate: "2024-01-01",
        effectiveEndDate: commonEffectiveDate,
        createdAt: "2024-08-20T09:45:00Z",
        status: "active",
      },
    ];

    const result = determineEffectiveDocumentVersion({
      customerId,
      projectId,
      documentType,
      versions,
      referenceDate: "2024-09-01",
    });

    // 期待結果: 最新のバージョン番号（v3.0）が有効と判定されるか、
    // またはシステムエラーを発生させるか明確な優先順位ルール適用結果
    expect(result).toBeDefined();

    // ケース1: システムが優先順位ルールを適用し、最新バージョンを選択
    if (result.errorCode === null) {
      expect(result.effectiveVersionId).toBe("v3-001");
      expect(result.effectiveVersionNumber).toBe(3.0);
      expect(result.priorityRule).toBe("highest_version_number");
      expect(result.conflictResolved).toBe(true);
    }
    // ケース2: システムがエラーを発生させる
    else if (result.errorCode === "AMBIGUOUS_EFFECTIVE_VERSION") {
      expect(result.errorMessage).toMatch(/有効期限/);
      expect(result.conflictingVersionIds).toEqual([
        "v1-001",
        "v2-001",
        "v3-001",
      ]);
      expect(result.recommendedAction).toBe("manual_review_required");
    }
    // ケース3: 作成日時が最新のものを優先
    else if (result.errorCode === null && result.priorityRule === "latest_created_at") {
      expect(result.effectiveVersionId).toBe("v3-001");
      expect(result.effectiveVersionNumber).toBe(3.0);
      expect(result.conflictResolved).toBe(true);
    }

    // 共通の検証: 結果は明確で曖昧な状態ではないこと
    expect(
      result.errorCode === null ||
        result.errorCode === "AMBIGUOUS_EFFECTIVE_VERSION"
    ).toBe(true);

    // ユーザーに対して結果またはエラーメッセージが明確に示されること
    if (result.errorCode === null) {
      expect(result.effectiveVersionId).toBeDefined();
      expect(result.effectiveVersionNumber).toBeDefined();
      expect(result.priorityRule).toBeDefined();
    } else {
      expect(result.errorMessage).toBeDefined();
      expect(result.errorMessage.length).toBeGreaterThan(0);
    }

    // ログに優先順位適用結果が記録されていることを確認
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.length).toBeGreaterThan(0);
    expect(result.auditLog[0]).toHaveProperty("timestamp");
    expect(result.auditLog[0]).toHaveProperty("action");
    expect(
      result.auditLog[0].action === "priority_rule_applied" ||
        result.auditLog[0].action === "ambiguity_detected"
    ).toBe(true);
  });
});