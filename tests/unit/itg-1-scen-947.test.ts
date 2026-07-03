import { describe, test, expect, beforeEach } from "@jest/globals";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-947: 割引基準が未定義の契約データに対してデフォルト割引率を適用してマニュアルを生成", async () => {
    const { generateBillingManualWithDefaultDiscount } = await import(
      "../../src/logic/it-1-2-1"
    );

    // テストデータ: 割引基準が未定義の契約データ
    const contract_data = {
      contract_id: "CONT-2024-001",
      customer_id: "CUST-A01",
      service_id: "SVC-PREMIUM",
      contract_amount: 100000,
      discount_rate_defined: false, // 割引基準が未定義
      discount_rate: null,
      created_at: new Date("2024-01-01T00:00:00Z"),
      updated_at: new Date("2024-01-15T00:00:00Z"),
    };

    // 営業データ: 請求対象項目
    const sales_data = {
      sales_id: "SALES-2024-001",
      customer_id: "CUST-A01",
      service_id: "SVC-PREMIUM",
      appointment_count: 10,
      contract_count: 5,
      monthly_revenue: 50000,
      period: "2024-01",
    };

    // システムパラメータ: デフォルト割引率
    const system_config = {
      default_discount_rate: 0.1, // 10%
      minimum_billing_amount: 1000,
      billing_period: "2024-01",
    };

    // 関数を実行
    const result = await generateBillingManualWithDefaultDiscount({
      contract: contract_data,
      sales: sales_data,
      config: system_config,
    });

    // 1. デフォルト割引率が適用されていることを確認
    expect(result.applied_discount_rate).toBe(0.1);

    // 2. 割引率が適用されたことを明示的に表示
    expect(result.discount_applied_flag).toBe(true);
    expect(result.discount_source).toBe("DEFAULT");

    // 3. 請求額の計算検証
    // 基本額 = 月間売上 (50000) × 契約件数比率 (5/10 = 0.5) = 25000
    // 割引後 = 25000 × (1 - 0.1) = 22500
    const base_billing_amount = sales_data.monthly_revenue * (sales_data.contract_count / sales_data.appointment_count);
    const discounted_billing_amount = base_billing_amount * (1 - system_config.default_discount_rate);
    expect(result.base_billing_amount).toBe(25000);
    expect(result.discounted_billing_amount).toBe(22500);
    expect(result.final_billing_amount).toBe(22500);

    // 4. マニュアルが生成されていることを確認
    expect(result.manual_generated).toBe(true);
    expect(result.manual_content).toBeDefined();

    // 5. マニュアルにデフォルト割引率が明記されていることを確認
    expect(result.manual_content.discount_rate_note).toContain("10%");
    expect(result.manual_content.discount_rate_note).toContain("DEFAULT");
    expect(result.manual_content.discount_reason).toContain("未定義");

    // 6. マニュアルが正しい構造を持つことを確認
    expect(result.manual_content.contract_id).toBe("CONT-2024-001");
    expect(result.manual_content.customer_id).toBe("CUST-A01");
    expect(result.manual_content.service_id).toBe("SVC-PREMIUM");
    expect(result.manual_content.billing_period).toBe("2024-01");
    expect(result.manual_content.base_amount).toBe(25000);
    expect(result.manual_content.discount_amount).toBe(2500); // 25000 * 0.1
    expect(result.manual_content.final_amount).toBe(22500);

    // 7. ダウンロード可能な状態であることを確認
    expect(result.manual_downloadable).toBe(true);
    expect(result.manual_file_format).toBe("PDF");
    expect(result.manual_file_name).toMatch(/SCEN-947-CONT-2024-001-2024-01/);
    expect(result.manual_file_generated_at).toBeDefined();

    // 8. 監査ログに記録されていることを確認
    expect(result.audit_log).toBeDefined();
    expect(result.audit_log.action).toBe("GENERATE_MANUAL_WITH_DEFAULT_DISCOUNT");
    expect(result.audit_log.timestamp).toBeDefined();
    expect(result.audit_log.default_discount_applied).toBe(true);
  });
});