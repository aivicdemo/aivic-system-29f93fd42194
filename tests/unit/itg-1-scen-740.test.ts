import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateSalesActivityData,
  generateCorrectionNotification,
} from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-740: 入力営業データが検証ルール違反時に違反内容と修正指示が検出・通知される", () => {
    // ========================================
    // Precondition: 営業データ品質管理・請求自動化システムにログイン済み
    // Trigger: 検証ルール違反の営業データを入力し検証機能を実行
    // Expected: 違反内容特定 → 修正指示通知 → 修正後再検証で正常化
    // ========================================

    // ★ Step 1: 検証ルール違反の営業データを準備
    // 違反例：必須項目未入力、形式不正、金額妥当性逸脱
    const invalidSalesData = {
      customer_name: "", // 必須項目の未入力（違反）
      contact_date: "2024-13-45", // 日付形式不正（違反）
      deal_content: "テスト商談",
      service_type: "コンサルティング",
      appointment_status: "確定",
      amount: -50000, // 金額が負数（妥当性逸脱・違反）
    };

    const validationRules = {
      customer_name: {
        required: true,
        type: "string",
        min_length: 1,
      },
      contact_date: {
        required: true,
        type: "date",
        format: "YYYY-MM-DD",
      },
      deal_content: {
        required: true,
        type: "string",
      },
      service_type: {
        required: true,
        type: "string",
      },
      appointment_status: {
        required: true,
        type: "enum",
        allowed_values: ["未定", "確定", "キャンセル"],
      },
      amount: {
        required: true,
        type: "number",
        min_value: 0,
        max_value: 10000000,
      },
    };

    // ★ Step 2: データ検証を実行 → 違反内容が特定される
    const validationResult = validateSalesActivityData(
      invalidSalesData,
      validationRules
    );

    // ★ Assertion 1: 違反が検出され、詳細情報が返される
    expect(validationResult.is_valid).toBe(false);
    expect(validationResult.violations).toBeDefined();
    expect(validationResult.violations.length).toBeGreaterThan(0);

    // ★ Assertion 2: 違反内容の詳細確認
    // 違反 1: customer_name が必須なのに空
    const customer_name_violation = validationResult.violations.find(
      (v: any) => v.field === "customer_name"
    );
    expect(customer_name_violation).toBeDefined();
    expect(customer_name_violation.violation_type).toBe("required");
    expect(customer_name_violation.message).toMatch(/顧客名/);

    // 違反 2: contact_date が形式不正
    const contact_date_violation = validationResult.violations.find(
      (v: any) => v.field === "contact_date"
    );
    expect(contact_date_violation).toBeDefined();
    expect(contact_date_violation.violation_type).toBe("format");
    expect(contact_date_violation.message).toMatch(/日付/);

    // 違反 3: amount が負数（妥当性逸脱）
    const amount_violation = validationResult.violations.find(
      (v: any) => v.field === "amount"
    );
    expect(amount_violation).toBeDefined();
    expect(amount_violation.violation_type).toBe("range");
    expect(amount_violation.message).toMatch(/金額/);

    // ★ Step 3: 修正指示通知を生成
    const correction_notification = generateCorrectionNotification(
      invalidSalesData,
      validationResult.violations
    );

    // ★ Assertion 3: 修正指示通知が生成され、内容が適切である
    expect(correction_notification.notification_id).toBeDefined();
    expect(correction_notification.notification_type).toBe("correction_required");
    expect(correction_notification.timestamp).toBeDefined();
    expect(correction_notification.recipient_email).toBeDefined();

    // ★ Assertion 4: 通知に違反項目ごとの修正指示が含まれている
    expect(correction_notification.correction_instructions.length).toBe(3);
    expect(correction_notification.correction_instructions[0]).toEqual({
      field: "customer_name",
      instruction: expect.stringMatching(/顧客名.*必須/),
    });
    expect(correction_notification.correction_instructions[1]).toEqual({
      field: "contact_date",
      instruction: expect.stringMatching(/日付.*形式.*YYYY-MM-DD/),
    });
    expect(correction_notification.correction_instructions[2]).toEqual({
      field: "amount",
      instruction: expect.stringMatching(/金額.*0以上/),
    });

    // ★ Assertion 5: 通知が画面とメール両方で配信対象であることを確認
    expect(correction_notification.delivery_channels).toContain("screen");
    expect(correction_notification.delivery_channels).toContain("email");

    // ★ Step 4: 修正指示に従ってデータを修正
    const corrected_sales_data = {
      customer_name: "○○株式会社", // 修正：顧客名を入力
      contact_date: "2024-01-15", // 修正：正しい日付形式
      deal_content: "テスト商談",
      service_type: "コンサルティング",
      appointment_status: "確定",
      amount: 500000, // 修正：正の金額を入力
    };

    // ★ Step 5: 修正後のデータで再度検証を実行
    const revalidation_result = validateSalesActivityData(
      corrected_sales_data,
      validationRules
    );

    // ★ Assertion 6: 修正後、エラーが解消され正常なデータとして認識される
    expect(revalidation_result.is_valid).toBe(true);
    expect(revalidation_result.violations.length).toBe(0);

    // ★ Assertion 7: 修正後のデータが登録可能な状態であることを確認
    expect(revalidation_result.registration_eligible).toBe(true);
    expect(revalidation_result.status).toBe("ready_for_registration");
  });
});