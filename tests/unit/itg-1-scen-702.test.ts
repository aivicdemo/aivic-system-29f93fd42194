import {
  validateSalesDataItemMetadata,
  applySalesDataValidationRules,
  updateSalesDataItemMetadataDefinition,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  // SCEN-702: [normal] 営業データ項目のメタデータ管理機能 - メタデータ定義に基づいて営業データ項目の単位・データ型が正しく検証される
  test("メタデータ定義に基づいて営業データ項目の単位・データ型が正しく検証される", () => {
    // === メタデータ定義の初期化 ===
    const metadata_sales_amount = {
      item_id: "item_001",
      item_name: "売上金額",
      unit: "円",
      data_type: "number",
      validation_rule: {
        type: "number",
        min: 0,
        max: 999999999,
      },
    };

    const metadata_transaction_date = {
      item_id: "item_002",
      item_name: "取引日",
      unit: "日付形式(YYYY-MM-DD)",
      data_type: "date",
      validation_rule: {
        type: "date",
        format: "YYYY-MM-DD",
      },
    };

    const metadata_customer_name = {
      item_id: "item_003",
      item_name: "顧客名",
      unit: "文字列",
      data_type: "string",
      validation_rule: {
        type: "string",
        maxLength: 100,
      },
    };

    // === メタデータ定義に基づく検証ルール設定が正しく機能することを確認 ===
    const validation_result_metadata = validateSalesDataItemMetadata({
      items: [metadata_sales_amount, metadata_transaction_date, metadata_customer_name],
    });
    expect(validation_result_metadata.is_valid).toBe(true);
    expect(validation_result_metadata.validated_items_count).toBe(3);

    // === 定義に合致するテストデータでの検証 - ハッピーパス ===
    const valid_data_001 = {
      item_id: "item_001",
      value: 150000,
      unit: "円",
      data_type: "number",
    };

    const result_valid_001 = applySalesDataValidationRules({
      data: valid_data_001,
      metadata: metadata_sales_amount,
    });
    expect(result_valid_001.is_passed).toBe(true);
    expect(result_valid_001.error_message).toBe("");

    // === 定義に合致するテストデータでの検証 - 日付 ===
    const valid_data_002 = {
      item_id: "item_002",
      value: "2024-01-15",
      unit: "日付形式(YYYY-MM-DD)",
      data_type: "date",
    };

    const result_valid_002 = applySalesDataValidationRules({
      data: valid_data_002,
      metadata: metadata_transaction_date,
    });
    expect(result_valid_002.is_passed).toBe(true);
    expect(result_valid_002.error_message).toBe("");

    // === 定義に合致するテストデータでの検証 - 顧客名 ===
    const valid_data_003 = {
      item_id: "item_003",
      value: "ABC商事株式会社",
      unit: "文字列",
      data_type: "string",
    };

    const result_valid_003 = applySalesDataValidationRules({
      data: valid_data_003,
      metadata: metadata_customer_name,
    });
    expect(result_valid_003.is_passed).toBe(true);
    expect(result_valid_003.error_message).toBe("");

    // === 定義に不合致するテストデータでの検証エラー検出 - 負の金額 ===
    const invalid_data_001 = {
      item_id: "item_001",
      value: -50000,
      unit: "円",
      data_type: "number",
    };

    const result_invalid_001 = applySalesDataValidationRules({
      data: invalid_data_001,
      metadata: metadata_sales_amount,
    });
    expect(result_invalid_001.is_passed).toBe(false);
    expect(result_invalid_001.error_message).toMatch(/金額/);

    // === 定義に不合致するテストデータでの検証エラー検出 - 不正な日付形式 ===
    const invalid_data_002 = {
      item_id: "item_002",
      value: "2024/01/15",
      unit: "日付形式(YYYY-MM-DD)",
      data_type: "date",
    };

    const result_invalid_002 = applySalesDataValidationRules({
      data: invalid_data_002,
      metadata: metadata_transaction_date,
    });
    expect(result_invalid_002.is_passed).toBe(false);
    expect(result_invalid_002.error_message).toMatch(/日付/);

    // === 定義に不合致するテストデータでの検証エラー検出 - 超過長の顧客名 ===
    const invalid_data_003 = {
      item_id: "item_003",
      value: "a".repeat(101),
      unit: "文字列",
      data_type: "string",
    };

    const result_invalid_003 = applySalesDataValidationRules({
      data: invalid_data_003,
      metadata: metadata_customer_name,
    });
    expect(result_invalid_003.is_passed).toBe(false);
    expect(result_invalid_003.error_message).toMatch(/文字列/);

    // === 定義に不合致するテストデータでの検証エラー検出 - 不正なデータ型 ===
    const invalid_data_004 = {
      item_id: "item_001",
      value: "150000yen",
      unit: "円",
      data_type: "number",
    };

    const result_invalid_004 = applySalesDataValidationRules({
      data: invalid_data_004,
      metadata: metadata_sales_amount,
    });
    expect(result_invalid_004.is_passed).toBe(false);
    expect(result_invalid_004.error_message).toMatch(/型/);

    // === メタデータ定義の更新 ===
    const updated_metadata_sales_amount = {
      item_id: "item_001",
      item_name: "売上金額",
      unit: "円",
      data_type: "number",
      validation_rule: {
        type: "number",
        min: 1000,
        max: 500000000,
      },
    };

    const update_result = updateSalesDataItemMetadataDefinition({
      item_id: "item_001",
      new_metadata: updated_metadata_sales_amount,
    });
    expect(update_result.is_updated).toBe(true);
    expect(update_result.updated_item_id).toBe("item_001");

    // === メタデータ定義変更後、新規検証ルールが適用されることを確認 ===
    const data_after_update_001 = {
      item_id: "item_001",
      value: 500,
      unit: "円",
      data_type: "number",
    };

    const result_after_update_001 = applySalesDataValidationRules({
      data: data_after_update_001,
      metadata: updated_metadata_sales_amount,
    });
    expect(result_after_update_001.is_passed).toBe(false);
    expect(result_after_update_001.error_message).toMatch(/金額/);

    // === メタデータ定義変更後、新規検証ルール適用下での有効データ検証 ===
    const data_after_update_002 = {
      item_id: "item_001",
      value: 50000,
      unit: "円",
      data_type: "number",
    };

    const result_after_update_002 = applySalesDataValidationRules({
      data: data_after_update_002,
      metadata: updated_metadata_sales_amount,
    });
    expect(result_after_update_002.is_passed).toBe(true);
    expect(result_after_update_002.error_message).toBe("");

    // === 複数の営業データ項目について検証が正常に機能することを確認 ===
    const batch_validation_data = [
      {
        item_id: "item_001",
        value: 250000,
        unit: "円",
        data_type: "number",
      },
      {
        item_id: "item_002",
        value: "2024-03-20",
        unit: "日付形式(YYYY-MM-DD)",
        data_type: "date",
      },
      {
        item_id: "item_003",
        value: "XYZ運送株式会社",
        unit: "文字列",
        data_type: "string",
      },
    ];

    const batch_result = applySalesDataValidationRules({
      data: batch_validation_data,
      metadata: [
        updated_metadata_sales_amount,
        metadata_transaction_date,
        metadata_customer_name,
      ],
    });
    expect(batch_result.is_passed).toBe(true);
    expect(batch_result.validated_count).toBe(3);
    expect(batch_result.error_message).toBe("");
  });
});