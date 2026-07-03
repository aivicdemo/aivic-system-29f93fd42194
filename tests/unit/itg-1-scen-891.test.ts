import { describe, test, expect } from "@jest/globals";
import { validateBillingChecklistItems } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  // SCEN-891: [edge] 請求書作成チェックリスト検証機能 - 必須項目のみ不備で残りは完了している場合に処理が停止される
  test("必須項目に不備がある場合、処理を停止し不足項目を特定する", () => {
    const billingChecklistData = {
      customer_name: "",
      billing_amount: 150000,
      billing_date: "2024-01-15",
      service_name: "コンサルティング",
      contract_id: "CTR-2024-001",
      payment_terms: "30日",
      tax_rate: 0.1,
      remarks: "Q1キャンペーン適用",
      approved_by: "営業代表",
      created_at: "2024-01-10T09:00:00Z",
    };

    const result = validateBillingChecklistItems(billingChecklistData);

    expect(result.is_valid).toBe(false);
    expect(result.missing_required_items).toContain("customer_name");
    expect(result.error_message).toMatch(/顧客名/);
    expect(result.should_proceed_to_next_step).toBe(false);
  });

  test("必須項目が複数不備の場合、全不足項目を特定する", () => {
    const billingChecklistData = {
      customer_name: "",
      billing_amount: 0,
      billing_date: "",
      service_name: "サポートサービス",
      contract_id: "CTR-2024-002",
      payment_terms: "60日",
      tax_rate: 0.1,
      remarks: "",
      approved_by: "営業オペレーター",
      created_at: "2024-01-12T14:30:00Z",
    };

    const result = validateBillingChecklistItems(billingChecklistData);

    expect(result.is_valid).toBe(false);
    expect(result.missing_required_items.length).toBeGreaterThanOrEqual(3);
    expect(result.missing_required_items).toContain("customer_name");
    expect(result.missing_required_items).toContain("billing_amount");
    expect(result.missing_required_items).toContain("billing_date");
    expect(result.should_proceed_to_next_step).toBe(false);
  });

  test("必須項目がすべて完備された場合、処理を続行する", () => {
    const billingChecklistData = {
      customer_name: "ABC株式会社",
      billing_amount: 250000,
      billing_date: "2024-01-20",
      service_name: "システム開発",
      contract_id: "CTR-2024-003",
      payment_terms: "45日",
      tax_rate: 0.1,
      remarks: "",
      approved_by: "代表取締役",
      created_at: "2024-01-15T10:00:00Z",
    };

    const result = validateBillingChecklistItems(billingChecklistData);

    expect(result.is_valid).toBe(true);
    expect(result.missing_required_items.length).toBe(0);
    expect(result.should_proceed_to_next_step).toBe(true);
  });

  test("必須項目のうち請求金額がゼロまたは負値の場合、不備として検出する", () => {
    const billingChecklistData = {
      customer_name: "XYZ有限会社",
      billing_amount: -50000,
      billing_date: "2024-01-22",
      service_name: "コンサルティング",
      contract_id: "CTR-2024-004",
      payment_terms: "30日",
      tax_rate: 0.1,
      remarks: "割引適用",
      approved_by: "営業責任者",
      created_at: "2024-01-16T11:15:00Z",
    };

    const result = validateBillingChecklistItems(billingChecklistData);

    expect(result.is_valid).toBe(false);
    expect(result.missing_required_items).toContain("billing_amount");
    expect(result.error_message).toMatch(/請求金額/);
    expect(result.should_proceed_to_next_step).toBe(false);
  });

  test("必須項目のうち請求日が不正な形式の場合、不備として検出する", () => {
    const billingChecklistData = {
      customer_name: "DEF企業",
      billing_amount: 300000,
      billing_date: "2024/13/40",
      service_name: "研修サービス",
      contract_id: "CTR-2024-005",
      payment_terms: "60日",
      tax_rate: 0.1,
      remarks: "",
      approved_by: "営業代表",
      created_at: "2024-01-17T13:45:00Z",
    };

    const result = validateBillingChecklistItems(billingChecklistData);

    expect(result.is_valid).toBe(false);
    expect(result.missing_required_items).toContain("billing_date");
    expect(result.error_message).toMatch(/請求日/);
    expect(result.should_proceed_to_next_step).toBe(false);
  });

  test("非必須項目が空白でも必須項目が完備されていれば処理は続行される", () => {
    const billingChecklistData = {
      customer_name: "GHI会社",
      billing_amount: 180000,
      billing_date: "2024-01-25",
      service_name: "",
      contract_id: "CTR-2024-006",
      payment_terms: "",
      tax_rate: 0.1,
      remarks: "",
      approved_by: "",
      created_at: "2024-01-18T15:20:00Z",
    };

    const result = validateBillingChecklistItems(billingChecklistData);

    expect(result.is_valid).toBe(true);
    expect(result.missing_required_items.length).toBe(0);
    expect(result.should_proceed_to_next_step).toBe(true);
  });

  test("エラーメッセージには不足している必須項目の詳細リストが含まれる", () => {
    const billingChecklistData = {
      customer_name: "",
      billing_amount: 0,
      billing_date: "",
      service_name: "保守サービス",
      contract_id: "CTR-2024-007",
      payment_terms: "90日",
      tax_rate: 0.1,
      remarks: "年間契約",
      approved_by: "営業管理者",
      created_at: "2024-01-19T16:00:00Z",
    };

    const result = validateBillingChecklistItems(billingChecklistData);

    expect(result.is_valid).toBe(false);
    expect(result.error_message).toBeDefined();
    expect(result.error_message.length).toBeGreaterThan(0);
    expect(result.detailed_validation_errors).toBeDefined();
    expect(Array.isArray(result.detailed_validation_errors)).toBe(true);
  });
});