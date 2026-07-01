import { describe, test, expect } from "@jest/globals";
import { validateDiscountRules } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-959: [error] 請求ロジック・割引基準・例外パターンの文書化 - 割引基準の矛盾やルール未定義項目を検出して例外を通知する
  test("割引基準の矛盾やルール未定義項目を検出して例外を通知する", () => {
    // 複数の割引ルール定義（顧客等級別、数量階層別、キャンペーン割引）
    const discountRules = [
      {
        rule_id: "RULE_001",
        rule_type: "customer_grade",
        customer_grade: "A",
        discount_rate: 0.1,
        min_amount: 100000,
        max_amount: 500000,
        priority: 1,
      },
      {
        rule_id: "RULE_002",
        rule_type: "customer_grade",
        customer_grade: "A",
        discount_rate: 0.15,
        min_amount: 500001,
        max_amount: null,
        priority: 2,
      },
      {
        rule_id: "RULE_003",
        rule_type: "quantity_tier",
        product_category: "SERVICE_X",
        min_quantity: 10,
        max_quantity: 50,
        discount_rate: 0.05,
        priority: 3,
      },
      {
        rule_id: "RULE_004",
        rule_type: "quantity_tier",
        product_category: "SERVICE_X",
        min_quantity: 50,
        max_quantity: null,
        discount_rate: null,
        priority: 4,
      },
      {
        rule_id: "RULE_005",
        rule_type: "campaign",
        campaign_code: "SUMMER_2024",
        applicable_services: ["SERVICE_X", "SERVICE_Y"],
        discount_rate: 0.2,
        priority: 5,
      },
      {
        rule_id: "RULE_006",
        rule_type: "campaign",
        campaign_code: "SUMMER_2024",
        applicable_services: ["SERVICE_Y"],
        discount_rate: 0.25,
        priority: null,
      },
    ];

    const salesData = {
      customer_id: "CUST_001",
      customer_grade: "A",
      service_id: "SERVICE_X",
      quantity: 60,
      base_amount: 600000,
      campaign_code: "SUMMER_2024",
    };

    const validationResult = validateDiscountRules(discountRules, salesData);

    // 矛盾検出確認
    expect(validationResult.is_valid).toBe(false);
    expect(validationResult.errors.length).toBeGreaterThan(0);

    // 矛盾内容が明記されているか確認
    const contradictionError = validationResult.errors.find(
      (err: any) => err.error_type === "rule_contradiction"
    );
    expect(contradictionError).toBeDefined();
    expect(contradictionError?.detail).toContain("RULE_001");
    expect(contradictionError?.detail).toContain("RULE_002");
    expect(contradictionError?.message).toMatch(/優先度/);

    // 未定義項目検出確認
    const undefinedError = validationResult.errors.find(
      (err: any) => err.error_type === "undefined_field"
    );
    expect(undefinedError).toBeDefined();
    expect(undefinedError?.detail).toContain("RULE_004");
    expect(undefinedError?.detail).toContain("discount_rate");
    expect(undefinedError?.message).toMatch(/未設定/);

    // 優先度未定義の矛盾検出
    const priorityError = validationResult.errors.find(
      (err: any) => err.error_type === "priority_undefined"
    );
    expect(priorityError).toBeDefined();
    expect(priorityError?.detail).toContain("RULE_006");

    // 例外通知ログの構造確認
    expect(validationResult.exception_log).toBeDefined();
    expect(validationResult.exception_log?.timestamp).toBeTruthy();
    expect(validationResult.exception_log?.detected_at).toMatch(/割引基準/);
    expect(validationResult.exception_log?.error_count).toBeGreaterThanOrEqual(3);

    // 請求処理ステータスが中断状態か確認
    expect(validationResult.billing_process_status).toBe("suspended");

    // エラーハンドリング確認：適用順序未定義のケース
    expect(validationResult.errors.some((err: any) =>
      err.message.includes("適用順序")
    )).toBe(true);

    // エラーハンドリング確認：未定義項目のケース
    expect(validationResult.errors.some((err: any) =>
      err.message.includes("未定義")
    )).toBe(true);

    // 矛盾ルール詳細情報
    const conflictDetails = validationResult.errors.filter(
      (err: any) => err.error_type === "rule_contradiction"
    );
    expect(conflictDetails.length).toBeGreaterThanOrEqual(1);
    conflictDetails.forEach((conflict: any) => {
      expect(conflict.conflicting_rules).toBeDefined();
      expect(Array.isArray(conflict.conflicting_rules)).toBe(true);
      expect(conflict.conflict_reason).toBeTruthy();
    });

    // 管理者への通知フラグ
    expect(validationResult.should_notify_admin).toBe(true);
    expect(validationResult.notification_recipients).toContain("admin");
    expect(validationResult.notification_recipients).toContain("billing_manager");
  });
});