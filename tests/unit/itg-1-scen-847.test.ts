import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sortContractsByDateTime } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-847: [error] 契約・成果物情報の時系列統合表示機能 - 時系列ソート対象の日時データが欠落している場合、エラーハンドリングされる
  test("SCEN-847: 時系列ソート対象の日時データが欠落している場合、エラーハンドリングされる", () => {
    // ========== 前提条件 ==========
    // 契約・成果物情報の時系列統合表示機能が開かれている状態
    // 時系列ソート対象となる日時データが欠落している契約レコードが存在する

    // ========== テストケース 1: 欠落した日時データを含むレコードセットでソート処理実行 ==========
    const contracts_with_missing_datetime = [
      {
        contract_id: "CTR001",
        customer_id: "CUS001",
        contract_date: "2024-01-15T10:00:00Z",
        effective_date: "2024-01-20T09:00:00Z",
      },
      {
        contract_id: "CTR002",
        customer_id: "CUS002",
        contract_date: null, // 日時データが欠落
        effective_date: "2024-02-01T09:00:00Z",
      },
      {
        contract_id: "CTR003",
        customer_id: "CUS003",
        contract_date: "2024-01-10T14:30:00Z",
        effective_date: null, // 日時データが欠落
      },
    ];

    // エラーが発生することを確認
    expect(() => {
      sortContractsByDateTime(contracts_with_missing_datetime, "contract_date");
    }).toThrow(/日時データ欠落/);

    // ========== テストケース 2: 別の日時フィールドが欠落している場合 ==========
    expect(() => {
      sortContractsByDateTime(
        contracts_with_missing_datetime,
        "effective_date"
      );
    }).toThrow(/日時データ欠落/);

    // ========== テストケース 3: 欠落データを修正した後、正常にソート処理が実行される ==========
    const contracts_corrected = [
      {
        contract_id: "CTR001",
        customer_id: "CUS001",
        contract_date: "2024-01-15T10:00:00Z",
        effective_date: "2024-01-20T09:00:00Z",
      },
      {
        contract_id: "CTR002",
        customer_id: "CUS002",
        contract_date: "2024-01-18T11:00:00Z", // 欠落データを修正
        effective_date: "2024-02-01T09:00:00Z",
      },
      {
        contract_id: "CTR003",
        customer_id: "CUS003",
        contract_date: "2024-01-10T14:30:00Z",
        effective_date: "2024-01-25T08:00:00Z", // 欠落データを修正
      },
    ];

    // 正常にソート処理が実行されることを確認
    const result = sortContractsByDateTime(
      contracts_corrected,
      "contract_date"
    );

    // 期待される結果: 昇順（古い順）でソートされたレコード
    expect(result).toEqual([
      {
        contract_id: "CTR003",
        customer_id: "CUS003",
        contract_date: "2024-01-10T14:30:00Z",
        effective_date: "2024-01-25T08:00:00Z",
      },
      {
        contract_id: "CTR001",
        customer_id: "CUS001",
        contract_date: "2024-01-15T10:00:00Z",
        effective_date: "2024-01-20T09:00:00Z",
      },
      {
        contract_id: "CTR002",
        customer_id: "CUS002",
        contract_date: "2024-01-18T11:00:00Z",
        effective_date: "2024-02-01T09:00:00Z",
      },
    ]);

    // ========== テストケース 4: すべてのレコードで指定フィールドが欠落している場合 ==========
    const contracts_all_missing = [
      {
        contract_id: "CTR001",
        customer_id: "CUS001",
        contract_date: null,
        effective_date: "2024-01-20T09:00:00Z",
      },
      {
        contract_id: "CTR002",
        customer_id: "CUS002",
        contract_date: null,
        effective_date: "2024-02-01T09:00:00Z",
      },
    ];

    expect(() => {
      sortContractsByDateTime(contracts_all_missing, "contract_date");
    }).toThrow(/日時データ欠落/);

    // ========== テストケース 5: 空のレコードセット ==========
    const contracts_empty = [];
    const result_empty = sortContractsByDateTime(contracts_empty, "contract_date");
    expect(result_empty).toEqual([]);

    // ========== テストケース 6: 指定フィールドが存在しないレコード ==========
    const contracts_invalid_field = [
      {
        contract_id: "CTR001",
        customer_id: "CUS001",
        contract_date: "2024-01-15T10:00:00Z",
      },
    ];

    expect(() => {
      sortContractsByDateTime(contracts_invalid_field, "non_existent_field");
    }).toThrow(/フィールド指定エラー/);
  });
});