import { describe, test, expect } from "@jest/globals";
import { recordContractChange } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証 - 契約変更通知の必須項目バリデーション", () => {
  // SCEN-862: [error] 契約変更内容の標準化記録機能 - 必須項目が不足した契約変更通知が記録時にバリデーションエラーで検出される
  test("should reject contract change record with missing required fields", () => {
    const incomplete_contract_change = {
      contract_id: "",
      change_datetime: "2024-01-15T10:00:00Z",
      change_content: "単価変更",
      approver_name: "山田太郎",
    };

    expect(() => recordContractChange(incomplete_contract_change)).toThrow(
      /契約ID/
    );
  });

  test("should reject contract change record when change_datetime is missing", () => {
    const incomplete_contract_change = {
      contract_id: "CTR-2024-001",
      change_datetime: "",
      change_content: "単価変更",
      approver_name: "山田太郎",
    };

    expect(() => recordContractChange(incomplete_contract_change)).toThrow(
      /変更日時/
    );
  });

  test("should reject contract change record when change_content is missing", () => {
    const incomplete_contract_change = {
      contract_id: "CTR-2024-001",
      change_datetime: "2024-01-15T10:00:00Z",
      change_content: "",
      approver_name: "山田太郎",
    };

    expect(() => recordContractChange(incomplete_contract_change)).toThrow(
      /変更内容/
    );
  });

  test("should reject contract change record when approver_name is missing", () => {
    const incomplete_contract_change = {
      contract_id: "CTR-2024-001",
      change_datetime: "2024-01-15T10:00:00Z",
      change_content: "単価変更",
      approver_name: "",
    };

    expect(() => recordContractChange(incomplete_contract_change)).toThrow(
      /承認者/
    );
  });

  test("should successfully record valid contract change with all required fields", () => {
    const valid_contract_change = {
      contract_id: "CTR-2024-001",
      change_datetime: "2024-01-15T10:00:00Z",
      change_content: "単価変更：従来 5,000 円 → 新規 6,000 円",
      approver_name: "山田太郎",
    };

    const result = recordContractChange(valid_contract_change);

    expect(result).toEqual({
      success: true,
      contract_id: "CTR-2024-001",
      change_datetime: "2024-01-15T10:00:00Z",
      change_content: "単価変更：従来 5,000 円 → 新規 6,000 円",
      approver_name: "山田太郎",
      recorded_at: expect.any(String),
      status: "recorded",
    });
  });

  test("should reject contract change record with invalid datetime format", () => {
    const invalid_datetime_change = {
      contract_id: "CTR-2024-001",
      change_datetime: "2024/01/15 10:00:00",
      change_content: "単価変更",
      approver_name: "山田太郎",
    };

    expect(() => recordContractChange(invalid_datetime_change)).toThrow(
      /日時形式/
    );
  });

  test("should reject contract change record when contract_id format is invalid", () => {
    const invalid_contract_id_change = {
      contract_id: "INVALID-123-ABC-XYZ-TOO-LONG",
      change_datetime: "2024-01-15T10:00:00Z",
      change_content: "単価変更",
      approver_name: "山田太郎",
    };

    expect(() => recordContractChange(invalid_contract_id_change)).toThrow(
      /契約ID形式/
    );
  });

  test("should reject contract change record when multiple required fields are missing", () => {
    const multiple_missing_fields = {
      contract_id: "",
      change_datetime: "",
      change_content: "単価変更",
      approver_name: "",
    };

    expect(() => recordContractChange(multiple_missing_fields)).toThrow(
      /必須項目/
    );
  });
});