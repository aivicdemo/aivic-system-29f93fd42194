import { validateGeneratedReportQualityChecklist } from "../../src/logic/it-1781935279444-2-2-1";

describe("自動生成レポート品質チェック検証機能", () => {
  // SCEN-667: [normal] 自動生成レポート品質チェック検証機能 - チェックリストのすべての項目が検証され、承認または差戻しが正確に判定される
  test("チェックリストのすべての項目が検証され、承認または差戻しが正確に判定される", () => {
    // ===== 承認ケース: すべてのチェックリスト項目が検証成功 =====
    const approval_checklist_items = [
      {
        item_id: "CHK_001",
        item_name: "営業データ完全性確認",
        validation_logic: "必須項目のすべてが入力されているか",
        is_passed: true,
        checked_value: 15,
        expected_value: 15,
      },
      {
        item_id: "CHK_002",
        item_name: "顧客別集計値の妥当性",
        validation_logic: "顧客ごとの合計が契約内容と一致するか",
        is_passed: true,
        checked_value: 250000,
        expected_value: 250000,
      },
      {
        item_id: "CHK_003",
        item_name: "請求額計算の正確性",
        validation_logic: "請求額計算式が正確に適用されているか",
        is_passed: true,
        checked_value: 500000,
        expected_value: 500000,
      },
      {
        item_id: "CHK_004",
        item_name: "割引ルール適用確認",
        validation_logic: "契約条件に基づく割引が正確に適用されているか",
        is_passed: true,
        checked_value: 50000,
        expected_value: 50000,
      },
      {
        item_id: "CHK_005",
        item_name: "レポートフォーマット確認",
        validation_logic: "レポートが標準テンプレートに準拠しているか",
        is_passed: true,
        checked_value: 1,
        expected_value: 1,
      },
    ];

    const approval_report = {
      report_id: "RPT_202401_001",
      generated_at: new Date("2024-01-15T10:00:00Z"),
      report_type: "monthly_summary",
      customer_id: "CUST_001",
      checklist_items: approval_checklist_items,
    };

    const approval_result = validateGeneratedReportQualityChecklist(
      approval_report
    );

    expect(approval_result.validation_status).toBe("passed");
    expect(approval_result.judgment).toBe("approval");
    expect(approval_result.passed_count).toBe(5);
    expect(approval_result.failed_count).toBe(0);
    expect(approval_result.total_count).toBe(5);
    expect(approval_result.approval_status).toBe("approved");
    expect(approval_result.approval_timestamp).toEqual(
      expect.any(Date)
    );
    expect(approval_result.validation_history).toHaveLength(1);
    expect(approval_result.validation_history[0].report_id).toBe(
      "RPT_202401_001"
    );
    expect(approval_result.validation_history[0].status).toBe("approved");
    expect(approval_result.validation_history[0].failed_reasons).toEqual([]);

    // ===== 差戻しケース: 一部のチェックリスト項目が検証失敗 =====
    const rejection_checklist_items = [
      {
        item_id: "CHK_001",
        item_name: "営業データ完全性確認",
        validation_logic: "必須項目のすべてが入力されているか",
        is_passed: false,
        checked_value: 14,
        expected_value: 15,
      },
      {
        item_id: "CHK_002",
        item_name: "顧客別集計値の妥当性",
        validation_logic: "顧客ごとの合計が契約内容と一致するか",
        is_passed: true,
        checked_value: 250000,
        expected_value: 250000,
      },
      {
        item_id: "CHK_003",
        item_name: "請求額計算の正確性",
        validation_logic: "請求額計算式が正確に適用されているか",
        is_passed: false,
        checked_value: 480000,
        expected_value: 500000,
      },
      {
        item_id: "CHK_004",
        item_name: "割引ルール適用確認",
        validation_logic: "契約条件に基づく割引が正確に適用されているか",
        is_passed: true,
        checked_value: 50000,
        expected_value: 50000,
      },
      {
        item_id: "CHK_005",
        item_name: "レポートフォーマット確認",
        validation_logic: "レポートが標準テンプレートに準拠しているか",
        is_passed: true,
        checked_value: 1,
        expected_value: 1,
      },
    ];

    const rejection_report = {
      report_id: "RPT_202401_002",
      generated_at: new Date("2024-01-15T11:30:00Z"),
      report_type: "monthly_summary",
      customer_id: "CUST_002",
      checklist_items: rejection_checklist_items,
    };

    const rejection_result = validateGeneratedReportQualityChecklist(
      rejection_report
    );

    expect(rejection_result.validation_status).toBe("failed");
    expect(rejection_result.judgment).toBe("rejection");
    expect(rejection_result.passed_count).toBe(3);
    expect(rejection_result.failed_count).toBe(2);
    expect(rejection_result.total_count).toBe(5);
    expect(rejection_result.approval_status).toBe("rejected");
    expect(rejection_result.rejection_timestamp).toEqual(
      expect.any(Date)
    );
    expect(rejection_result.validation_history).toHaveLength(1);
    expect(rejection_result.validation_history[0].report_id).toBe(
      "RPT_202401_002"
    );
    expect(rejection_result.validation_history[0].status).toBe("rejected");
    expect(rejection_result.validation_history[0].failed_reasons).toEqual([
      {
        item_id: "CHK_001",
        item_name: "営業データ完全性確認",
        reason: "必須項目が不足しています",
        checked_value: 14,
        expected_value: 15,
      },
      {
        item_id: "CHK_003",
        item_name: "請求額計算の正確性",
        reason: "計算結果が期待値と一致しません",
        checked_value: 480000,
        expected_value: 500000,
      },
    ]);

    // ===== チェックリスト項目が5項目以上であることを確認 =====
    expect(approval_checklist_items.length).toBeGreaterThanOrEqual(5);
    expect(rejection_checklist_items.length).toBeGreaterThanOrEqual(5);

    // ===== 検証ロジックが実行されたことを確認 =====
    expect(approval_result.validation_executed).toBe(true);
    expect(rejection_result.validation_executed).toBe(true);

    // ===== 承認時のステータス記録確認 =====
    expect(approval_result.approval_status).toBe("approved");
    expect(approval_result.approval_timestamp).toBeDefined();
    expect(typeof approval_result.approval_timestamp).toBe("object");

    // ===== 差戻し時のステータスと失敗理由記録確認 =====
    expect(rejection_result.approval_status).toBe("rejected");
    expect(rejection_result.rejection_timestamp).toBeDefined();
    expect(typeof rejection_result.rejection_timestamp).toBe("object");
    expect(rejection_result.validation_history[0].failed_reasons.length).toBe(
      2
    );

    // ===== 検証履歴が正確に保存されていることを確認 =====
    expect(approval_result.validation_history[0].report_id).toBe(
      "RPT_202401_001"
    );
    expect(approval_result.validation_history[0].status).toBe("approved");
    expect(
      typeof approval_result.validation_history[0].validation_completed_at
    ).toBe("object");

    expect(rejection_result.validation_history[0].report_id).toBe(
      "RPT_202401_002"
    );
    expect(rejection_result.validation_history[0].status).toBe("rejected");
    expect(
      typeof rejection_result.validation_history[0].validation_completed_at
    ).toBe("object");
  });
});