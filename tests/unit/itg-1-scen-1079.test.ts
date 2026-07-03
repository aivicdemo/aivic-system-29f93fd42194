import { validateContractRegistration } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  // SCEN-1079: [error] 契約書登録内容検証機能 - 契約書の登録内容にエラーがある場合に不合格判定される
  test("契約書の登録内容にエラーがある場合は不合格判定とエラーメッセージを返す", () => {
    // 必須項目（契約番号）が空の場合
    const result_missing_contract_no = validateContractRegistration({
      contract_no: "",
      customer_name: "テスト顧客A",
      contract_amount: 100000,
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
    });
    expect(result_missing_contract_no.is_valid).toBe(false);
    expect(result_missing_contract_no.error_message).toMatch(/契約番号/);

    // 必須項目（顧客名）が空の場合
    const result_missing_customer = validateContractRegistration({
      contract_no: "CT-2024-001",
      customer_name: "",
      contract_amount: 100000,
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
    });
    expect(result_missing_customer.is_valid).toBe(false);
    expect(result_missing_customer.error_message).toMatch(/顧客名/);

    // 契約金額に負の数値を入力
    const result_negative_amount = validateContractRegistration({
      contract_no: "CT-2024-001",
      customer_name: "テスト顧客A",
      contract_amount: -50000,
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
    });
    expect(result_negative_amount.is_valid).toBe(false);
    expect(result_negative_amount.error_message).toMatch(/契約金額/);

    // 契約開始日が契約終了日より後の場合
    const result_invalid_date_range = validateContractRegistration({
      contract_no: "CT-2024-001",
      customer_name: "テスト顧客A",
      contract_amount: 100000,
      contract_start_date: "2024-12-31",
      contract_end_date: "2024-01-01",
    });
    expect(result_invalid_date_range.is_valid).toBe(false);
    expect(result_invalid_date_range.error_message).toMatch(/契約期間/);

    // すべての必須項目が正しい場合は合格判定
    const result_valid = validateContractRegistration({
      contract_no: "CT-2024-001",
      customer_name: "テスト顧客A",
      contract_amount: 100000,
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
    });
    expect(result_valid.is_valid).toBe(true);
    expect(result_valid.error_message).toBe("");
  });
});