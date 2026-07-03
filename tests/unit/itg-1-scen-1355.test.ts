import {
  validateSalesDataConsistency,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ完全性・正確性自動検証 - 金額計算一貫性検証", () => {
  // SCEN-1355
  test("請求対象項目の抽出前検証で金額計算の一貫性が確認される", () => {
    // テストデータ: 複数の営業取引記録を含むサンプルデータセット
    const sales_data_records = [
      {
        transaction_id: "TXN001",
        customer_id: "CUST_A",
        service_id: "SVC_001",
        unit_price: 10000,
        quantity: 5,
        calculated_amount: 50000,
        currency: "JPY",
      },
      {
        transaction_id: "TXN002",
        customer_id: "CUST_A",
        service_id: "SVC_002",
        unit_price: 15000,
        quantity: 3,
        calculated_amount: 45000,
        currency: "JPY",
      },
      {
        transaction_id: "TXN003",
        customer_id: "CUST_B",
        service_id: "SVC_001",
        unit_price: 100,
        quantity: 50,
        calculated_amount: 5000,
        currency: "USD",
      },
      {
        transaction_id: "TXN004",
        customer_id: "CUST_B",
        service_id: "SVC_003",
        unit_price: 25000.5,
        quantity: 2,
        calculated_amount: 50001,
        currency: "JPY",
      },
      // 金額不一致ケース
      {
        transaction_id: "TXN005",
        customer_id: "CUST_C",
        service_id: "SVC_002",
        unit_price: 12000,
        quantity: 4,
        calculated_amount: 48001, // 正確な計算値は 48000、不一致
        currency: "JPY",
      },
      // 複数通貨の異なるレコード
      {
        transaction_id: "TXN006",
        customer_id: "CUST_A",
        service_id: "SVC_004",
        unit_price: 50.5,
        quantity: 100,
        calculated_amount: 5050,
        currency: "USD",
      },
    ];

    // 請求対象項目の抽出前検証機能を実行
    const validation_result = validateSalesDataConsistency(sales_data_records);

    // 金額計算ロジック（単価×数量＝金額）の一貫性がチェックされていることを確認
    expect(validation_result.is_validated).toBe(true);

    // 検証対象の各取引記録について、計算済み金額と再計算結果が一致するか検証
    expect(validation_result.validated_records).toHaveLength(5);
    expect(validation_result.validated_records[0]).toEqual({
      transaction_id: "TXN001",
      customer_id: "CUST_A",
      service_id: "SVC_001",
      unit_price: 10000,
      quantity: 5,
      calculated_amount: 50000,
      currency: "JPY",
      recalculated_amount: 50000,
      is_amount_consistent: true,
      validation_status: "passed",
    });

    expect(validation_result.validated_records[1]).toEqual({
      transaction_id: "TXN002",
      customer_id: "CUST_A",
      service_id: "SVC_002",
      unit_price: 15000,
      quantity: 3,
      calculated_amount: 45000,
      currency: "JPY",
      recalculated_amount: 45000,
      is_amount_consistent: true,
      validation_status: "passed",
    });

    // 複数通貨が含まれる場合、通貨別の金額計算が正確に行われているか確認
    expect(validation_result.validated_records[2]).toEqual({
      transaction_id: "TXN003",
      customer_id: "CUST_B",
      service_id: "SVC_001",
      unit_price: 100,
      quantity: 50,
      calculated_amount: 5000,
      currency: "USD",
      recalculated_amount: 5000,
      is_amount_consistent: true,
      validation_status: "passed",
    });

    // 小数点処理とまるめ方法が統一されているか確認
    expect(validation_result.validated_records[3]).toEqual({
      transaction_id: "TXN004",
      customer_id: "CUST_B",
      service_id: "SVC_003",
      unit_price: 25000.5,
      quantity: 2,
      calculated_amount: 50001,
      currency: "JPY",
      recalculated_amount: 50001,
      is_amount_consistent: true,
      validation_status: "passed",
    });

    // 複数通貨の異なる計算結果の確認
    expect(validation_result.validated_records[4]).toEqual({
      transaction_id: "TXN006",
      customer_id: "CUST_A",
      service_id: "SVC_004",
      unit_price: 50.5,
      quantity: 100,
      calculated_amount: 5050,
      currency: "USD",
      recalculated_amount: 5050,
      is_amount_consistent: true,
      validation_status: "passed",
    });

    // 検証エラーまたは不一致が検出された場合、エラーメッセージと詳細情報が正しく記録されるか確認
    expect(validation_result.error_records).toHaveLength(1);
    expect(validation_result.error_records[0]).toEqual({
      transaction_id: "TXN005",
      customer_id: "CUST_C",
      service_id: "SVC_002",
      unit_price: 12000,
      quantity: 4,
      calculated_amount: 48001,
      currency: "JPY",
      recalculated_amount: 48000,
      is_amount_consistent: false,
      validation_status: "failed",
      error_message: "金額不一致",
      error_detail:
        "単価(12000) × 数量(4) = 計算値(48000)、記録値(48001)、差分(1)",
    });

    // 検証が完了し、一貫性が確認された項目のみが請求対象として抽出されることを確認
    const billable_items = validation_result.validated_records;
    expect(billable_items.length).toBe(5);
    expect(billable_items.every((item) => item.is_amount_consistent)).toBe(
      true
    );

    // 検証サマリー
    expect(validation_result.total_records_processed).toBe(6);
    expect(validation_result.total_records_passed).toBe(5);
    expect(validation_result.total_records_failed).toBe(1);
    expect(validation_result.pass_rate).toBe(
      Math.round((5 / 6) * 100 * 100) / 100
    );
  });
});