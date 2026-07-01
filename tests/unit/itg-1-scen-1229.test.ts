import { describe, test, expect } from "@jest/globals";
import { validateContractChangeRequiredFields } from "../../src/logic/it-1781935279444-2-1-1";

describe("契約変更内容の必須項目検証機能", () => {
  // SCEN-1229
  test("変更内容の必須項目がすべて揃っている場合、検証が成功する", () => {
    const input = {
      contract_id: "CONTRACT-001",
      change_amount: 150000,
      effective_date: "2024-02-01",
      change_reason: "サービス追加による料金変更",
      approver: "営業責任者太郎",
    };

    const result = validateContractChangeRequiredFields(input);

    expect(result).toEqual({
      is_valid: true,
      message: "検証に成功しました",
      errors: [],
      can_proceed_to_save: true,
    });
  });

  test("契約金額が未入力の場合、検証が失敗する", () => {
    const input = {
      contract_id: "CONTRACT-001",
      change_amount: null,
      effective_date: "2024-02-01",
      change_reason: "サービス追加による料金変更",
      approver: "営業責任者太郎",
    };

    expect(() => validateContractChangeRequiredFields(input)).toThrow(
      /契約金額/
    );
  });

  test("変更開始日が未入力の場合、検証が失敗する", () => {
    const input = {
      contract_id: "CONTRACT-001",
      change_amount: 150000,
      effective_date: null,
      change_reason: "サービス追加による料金変更",
      approver: "営業責任者太郎",
    };

    expect(() => validateContractChangeRequiredFields(input)).toThrow(
      /変更開始日/
    );
  });

  test("変更理由が未入力の場合、検証が失敗する", () => {
    const input = {
      contract_id: "CONTRACT-001",
      change_amount: 150000,
      effective_date: "2024-02-01",
      change_reason: "",
      approver: "営業責任者太郎",
    };

    expect(() => validateContractChangeRequiredFields(input)).toThrow(
      /変更理由/
    );
  });

  test("承認者が未入力の場合、検証が失敗する", () => {
    const input = {
      contract_id: "CONTRACT-001",
      change_amount: 150000,
      effective_date: "2024-02-01",
      change_reason: "サービス追加による料金変更",
      approver: "",
    };

    expect(() => validateContractChangeRequiredFields(input)).toThrow(
      /承認者/
    );
  });

  test("契約金額が0円の場合、検証が失敗する", () => {
    const input = {
      contract_id: "CONTRACT-001",
      change_amount: 0,
      effective_date: "2024-02-01",
      change_reason: "サービス追加による料金変更",
      approver: "営業責任者太郎",
    };

    expect(() => validateContractChangeRequiredFields(input)).toThrow(
      /契約金額/
    );
  });

  test("変更開始日が過去日付の場合、検証が失敗する", () => {
    const input = {
      contract_id: "CONTRACT-001",
      change_amount: 150000,
      effective_date: "2020-01-01",
      change_reason: "サービス追加による料金変更",
      approver: "営業責任者太郎",
    };

    expect(() => validateContractChangeRequiredFields(input)).toThrow(
      /変更開始日/
    );
  });

  test("複数の必須項目が未入力の場合、最初に検出された項目で失敗する", () => {
    const input = {
      contract_id: "CONTRACT-001",
      change_amount: null,
      effective_date: null,
      change_reason: "",
      approver: "",
    };

    expect(() => validateContractChangeRequiredFields(input)).toThrow(
      /契約金額/
    );
  });

  test("契約IDが未入力の場合、検証が失敗する", () => {
    const input = {
      contract_id: "",
      change_amount: 150000,
      effective_date: "2024-02-01",
      change_reason: "サービス追加による料金変更",
      approver: "営業責任者太郎",
    };

    expect(() => validateContractChangeRequiredFields(input)).toThrow(
      /契約ID/
    );
  });

  test("すべての必須項目が正常に入力されている場合、保存へ進める準備が完了する", () => {
    const input = {
      contract_id: "CONTRACT-002",
      change_amount: 250000,
      effective_date: "2024-03-15",
      change_reason: "契約期間延長に伴う割引適用",
      approver: "営業部長花子",
    };

    const result = validateContractChangeRequiredFields(input);

    expect(result.is_valid).toBe(true);
    expect(result.can_proceed_to_save).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.message).toBe("検証に成功しました");
  });
});