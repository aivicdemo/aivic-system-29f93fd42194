import { validateContractVersionManagement } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1105: [error] 契約書管理チェックリスト検証 - バージョン管理が不適切な場合、不合格判定となること
  test("バージョン情報が欠落している契約書は不合格と判定される", () => {
    const contract_without_version = {
      contract_id: "CTR-001",
      customer_id: "CUST-123",
      contract_name: "基本契約書",
      version_number: undefined,
      version_history: [],
      last_updated_date: "2024-01-15",
      updated_by: "user_001",
    };

    const result = validateContractVersionManagement(contract_without_version);

    expect(result.is_valid).toBe(false);
    expect(result.status).toBe("不合格");
    expect(result.error_details).toContain("バージョン番号");
  });

  test("バージョン履歴が完全に欠落している契約書は不合格と判定される", () => {
    const contract_with_empty_history = {
      contract_id: "CTR-002",
      customer_id: "CUST-124",
      contract_name: "個別契約書",
      version_number: 1,
      version_history: [],
      last_updated_date: "2024-01-20",
      updated_by: "user_002",
    };

    const result = validateContractVersionManagement(
      contract_with_empty_history
    );

    expect(result.is_valid).toBe(false);
    expect(result.status).toBe("不合格");
    expect(result.error_details).toContain("バージョン履歴");
  });

  test("バージョン番号とバージョン履歴が不一致の場合は不合格と判定される", () => {
    const contract_with_mismatch = {
      contract_id: "CTR-003",
      customer_id: "CUST-125",
      contract_name: "変更契約書",
      version_number: 3,
      version_history: [
        {
          version: 1,
          created_date: "2024-01-01",
          created_by: "user_001",
        },
        {
          version: 2,
          created_date: "2024-01-10",
          created_by: "user_002",
        },
      ],
      last_updated_date: "2024-01-15",
      updated_by: "user_003",
    };

    const result = validateContractVersionManagement(contract_with_mismatch);

    expect(result.is_valid).toBe(false);
    expect(result.status).toBe("不合格");
    expect(result.error_details).toContain("不整合");
  });

  test("バージョン情報が正常に記録されている契約書は合格と判定される", () => {
    const contract_valid = {
      contract_id: "CTR-004",
      customer_id: "CUST-126",
      contract_name: "標準契約書",
      version_number: 2,
      version_history: [
        {
          version: 1,
          created_date: "2024-01-01",
          created_by: "user_001",
        },
        {
          version: 2,
          created_date: "2024-01-15",
          created_by: "user_002",
        },
      ],
      last_updated_date: "2024-01-15",
      updated_by: "user_002",
    };

    const result = validateContractVersionManagement(contract_valid);

    expect(result.is_valid).toBe(true);
    expect(result.status).toBe("合格");
    expect(result.error_details).toEqual([]);
  });

  test("バージョン情報の欠落時に適切なエラーメッセージが返却される", () => {
    const contract_without_version = {
      contract_id: "CTR-005",
      customer_id: "CUST-127",
      contract_name: "不正な契約書",
      version_number: null,
      version_history: [],
      last_updated_date: "2024-01-20",
      updated_by: "user_003",
    };

    expect(() => {
      validateContractVersionManagement(contract_without_version);
    }).toThrow(/バージョン/);
  });

  test("バージョン履歴が不正なタイムスタンプを含む場合は不合格と判定される", () => {
    const contract_with_invalid_timestamp = {
      contract_id: "CTR-006",
      customer_id: "CUST-128",
      contract_name: "タイムスタンプ不正契約書",
      version_number: 2,
      version_history: [
        {
          version: 1,
          created_date: "invalid-date",
          created_by: "user_001",
        },
        {
          version: 2,
          created_date: "2024-01-15",
          created_by: "user_002",
        },
      ],
      last_updated_date: "2024-01-15",
      updated_by: "user_002",
    };

    const result = validateContractVersionManagement(
      contract_with_invalid_timestamp
    );

    expect(result.is_valid).toBe(false);
    expect(result.status).toBe("不合格");
    expect(result.error_details).toContain("タイムスタンプ");
  });

  test("複数のバージョン情報欠落エラーが一括検出される", () => {
    const contract_multiple_errors = {
      contract_id: "CTR-007",
      customer_id: "CUST-129",
      contract_name: "複合エラー契約書",
      version_number: undefined,
      version_history: [],
      last_updated_date: "invalid-date",
      updated_by: "",
    };

    const result = validateContractVersionManagement(contract_multiple_errors);

    expect(result.is_valid).toBe(false);
    expect(result.status).toBe("不合格");
    expect(result.error_details.length).toBeGreaterThan(1);
  });
});