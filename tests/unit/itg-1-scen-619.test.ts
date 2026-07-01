import { validateObjectionReason, classifyObjectionRoute, updateObjectionStatus, generateFollowUpTask } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-619: [normal] 異議対応ルート分岐 - 期限延長が正当な異議理由として認識され処理される
  test("期限延長が正当な異議理由として認識され、ルート分岐と後続タスクが正しく処理される", () => {
    // 前提: 異議管理画面にログイン済み、新規異議作成準備完了
    const objectionInput = {
      objectionId: "OBJ-2024-001",
      invoiceId: "INV-202401-0001",
      objectionReason: "期限延長",
      targetInvoiceAmount: 150000,
      extensionPeriodDays: 7,
      extensionReason: "決算締め日の影響により支払い手続きに時間が必要",
      objectionSubmittedAt: new Date("2024-01-15T14:30:00Z"),
      objectionDeadline: new Date("2024-01-22T23:59:59Z"),
    };

    // ステップ1: 異議理由の妥当性チェック処理
    // 期限延長は正当な異議理由であることを検証
    const reasonValidationResult = validateObjectionReason({
      reason: objectionInput.objectionReason,
      invoiceId: objectionInput.invoiceId,
    });
    expect(reasonValidationResult.isValid).toBe(true);
    expect(reasonValidationResult.reason).toBe("期限延長");
    expect(reasonValidationResult.validReasons).toContain("期限延長");

    // ステップ2: 異議処理ルートの分岐判定
    // 期限延長が正当な異議理由として認識され、適切なルートに分岐されることを確認
    const routeClassification = classifyObjectionRoute({
      objectionId: objectionInput.objectionId,
      objectionReason: objectionInput.objectionReason,
      extensionPeriodDays: objectionInput.extensionPeriodDays,
      invoiceAmount: objectionInput.targetInvoiceAmount,
    });
    expect(routeClassification.route).toBe("期限延長処理フロー");
    expect(routeClassification.priority).toBe("normal");
    expect(routeClassification.assignedTeam).toBe("営業オペレーションチーム");

    // ステップ3: 異議ステータス更新
    // 異議ステータスが「受け付け済み」に更新されることを確認
    const statusUpdateResult = updateObjectionStatus({
      objectionId: objectionInput.objectionId,
      currentStatus: "新規",
      newStatus: "受け付け済み",
      updatedAt: new Date("2024-01-15T14:35:00Z"),
      updatedBy: "system_auto_processor",
    });
    expect(statusUpdateResult.objectionId).toBe("OBJ-2024-001");
    expect(statusUpdateResult.previousStatus).toBe("新規");
    expect(statusUpdateResult.currentStatus).toBe("受け付け済み");
    expect(statusUpdateResult.statusChanged).toBe(true);

    // ステップ4: 期限延長対応の後続タスク自動生成
    // 期限延長対応のための次工程タスクが自動生成されることを確認
    const followUpTask = generateFollowUpTask({
      objectionId: objectionInput.objectionId,
      route: "期限延長処理フロー",
      invoiceId: objectionInput.invoiceId,
      extensionPeriodDays: objectionInput.extensionPeriodDays,
      objectionDeadline: objectionInput.objectionDeadline,
    });
    expect(followUpTask.taskId).toBeDefined();
    expect(followUpTask.objectionId).toBe("OBJ-2024-001");
    expect(followUpTask.taskType).toBe("期限延長対応");
    expect(followUpTask.assignedTo).toBe("営業オペレーションチーム");
    expect(followUpTask.dueDate).toEqual(new Date("2024-01-22T23:59:59Z"));
    expect(followUpTask.status).toBe("未開始");
    expect(followUpTask.description).toContain("支払期限を7日間延長");

    // 統合検証: 全体フロー完了の確認
    // 期限延長異議が全工程を正常に完了し、後続処理へ準備完了状態であることを確認
    expect(reasonValidationResult.isValid).toBe(true);
    expect(routeClassification.route).toBe("期限延長処理フロー");
    expect(statusUpdateResult.currentStatus).toBe("受け付け済み");
    expect(followUpTask.status).toBe("未開始");
  });
});