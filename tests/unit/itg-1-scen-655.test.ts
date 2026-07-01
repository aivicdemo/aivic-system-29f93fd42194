import { validateGeneratedReportChecklist } from "../../src/logic/it-1781935279444-2-2-1";

describe("自動生成レポート品質チェックリスト検証機能", () => {
  // SCEN-655
  test("チェックリストのすべての項目が検証されて承認判定が確定される", () => {
    // Arrange: チェックリスト検証対象データ
    const checklistId = "checklist_001";
    const userId = "user_rep_001";
    const executionTimestamp = new Date("2024-01-15T11:00:00Z");

    const checklistData = {
      checklist_id: checklistId,
      user_id: userId,
      execution_timestamp: executionTimestamp,
      check_items: [
        {
          item_id: "item_001",
          item_name: "データ完全性チェック",
          verification_status: "completed",
          check_result: "pass",
          checked_at: new Date("2024-01-15T10:05:00Z"),
        },
        {
          item_id: "item_002",
          item_name: "形式妥当性チェック",
          verification_status: "completed",
          check_result: "pass",
          checked_at: new Date("2024-01-15T10:10:00Z"),
        },
        {
          item_id: "item_003",
          item_name: "数値精度チェック",
          verification_status: "completed",
          check_result: "pass",
          checked_at: new Date("2024-01-15T10:15:00Z"),
        },
        {
          item_id: "item_004",
          item_name: "異常値検出チェック",
          verification_status: "completed",
          check_result: "pass",
          checked_at: new Date("2024-01-15T10:20:00Z"),
        },
      ],
    };

    // Act: チェックリスト検証を実行
    const result = validateGeneratedReportChecklist(checklistData);

    // Assert: 検証結果の確認
    // 1. チェックリスト ID が正確に記録されている
    expect(result.checklist_id).toBe("checklist_001");

    // 2. 全チェック項目数が正確に反映されている
    expect(result.total_check_items).toBe(4);

    // 3. すべてのチェック項目が完了状態として記録されている
    expect(result.completed_items_count).toBe(4);

    // 4. 完了率が 100% となっている
    expect(result.completion_rate).toBe(100);

    // 5. すべてのチェック項目が検証に合格している
    expect(result.all_items_passed).toBe(true);

    // 6. 不合格項目が 0 件である
    expect(result.failed_items_count).toBe(0);

    // 7. 承認判定が可能な状態（承認ボタン有効）となっている
    expect(result.approval_button_enabled).toBe(true);

    // 8. 承認判定ステータスが未承認から承認済みに変更されている
    expect(result.approval_status).toBe("approved");

    // 9. 承認確定日時が正確に記録されている
    expect(result.approval_confirmed_at).toEqual(
      new Date("2024-01-15T11:00:00Z")
    );

    // 10. 承認実行者のユーザー ID が正確に記録されている
    expect(result.approved_by_user_id).toBe("user_rep_001");

    // 11. チェックリスト全体のステータスが「承認済み」を示す
    expect(result.checklist_status).toBe("approved");

    // 12. 各チェック項目の検証状態が正確に記録されている
    expect(result.check_items_details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          item_id: "item_001",
          item_name: "データ完全性チェック",
          verification_status: "completed",
          check_result: "pass",
        }),
        expect.objectContaining({
          item_id: "item_002",
          item_name: "形式妥当性チェック",
          verification_status: "completed",
          check_result: "pass",
        }),
        expect.objectContaining({
          item_id: "item_003",
          item_name: "数値精度チェック",
          verification_status: "completed",
          check_result: "pass",
        }),
        expect.objectContaining({
          item_id: "item_004",
          item_name: "異常値検出チェック",
          verification_status: "completed",
          check_result: "pass",
        }),
      ])
    );

    // 13. 承認判定の確定情報が履歴として記録されている
    expect(result.approval_confirmation_record).toBeDefined();
    expect(result.approval_confirmation_record.confirmed_timestamp).toEqual(
      new Date("2024-01-15T11:00:00Z")
    );
    expect(result.approval_confirmation_record.confirmed_by).toBe(
      "user_rep_001"
    );

    // 14. チェックリスト一覧で表示されるステータスが更新されている
    expect(result.list_display_status).toBe("承認済み");

    // 15. チェック項目すべてが検証完了フラグを持っている
    const allItemsVerified = result.check_items_details.every(
      (item) => item.verification_status === "completed"
    );
    expect(allItemsVerified).toBe(true);
  });
});