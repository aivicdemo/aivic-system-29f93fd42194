import { validateContractDocumentChange } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-763: 契約書・提案資料変更内容妥当性判定機能 - 適用対象顧客・案件が不正または存在しない場合にエラーとして検出される", () => {
    // テストケース1: 存在しない顧客IDを含む契約書変更内容
    const non_existent_customer_id = "CUST-99999999";
    const contract_change_data_invalid_customer = {
      document_type: "contract",
      customer_id: non_existent_customer_id,
      project_id: "PROJ-001",
      change_content: "契約金額の変更",
      change_date: "2024-01-15",
    };

    expect(() =>
      validateContractDocumentChange(contract_change_data_invalid_customer)
    ).toThrow(/顧客/);

    // テストケース2: 存在しない案件IDを含む提案資料変更内容
    const non_existent_project_id = "PROJ-99999999";
    const proposal_change_data_invalid_project = {
      document_type: "proposal",
      customer_id: "CUST-001",
      project_id: non_existent_project_id,
      change_content: "提案内容の修正",
      change_date: "2024-01-15",
    };

    expect(() =>
      validateContractDocumentChange(proposal_change_data_invalid_project)
    ).toThrow(/案件/);

    // テストケース3: 不正なフォーマットの顧客IDを含むデータ
    const malformed_customer_id = "INVALID-ID-FORMAT-12345";
    const contract_change_data_malformed_customer = {
      document_type: "contract",
      customer_id: malformed_customer_id,
      project_id: "PROJ-001",
      change_content: "契約金額の変更",
      change_date: "2024-01-15",
    };

    expect(() =>
      validateContractDocumentChange(
        contract_change_data_malformed_customer
      )
    ).toThrow(/形式/);

    // テストケース4: 不正なフォーマットの案件IDを含むデータ
    const malformed_project_id = "MALFORMED_PROJECT";
    const proposal_change_data_malformed_project = {
      document_type: "proposal",
      customer_id: "CUST-001",
      project_id: malformed_project_id,
      change_content: "提案内容の修正",
      change_date: "2024-01-15",
    };

    expect(() =>
      validateContractDocumentChange(proposal_change_data_malformed_project)
    ).toThrow(/形式/);

    // テストケース5: 正常な顧客ID・案件IDで成功することを確認
    const valid_contract_change_data = {
      document_type: "contract",
      customer_id: "CUST-001",
      project_id: "PROJ-001",
      change_content: "契約金額の変更",
      change_date: "2024-01-15",
    };

    const result = validateContractDocumentChange(valid_contract_change_data);
    expect(result).toEqual({
      is_valid: true,
      customer_id: "CUST-001",
      project_id: "PROJ-001",
      errors: [],
    });
  });
});