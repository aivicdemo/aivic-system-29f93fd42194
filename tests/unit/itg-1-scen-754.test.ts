import { validateContractChangeValidity } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-754: [normal] 契約書・提案資料の変更内容妥当性判定 - 変更内容が既存契約条項と矛盾しない場合に登録可能と判定される
  test("既存契約条項と矛盾しない軽微な変更は承認ステータスで登録可能と判定される", () => {
    const existing_contract = {
      contract_id: "CTR-001",
      customer_id: "CUST-001",
      base_unit_price: 10000,
      quantity: 100,
      delivery_date: "2024-12-31",
      discount_rate: 0.1,
      payment_terms: "Net 30",
    };

    const change_content = {
      contract_id: "CTR-001",
      field_name: "unit_price",
      old_value: 10000,
      new_value: 10500,
      change_reason: "市場変動に対応した軽微な価格調整",
      change_date: "2024-11-15",
    };

    const result = validateContractChangeValidity(
      existing_contract,
      change_content
    );

    expect(result.validity_status).toBe("承認");
    expect(result.is_registerable).toBe(true);
    expect(result.error_message).toBe("");
  });
});