import { validateContractChangeApproval } from "../../src/logic/it-1781935279444-2-1-1";

describe("契約書・提案資料変更内容妥当性判定機能", () => {
  test("SCEN-761: [normal] 変更内容が既存契約と矛盾せず、適用対象顧客・案件が正確である場合に登録可と判定される", () => {
    // 既存契約情報
    const existingContract = {
      contract_id: "CNT-2024-001",
      customer_id: "CUST-001",
      service_type: "営業代行",
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
      contract_value: 1000000,
      payment_terms: "月払い",
      min_contract_period_days: 365,
      discount_rate: 0.1,
    };

    // 変更内容データ
    const changeData = {
      change_item: "契約終了日",
      change_before_value: "2024-12-31",
      change_after_value: "2025-12-31",
      change_reason: "顧客要請による契約延長",
      target_customer_id: "CUST-001",
      target_project_id: "PRJ-2024-100",
    };

    // 適用対象の案件情報
    const targetProject = {
      project_id: "PRJ-2024-100",
      customer_id: "CUST-001",
      service_type: "営業代行",
      project_status: "active",
    };

    // 契約規定（矛盾検証用）
    const contractRules = {
      max_contract_extension_months: 12,
      allowed_change_items: [
        "契約終了日",
        "契約金額",
        "支払い条件",
        "割引率",
      ],
      min_contract_period_days: 365,
    };

    // 変更前後の契約期間を計算
    const change_before_date = new Date("2024-12-31");
    const change_after_date = new Date("2025-12-31");
    const extension_days =
      (change_after_date.getTime() - change_before_date.getTime()) /
      (1000 * 60 * 60 * 24);

    // 実行対象: 変更内容妥当性判定
    const result = validateContractChangeApproval({
      existing_contract: existingContract,
      change_data: changeData,
      target_project: targetProject,
      contract_rules: contractRules,
    });

    // 期待結果: 「登録可」と判定される
    expect(result.approval_status).toBe("APPROVABLE");
    expect(result.approval_message).toBe("登録可");
    expect(result.is_contradiction_free).toBe(true);
    expect(result.is_customer_verified).toBe(true);
    expect(result.is_project_verified).toBe(true);

    // 判定ロジクスの詳細ログ確認
    expect(result.validation_details).toEqual(
      expect.objectContaining({
        change_item_allowed: true,
        extension_days: extension_days,
        extension_within_limit: true,
        customer_match: true,
        project_customer_match: true,
      })
    );

    // ログレコード確認
    expect(result.log_entry).toEqual(
      expect.objectContaining({
        contract_id: "CNT-2024-001",
        change_item: "契約終了日",
        approval_status: "APPROVABLE",
        timestamp: expect.any(String),
        validated_by_system: true,
      })
    );

    // 変更内容と既存契約の矛盾がないことの明示的確認
    expect(result.contradictions).toEqual([]);

    // 適用対象顧客が正確に確認されたことの確認
    expect(result.target_customer_id).toBe("CUST-001");
    expect(result.customer_verified_at).toBeDefined();

    // 適用対象案件が正確に確認されたことの確認
    expect(result.target_project_id).toBe("PRJ-2024-100");
    expect(result.project_verified_at).toBeDefined();
  });
});