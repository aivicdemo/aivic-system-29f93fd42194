import { defineMetadataLogic } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ管理機能", () => {
  // SCEN-1327: [normal] 営業データ項目メタデータ管理 - メタデータで定義された項目名・単位・データ型・計算ロジックが検証・抽出処理に正しく適用される
  test("メタデータ定義の項目名・単位・データ型・計算ロジックがすべての検証・抽出処理に正しく適用される", () => {
    // テストデータベースに営業データ項目メタデータを事前登録
    // 項目名：売上金額、単位：円、データ型：数値、計算ロジック：単価×数量
    const metadata = {
      item_id: "MTD-001",
      item_name: "売上金額",
      unit: "円",
      data_type: "number",
      calculation_logic: "unit_price * quantity",
    };

    // メタデータ管理画面から登録したメタデータを確認
    const result_1 = defineMetadataLogic({
      metadata_id: metadata.item_id,
      item_name: metadata.item_name,
      unit: metadata.unit,
      data_type: metadata.data_type,
      calculation_logic: metadata.calculation_logic,
    });

    // すべての定義情報が正しく表示されることを確認
    expect(result_1).toEqual({
      metadata_id: "MTD-001",
      item_name: "売上金額",
      unit: "円",
      data_type: "number",
      calculation_logic: "unit_price * quantity",
      status: "registered",
      created_at: expect.any(String),
    });

    // テスト用営業データ（単価：1000円、数量：5個）を検証処理に入力
    const test_data_1 = {
      record_id: "REC-001",
      unit_price: 1000,
      quantity: 5,
    };

    // 検証処理を実行し、メタデータ定義の項目名・単位・データ型が正しく適用されたかを検証
    const validation_result_1 = defineMetadataLogic({
      metadata_id: metadata.item_id,
      item_name: metadata.item_name,
      unit: metadata.unit,
      data_type: metadata.data_type,
      calculation_logic: metadata.calculation_logic,
      record_data: test_data_1,
      operation: "validate",
    });

    // 検証処理の実行結果ログを確認
    expect(validation_result_1).toEqual({
      metadata_id: "MTD-001",
      item_name: "売上金額",
      unit: "円",
      data_type: "number",
      record_id: "REC-001",
      validation_status: "passed",
      extracted_value: 5000,
      extracted_unit: "円",
      extracted_data_type: "number",
    });

    // 計算ロジック（単価×数量=5000円）が正しく実行されたかを確認
    expect(validation_result_1.extracted_value).toBe(5000);

    // 抽出処理実行画面でメタデータを指定して抽出処理を実行
    const extraction_result_1 = defineMetadataLogic({
      metadata_id: metadata.item_id,
      item_name: metadata.item_name,
      unit: metadata.unit,
      data_type: metadata.data_type,
      calculation_logic: metadata.calculation_logic,
      record_data: test_data_1,
      operation: "extract",
    });

    // 抽出結果として、売上金額が「5000」（単位：円、データ型：数値）で抽出されたことを確認
    expect(extraction_result_1).toEqual({
      metadata_id: "MTD-001",
      item_name: "売上金額",
      unit: "円",
      data_type: "number",
      extracted_value: 5000,
      extracted_unit: "円",
      extracted_data_type: "number",
    });

    // 複数の営業データレコードに対して同様の検証・抽出処理を繰り返し実行
    // テスト用営業データ2：単価：2000円、数量：3個
    const test_data_2 = {
      record_id: "REC-002",
      unit_price: 2000,
      quantity: 3,
    };

    const validation_result_2 = defineMetadataLogic({
      metadata_id: metadata.item_id,
      item_name: metadata.item_name,
      unit: metadata.unit,
      data_type: metadata.data_type,
      calculation_logic: metadata.calculation_logic,
      record_data: test_data_2,
      operation: "validate",
    });

    // すべてのレコードでメタデータが正しく適用されることを確認
    expect(validation_result_2.extracted_value).toBe(6000);
    expect(validation_result_2.extracted_unit).toBe("円");
    expect(validation_result_2.extracted_data_type).toBe("number");

    // テスト用営業データ3：単価：1500円、数量：8個
    const test_data_3 = {
      record_id: "REC-003",
      unit_price: 1500,
      quantity: 8,
    };

    const extraction_result_3 = defineMetadataLogic({
      metadata_id: metadata.item_id,
      item_name: metadata.item_name,
      unit: metadata.unit,
      data_type: metadata.data_type,
      calculation_logic: metadata.calculation_logic,
      record_data: test_data_3,
      operation: "extract",
    });

    // 複数レコードでもメタデータが正しく適用される
    expect(extraction_result_3.extracted_value).toBe(12000);
    expect(extraction_result_3.extracted_unit).toBe("円");
    expect(extraction_result_3.extracted_data_type).toBe("number");
  });
});