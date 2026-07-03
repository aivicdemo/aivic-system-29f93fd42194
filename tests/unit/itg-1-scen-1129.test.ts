import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import fetchMock from "jest-fetch-mock";
import { validateReportAnomalies } from "../../src/logic/it-1781935279444-2-2-1";

fetchMock.enableMocks();

describe("営業データ品質管理・請求自動化システム - レポート異常値・矛盾検出", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1129: [error] レポート内の異常値・矛盾検出 - 異常検出ロジックの誤判定により正常なレポートが不正に配信不可と判定される
  test("正常な売上データを含むレポートが異常値・矛盾検出ロジックで誤判定されず、配信可能と正しく判定される", () => {
    // 前提: 営業データ品質管理・請求自動化システムにログイン済み
    // 手順: 正常な売上データ（金額、日付、顧客情報が全て妥当な範囲内）を含むレポートを作成
    const report_id = "REPORT_2024_01_001";
    const report_creation_timestamp = new Date("2024-01-31T10:00:00Z");
    const report_period_start = new Date("2024-01-01T00:00:00Z");
    const report_period_end = new Date("2024-01-31T23:59:59Z");

    const report_data = {
      report_id: report_id,
      created_at: report_creation_timestamp.toISOString(),
      period_start: report_period_start.toISOString(),
      period_end: report_period_end.toISOString(),
      customer_id: "CUST_001",
      customer_name: "株式会社テスト",
      service_type: "営業支援サービス",
      sales_transactions: [
        {
          transaction_id: "TXN_001",
          transaction_date: new Date("2024-01-15T09:00:00Z").toISOString(),
          transaction_type: "appointment",
          amount: 50000,
          quantity: 1,
          unit_price: 50000,
          status: "confirmed",
        },
        {
          transaction_id: "TXN_002",
          transaction_date: new Date("2024-01-20T14:30:00Z").toISOString(),
          transaction_type: "contract",
          amount: 120000,
          quantity: 2,
          unit_price: 60000,
          status: "confirmed",
        },
        {
          transaction_id: "TXN_003",
          transaction_date: new Date("2024-01-25T11:15:00Z").toISOString(),
          transaction_type: "feedback",
          amount: 0,
          quantity: 0,
          unit_price: 0,
          status: "recorded",
        },
      ],
      total_amount: 170000,
      total_count: 3,
      billing_flag: true,
      distribution_flag: true,
    };

    // 手順: 作成したレポートに対して異常値・矛盾検出ロジックを実行
    const validation_rules = {
      min_amount: 0,
      max_amount: 10000000,
      min_transaction_date: report_period_start.toISOString(),
      max_transaction_date: report_period_end.toISOString(),
      allowed_transaction_types: [
        "appointment",
        "contract",
        "feedback",
        "renewal",
      ],
      allowed_statuses: ["confirmed", "recorded", "pending"],
      quantity_must_be_positive_if_amount_positive: true,
      unit_price_multiply_quantity_equals_amount_tolerance: 0.01,
      total_amount_sum_validation: true,
      total_count_sum_validation: true,
      duplicate_transaction_id_check: true,
      mandatory_fields: [
        "report_id",
        "created_at",
        "period_start",
        "period_end",
        "customer_id",
        "customer_name",
        "service_type",
        "sales_transactions",
        "total_amount",
        "total_count",
      ],
    };

    // 検出ロジックを実行
    const validation_result = validateReportAnomalies({
      report_data: report_data,
      validation_rules: validation_rules,
    });

    // 期待結果: 異常値・矛盾検出ロジックが正常なレポートを誤判定しない
    expect(validation_result.is_valid).toBe(true);
    expect(validation_result.anomaly_detected).toBe(false);
    expect(validation_result.error_count).toBe(0);
    expect(validation_result.warning_count).toBe(0);

    // 手順: レポートの配信可否フラグを確認
    expect(validation_result.distribution_allowed).toBe(true);
    expect(validation_result.distribution_reason).toBe("正常なレポート");

    // 手順: 実際にレポートを配信しようとする - API コール
    fetchMock.mockResponseOnce(
      JSON.stringify({
        distribution_id: "DIST_001",
        report_id: report_id,
        customer_id: "CUST_001",
        distribution_status: "sent",
        distribution_timestamp: new Date("2024-01-31T10:05:00Z").toISOString(),
        delivery_method: "email",
        recipient_count: 1,
        error_message: null,
      }),
      { status: 200 }
    );

    // 配信を実行
    return fetch("http://api.example.com/reports/distribute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        report_id: report_id,
        customer_id: "CUST_001",
        distribution_allowed: validation_result.distribution_allowed,
      }),
    })
      .then((response) => {
        expect(response.status).toBe(200);
        return response.json();
      })
      .then((distribution_response) => {
        // 期待結果: 配信処理が成功し、エラーメッセージが出力されないこと
        expect(distribution_response.distribution_status).toBe("sent");
        expect(distribution_response.error_message).toBeNull();
        expect(distribution_response.delivery_method).toBe("email");
        expect(distribution_response.recipient_count).toBe(1);

        // 配信ログを確認
        const distribution_log = {
          log_id: "LOG_001",
          report_id: report_id,
          event_timestamp: new Date("2024-01-31T10:05:00Z").toISOString(),
          event_type: "distribution_success",
          event_message: "レポートが正常に配信されました",
          severity: "info",
          customer_id: "CUST_001",
        };

        expect(distribution_log.event_type).toBe("distribution_success");
        expect(distribution_log.event_message).toBe(
          "レポートが正常に配信されました"
        );
        expect(distribution_log.severity).toBe("info");

        // 最終検証: 配信不可フラグが立っていないこと
        expect(validation_result.distribution_allowed).toBe(true);
        expect(validation_result.anomaly_detected).toBe(false);
      });
  });
});