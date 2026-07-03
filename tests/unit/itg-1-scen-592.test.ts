import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-592: [normal] 営業データ品質検証機能 - 必須項目・データ型・範囲・異常値に基づき営業データが合格判定される
  test("すべての検証項目（必須項目・データ型・範囲・異常値）がOKと判定され、営業データが『合格』と表示される", () => {
    // テストデータセット準備：必須項目すべて入力、データ型正常、範囲内、異常値なし
    const validSalesData = {
      customer_id: "CUST-001",
      customer_name: "顧客A株式会社",
      contact_date: "2024-01-15",
      contact_time: "14:30",
      service_type: "コンサルティング",
      appointment_count: 5,
      contract_count: 2,
      contract_amount: 500000,
      customer_reaction: "好意的",
      appointment_status: "確定",
      sales_staff_id: "STAFF-001",
      sales_staff_name: "営業太郎",
    };

    // 検証処理を実行
    const result = validateSalesData(validSalesData);

    // 検証結果の判定ステータスを確認：『合格』と表示される
    expect(result.status).toBe("合格");
    expect(result.is_valid).toBe(true);

    // 各項目の検証詳細を確認：すべての検証項目がOKと判定
    expect(result.validation_details).toEqual({
      required_fields_check: {
        status: "OK",
        passed: true,
        missing_fields: [],
      },
      data_type_check: {
        status: "OK",
        passed: true,
        type_errors: [],
      },
      range_check: {
        status: "OK",
        passed: true,
        range_errors: [],
      },
      anomaly_check: {
        status: "OK",
        passed: true,
        anomalies: [],
      },
    });

    // 検証結果ログに各チェック項目の成功が記録される
    expect(result.log_entries).toEqual([
      {
        timestamp: expect.any(String),
        check_type: "required_fields_check",
        result: "OK",
        details: "すべての必須項目が入力されています",
      },
      {
        timestamp: expect.any(String),
        check_type: "data_type_check",
        result: "OK",
        details: "すべてのデータ型が正常です",
      },
      {
        timestamp: expect.any(String),
        check_type: "range_check",
        result: "OK",
        details: "すべての項目が許容範囲内です",
      },
      {
        timestamp: expect.any(String),
        check_type: "anomaly_check",
        result: "OK",
        details: "異常値は検出されません",
      },
    ]);

    // 検証結果サマリー
    expect(result.summary).toEqual({
      total_checks: 4,
      passed_checks: 4,
      failed_checks: 0,
      validation_timestamp: expect.any(String),
    });
  });
});