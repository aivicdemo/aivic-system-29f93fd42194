import { extractAndAggregateByCustomerAndService } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 顧客別・サービス別請求対象抽出集計", () => {
  test("SCEN-647: 複数顧客・複数サービスから請求対象データが正確に抽出・集計される", () => {
    // テストデータ: 3社以上の顧客と各顧客に紐付く複数サービス
    const input_customers = [
      { customer_id: "CUST001", customer_name: "顧客A企業", status: "active" },
      { customer_id: "CUST002", customer_name: "顧客B企業", status: "active" },
      { customer_id: "CUST003", customer_name: "顧客C企業", status: "active" },
    ];

    const input_services = [
      { service_id: "SVC001", service_name: "基本サービス", unit_price: 10000 },
      { service_id: "SVC002", service_name: "オプションサービスA", unit_price: 5000 },
      { service_id: "SVC003", service_name: "オプションサービスB", unit_price: 3000 },
    ];

    // 顧客別・サービス別の紐付けマッピング
    const input_customer_service_mapping = [
      { customer_id: "CUST001", service_id: "SVC001" },
      { customer_id: "CUST001", service_id: "SVC002" },
      { customer_id: "CUST002", service_id: "SVC001" },
      { customer_id: "CUST002", service_id: "SVC003" },
      { customer_id: "CUST003", service_id: "SVC001" },
      { customer_id: "CUST003", service_id: "SVC002" },
      { customer_id: "CUST003", service_id: "SVC003" },
    ];

    // 請求対象データレコード（利用実績・成約数など）
    const input_billing_records = [
      // CUST001向けデータ
      {
        record_id: "REC001",
        customer_id: "CUST001",
        service_id: "SVC001",
        transaction_date: "2024-01-10",
        quantity: 2,
        amount: 20000,
        status: "completed",
      },
      {
        record_id: "REC002",
        customer_id: "CUST001",
        service_id: "SVC001",
        transaction_date: "2024-01-15",
        quantity: 1,
        amount: 10000,
        status: "completed",
      },
      {
        record_id: "REC003",
        customer_id: "CUST001",
        service_id: "SVC002",
        transaction_date: "2024-01-20",
        quantity: 3,
        amount: 15000,
        status: "completed",
      },

      // CUST002向けデータ
      {
        record_id: "REC004",
        customer_id: "CUST002",
        service_id: "SVC001",
        transaction_date: "2024-01-12",
        quantity: 1,
        amount: 10000,
        status: "completed",
      },
      {
        record_id: "REC005",
        customer_id: "CUST002",
        service_id: "SVC001",
        transaction_date: "2024-01-18",
        quantity: 2,
        amount: 20000,
        status: "completed",
      },
      {
        record_id: "REC006",
        customer_id: "CUST002",
        service_id: "SVC003",
        transaction_date: "2024-01-22",
        quantity: 5,
        amount: 15000,
        status: "completed",
      },

      // CUST003向けデータ
      {
        record_id: "REC007",
        customer_id: "CUST003",
        service_id: "SVC001",
        transaction_date: "2024-01-11",
        quantity: 3,
        amount: 30000,
        status: "completed",
      },
      {
        record_id: "REC008",
        customer_id: "CUST003",
        service_id: "SVC002",
        transaction_date: "2024-01-16",
        quantity: 2,
        amount: 10000,
        status: "completed",
      },
      {
        record_id: "REC009",
        customer_id: "CUST003",
        service_id: "SVC002",
        transaction_date: "2024-01-25",
        quantity: 1,
        amount: 5000,
        status: "completed",
      },
      {
        record_id: "REC010",
        customer_id: "CUST003",
        service_id: "SVC003",
        transaction_date: "2024-01-28",
        quantity: 4,
        amount: 12000,
        status: "completed",
      },

      // 請求除外対象: キャンセル済み
      {
        record_id: "REC011",
        customer_id: "CUST001",
        service_id: "SVC001",
        transaction_date: "2024-01-05",
        quantity: 1,
        amount: 10000,
        status: "cancelled",
      },

      // 請求除外対象: 無効状態
      {
        record_id: "REC012",
        customer_id: "CUST002",
        service_id: "SVC001",
        transaction_date: "2024-01-08",
        quantity: 1,
        amount: 10000,
        status: "invalid",
      },
    ];

    // 実行: 期間指定で請求対象抽出集計
    const result = extractAndAggregateByCustomerAndService({
      customers: input_customers,
      services: input_services,
      customer_service_mapping: input_customer_service_mapping,
      billing_records: input_billing_records,
      period_start: "2024-01-01",
      period_end: "2024-01-31",
    });

    // 検証1: 顧客別・サービス別の集計が全て網羅されている
    expect(result.aggregated_summary).toHaveLength(7);

    // 検証2: CUST001 + SVC001の集計値（重複排除後）
    // REC001: 20000, REC002: 10000 → 合計 30000, 件数 2
    const cust001_svc001 = result.aggregated_summary.find(
      (x) => x.customer_id === "CUST001" && x.service_id === "SVC001"
    );
    expect(cust001_svc001).toEqual({
      customer_id: "CUST001",
      customer_name: "顧客A企業",
      service_id: "SVC001",
      service_name: "基本サービス",
      total_amount: 30000,
      total_quantity: 3,
      record_count: 2,
    });

    // 検証3: CUST001 + SVC002の集計値
    // REC003: 15000 → 合計 15000, 件数 1
    const cust001_svc002 = result.aggregated_summary.find(
      (x) => x.customer_id === "CUST001" && x.service_id === "SVC002"
    );
    expect(cust001_svc002).toEqual({
      customer_id: "CUST001",
      customer_name: "顧客A企業",
      service_id: "SVC002",
      service_name: "オプションサービスA",
      total_amount: 15000,
      total_quantity: 3,
      record_count: 1,
    });

    // 検証4: CUST002 + SVC001の集計値（キャンセル・無効除外）
    // REC004: 10000, REC005: 20000 → REC012無効除外後 合計 30000, 件数 2
    const cust002_svc001 = result.aggregated_summary.find(
      (x) => x.customer_id === "CUST002" && x.service_id === "SVC001"
    );
    expect(cust002_svc001).toEqual({
      customer_id: "CUST002",
      customer_name: "顧客B企業",
      service_id: "SVC001",
      service_name: "基本サービス",
      total_amount: 30000,
      total_quantity: 3,
      record_count: 2,
    });

    // 検証5: CUST002 + SVC003の集計値
    // REC006: 15000 → 合計 15000, 件数 1
    const cust002_svc003 = result.aggregated_summary.find(
      (x) => x.customer_id === "CUST002" && x.service_id === "SVC003"
    );
    expect(cust002_svc003).toEqual({
      customer_id: "CUST002",
      customer_name: "顧客B企業",
      service_id: "SVC003",
      service_name: "オプションサービスB",
      total_amount: 15000,
      total_quantity: 5,
      record_count: 1,
    });

    // 検証6: CUST003 + SVC001の集計値
    // REC007: 30000 → 合計 30000, 件数 1
    const cust003_svc001 = result.aggregated_summary.find(
      (x) => x.customer_id === "CUST003" && x.service_id === "SVC001"
    );
    expect(cust003_svc001).toEqual({
      customer_id: "CUST003",
      customer_name: "顧客C企業",
      service_id: "SVC001",
      service_name: "基本サービス",
      total_amount: 30000,
      total_quantity: 3,
      record_count: 1,
    });

    // 検証7: CUST003 + SVC002の集計値
    // REC008: 10000, REC009: 5000 → 合計 15000, 件数 2
    const cust003_svc002 = result.aggregated_summary.find(
      (x) => x.customer_id === "CUST003" && x.service_id === "SVC002"
    );
    expect(cust003_svc002).toEqual({
      customer_id: "CUST003",
      customer_name: "顧客C企業",
      service_id: "SVC002",
      service_name: "オプションサービスA",
      total_amount: 15000,
      total_quantity: 3,
      record_count: 2,
    });

    // 検証8: CUST003 + SVC003の集計値
    // REC010: 12000 → 合計 12000, 件数 1
    const cust003_svc003 = result.aggregated_summary.find(
      (x) => x.customer_id === "CUST003" && x.service_id === "SVC003"
    );
    expect(cust003_svc003).toEqual({
      customer_id: "CUST003",
      customer_name: "顧客C企業",
      service_id: "SVC003",
      service_name: "オプションサービスB",
      total_amount: 12000,
      total_quantity: 4,
      record_count: 1,
    });

    // 検証9: 除外されたレコード数の確認
    // REC011（cancelled）と REC012（invalid）の2件が除外されている
    expect(result.excluded_records).toEqual([
      {
        record_id: "REC011",
        reason: "cancelled",
      },
      {
        record_id: "REC012",
        reason: "invalid",
      },
    ]);

    // 検証10: 全体集計（サマリー）
    // 有効レコード: 10件
    // 合計金額: 30000+15000+30000+15000+30000+15000+12000 = 147000
    expect(result.overall_summary).toEqual({
      total_records_processed: 10,
      total_records_excluded: 2,
      total_amount: 147000,
      period_start: "2024-01-01",
      period_end: "2024-01-31",
    });

    // 検証11: 出力フォーマットの検証
    expect(result).toHaveProperty("aggregated_summary");
    expect(result).toHaveProperty("excluded_records");
    expect(result).toHaveProperty("overall_summary");
    expect(typeof result.aggregated_summary).toBe("object");
    expect(Array.isArray(result.aggregated_summary)).toBe(true);
    expect(Array.isArray(result.excluded_records)).toBe(true);
  });
});