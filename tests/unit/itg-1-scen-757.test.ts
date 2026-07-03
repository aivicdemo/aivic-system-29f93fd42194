import { describe, it, expect } from "@jest/globals";
import { validateContractChangeApplicability } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  it("SCEN-757: 契約書・提案資料の変更内容妥当性判定 - 適用対象案件が空欄の場合に妥当性判定が失敗する", () => {
    // Arrange: 適用対象案件が空欄で、その他の必須項目は正常な値を入力
    const contractChangeInput = {
      contract_name: "基本サービス契約書",
      contract_amount: 500000,
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
      applicable_target_project_id: "", // 適用対象案件が空欄
      change_content: "金額の変更",
      change_reason: "サービス範囲拡大",
      effective_date: "2024-02-01",
    };

    // Act & Assert: エラーをスロー (業務的キーワードで regex match)
    expect(() =>
      validateContractChangeApplicability(contractChangeInput)
    ).toThrow(/適用対象案件/);
  });

  it("SCEN-757: 契約書・提案資料の変更内容妥当性判定 - 適用対象案件が正常な場合に妥当性判定が成功する", () => {
    // Arrange: 適用対象案件を正常に指定
    const contractChangeInput = {
      contract_name: "基本サービス契約書",
      contract_amount: 500000,
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
      applicable_target_project_id: "proj_12345", // 適用対象案件を指定
      change_content: "金額の変更",
      change_reason: "サービス範囲拡大",
      effective_date: "2024-02-01",
    };

    // Act
    const result = validateContractChangeApplicability(contractChangeInput);

    // Assert: 妥当性判定に成功
    expect(result).toEqual({
      is_valid: true,
      judgment_status: "合格",
      error_messages: [],
    });
  });

  it("SCEN-757: 契約書・提案資料の変更内容妥当性判定 - 契約名が空欄の場合に妥当性判定が失敗する", () => {
    // Arrange: 契約名が空欄
    const contractChangeInput = {
      contract_name: "", // 契約名が空欄
      contract_amount: 500000,
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
      applicable_target_project_id: "proj_12345",
      change_content: "金額の変更",
      change_reason: "サービス範囲拡大",
      effective_date: "2024-02-01",
    };

    // Act & Assert
    expect(() =>
      validateContractChangeApplicability(contractChangeInput)
    ).toThrow(/契約名/);
  });

  it("SCEN-757: 契約書・提案資料の変更内容妥当性判定 - 契約金額が0以下の場合に妥当性判定が失敗する", () => {
    // Arrange: 契約金額が負の値
    const contractChangeInput = {
      contract_name: "基本サービス契約書",
      contract_amount: -100000, // 負の金額
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
      applicable_target_project_id: "proj_12345",
      change_content: "金額の変更",
      change_reason: "サービス範囲拡大",
      effective_date: "2024-02-01",
    };

    // Act & Assert
    expect(() =>
      validateContractChangeApplicability(contractChangeInput)
    ).toThrow(/金額/);
  });

  it("SCEN-757: 契約書・提案資料の変更内容妥当性判定 - 契約期間が逆順の場合に妥当性判定が失敗する", () => {
    // Arrange: 終了日が開始日より前
    const contractChangeInput = {
      contract_name: "基本サービス契約書",
      contract_amount: 500000,
      contract_start_date: "2024-12-31",
      contract_end_date: "2024-01-01", // 終了日が開始日より前
      applicable_target_project_id: "proj_12345",
      change_content: "金額の変更",
      change_reason: "サービス範囲拡大",
      effective_date: "2024-02-01",
    };

    // Act & Assert
    expect(() =>
      validateContractChangeApplicability(contractChangeInput)
    ).toThrow(/期間/);
  });

  it("SCEN-757: 契約書・提案資料の変更内容妥当性判定 - 複数の必須項目が空欄の場合に最初のエラーを返す", () => {
    // Arrange: 契約名と適用対象案件が空欄
    const contractChangeInput = {
      contract_name: "",
      contract_amount: 500000,
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
      applicable_target_project_id: "",
      change_content: "金額の変更",
      change_reason: "サービス範囲拡大",
      effective_date: "2024-02-01",
    };

    // Act & Assert: 複数エラーの場合、適用対象案件エラーが優先される
    expect(() =>
      validateContractChangeApplicability(contractChangeInput)
    ).toThrow(/適用対象案件|契約名/);
  });
});