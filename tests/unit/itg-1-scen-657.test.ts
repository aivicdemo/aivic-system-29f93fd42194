import { describe, test, expect, beforeEach } from "@jest/globals";
import { validateGeneratedReportChecklist } from "../../src/logic/it-1781935279444-2-2-1";

describe("自動生成レポート品質チェックリスト検証機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-657
  test("チェックリスト項目が0件の場合に検証スキップまたはエラーとして正しく処理される", () => {
    // ========================================
    // 入力: チェックリスト項目が0件の状態
    // ========================================
    const emptyChecklistInput = {
      reportId: "report-001",
      checklistItems: [],
      reportData: {
        customerId: "cust-001",
        serviceId: "svc-001",
        appointmentCount: 5,
        contractCount: 2,
        generatedAt: "2024-01-15T09:00:00Z",
      },
    };

    // ========================================
    // 実行: 検証処理を実行
    // ========================================
    const result = validateGeneratedReportChecklist(emptyChecklistInput);

    // ========================================
    // 検証1: チェックリスト項目が0件の場合、スキップステータスまたはエラーコードが返されること
    // ========================================
    expect(result).toHaveProperty("status");
    expect(["SKIPPED", "ERROR"]).toContain(result.status);

    // ========================================
    // 検証2: スキップの場合、警告メッセージが表示されること
    // ========================================
    if (result.status === "SKIPPED") {
      expect(result).toHaveProperty("message");
      expect(result.message).toMatch(/チェックリスト項目/);
      expect(result.message).toMatch(/ありません/);
      expect(result.shouldProceed).toBe(true);
    }

    // ========================================
    // 検証3: エラーの場合、適切なエラーコードが返されること
    // ========================================
    if (result.status === "ERROR") {
      expect(result).toHaveProperty("errorCode");
      expect(result.errorCode).toMatch(/ERR_EMPTY_CHECKLIST|ERR_NO_ITEMS/);
      expect(result).toHaveProperty("errorMessage");
      expect(result.errorMessage).toBeTruthy();
      expect(result.shouldProceed).toBe(false);
    }

    // ========================================
    // 検証4: システムがクラッシュせず、ユーザーに対して処理結果が明確に伝わること
    // ========================================
    expect(result).not.toHaveProperty("crash");
    expect(result).toHaveProperty("reportId");
    expect(result.reportId).toBe("report-001");

    // ========================================
    // 検証5: ハッピーパス: 正常なチェックリスト項目がある場合、検証が実行されること
    // ========================================
    const validChecklistInput = {
      reportId: "report-002",
      checklistItems: [
        {
          id: "check-001",
          itemName: "顧客名確認",
          required: true,
          validationRule: "NOT_EMPTY",
        },
        {
          id: "check-002",
          itemName: "金額妥当性確認",
          required: true,
          validationRule: "NUMERIC_RANGE",
        },
      ],
      reportData: {
        customerId: "cust-002",
        serviceId: "svc-002",
        appointmentCount: 3,
        contractCount: 1,
        generatedAt: "2024-01-15T10:00:00Z",
      },
    };

    const validResult = validateGeneratedReportChecklist(validChecklistInput);

    expect(validResult.status).toBe("COMPLETED");
    expect(validResult.itemsChecked).toBe(2);
    expect(validResult.validItemCount).toBeGreaterThanOrEqual(0);
    expect(validResult.shouldProceed).toBe(true);
  });
});