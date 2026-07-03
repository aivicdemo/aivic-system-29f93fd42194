import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  it("SCEN-996: 営業データ抽出・集計ルール定義 - 月次レポート作成期間開始時に営業データから請求対象項目を正確に抽出し顧客・サービス別に集計される", async () => {
    const { extractAndAggregateBusinessData } = await import(
      "../../src/logic/it-1-br-1781935279444-1-2-1"
    );

    // Precondition: 営業システムに当月の営業活動データ（アポ数、成約数、サービス種別等）が記録されており、顧客ごとの請求ルールが定義されている状態
    const monthly_period_start = new Date("2024-01-01T00:00:00Z");
    const monthly_period_end = new Date("2024-01-31T23:59:59Z");

    const raw_business_data = [
      {
        transaction_id: "TX001",
        customer_id: "CUST_A",
        service_type: "SERVICE_X",
        appointment_count: 5,
        contract_count: 2,
        revenue_amount: 50000,
        transaction_date: new Date("2024-01-15T10:30:00Z"),
      },
      {
        transaction_id: "TX002",
        customer_id: "CUST_A",
        service_type: "SERVICE_Y",
        appointment_count: 3,
        contract_count: 1,
        revenue_amount: 30000,
        transaction_date: new Date("2024-01-16T14:00:00Z"),
      },
      {
        transaction_id: "TX003",
        customer_id: "CUST_B",
        service_type: "SERVICE_X",
        appointment_count: 7,
        contract_count: 3,
        revenue_amount: 70000,
        transaction_date: new Date("2024-01-20T09:15:00Z"),
      },
      {
        transaction_id: "TX004",
        customer_id: "CUST_B",
        service_type: "SERVICE_Z",
        appointment_count: 2,
        contract_count: 1,
        revenue_amount: 20000,
        transaction_date: new Date("2024-01-25T11:45:00Z"),
      },
    ];

    const billing_rules = {
      CUST_A: {
        SERVICE_X: {
          base_fee: 10000,
          per_appointment_fee: 5000,
          per_contract_fee: 8000,
        },
        SERVICE_Y: {
          base_fee: 8000,
          per_appointment_fee: 3000,
          per_contract_fee: 5000,
        },
      },
      CUST_B: {
        SERVICE_X: {
          base_fee: 12000,
          per_appointment_fee: 6000,
          per_contract_fee: 9000,
        },
        SERVICE_Z: {
          base_fee: 5000,
          per_appointment_fee: 2000,
          per_contract_fee: 3000,
        },
      },
    };

    // Trigger: 月次締め日に営業データから請求対象項目を抽出し、請求額を自動計算する処理が実行される
    const extraction_config = {
      period_start: monthly_period_start,
      period_end: monthly_period_end,
      target_fields: [
        "appointment_count",
        "contract_count",
        "revenue_amount",
      ],
      group_by: ["customer_id", "service_type"],
    };

    // Action: extractAndAggregateBusinessData を呼び出す
    const result = extractAndAggregateBusinessData(
      raw_business_data,
      extraction_config,
      billing_rules
    );

    // Expected: 営業データから請求ルールに基づいて請求対象項目が自動判定・抽出され、顧客ごと・サービスごとの請求額が集計される

    // 期待値の計算（formulaに基づく具体的数値）
    // CUST_A + SERVICE_X: base_fee=10000, appt=5*5000=25000, contract=2*8000=16000, total=51000
    // CUST_A + SERVICE_Y: base_fee=8000, appt=3*3000=9000, contract=1*5000=5000, total=22000
    // CUST_B + SERVICE_X: base_fee=12000, appt=7*6000=42000, contract=3*9000=27000, total=81000
    // CUST_B + SERVICE_Z: base_fee=5000, appt=2*2000=4000, contract=1*3000=3000, total=12000

    expect(result).toEqual({
      extraction_status: "success",
      period_extracted: {
        start: monthly_period_start,
        end: monthly_period_end,
      },
      aggregated_data: [
        {
          customer_id: "CUST_A",
          service_type: "SERVICE_X",
          appointment_count: 5,
          contract_count: 2,
          total_revenue: 50000,
          calculated_billing_amount: 51000,
          transaction_count: 1,
        },
        {
          customer_id: "CUST_A",
          service_type: "SERVICE_Y",
          appointment_count: 3,
          contract_count: 1,
          total_revenue: 30000,
          calculated_billing_amount: 22000,
          transaction_count: 1,
        },
        {
          customer_id: "CUST_B",
          service_type: "SERVICE_X",
          appointment_count: 7,
          contract_count: 3,
          total_revenue: 70000,
          calculated_billing_amount: 81000,
          transaction_count: 1,
        },
        {
          customer_id: "CUST_B",
          service_type: "SERVICE_Z",
          appointment_count: 2,
          contract_count: 1,
          total_revenue: 20000,
          calculated_billing_amount: 12000,
          transaction_count: 1,
        },
      ],
      summary: {
        total_transactions_extracted: 4,
        total_source_revenue: 170000,
        total_calculated_billing: 166000,
        customer_count: 2,
        service_count: 3,
        data_completeness_check: {
          missing_fields: [],
          duplicate_transactions: [],
          validation_passed: true,
        },
      },
    });

    // 検証: 集計データの合計値が元データと一致すること
    const source_total = raw_business_data.reduce(
      (sum, tx) => sum + tx.revenue_amount,
      0
    );
    const aggregated_total = result.summary.total_source_revenue;
    expect(aggregated_total).toBe(170000);
    expect(source_total).toBe(aggregated_total);

    // 検証: 各顧客ごとの集計が正確であること
    const cust_a_data = result.aggregated_data.filter(
      (item) => item.customer_id === "CUST_A"
    );
    expect(cust_a_data.length).toBe(2);
    expect(
      cust_a_data.reduce((sum, item) => sum + item.appointment_count, 0)
    ).toBe(8);
    expect(
      cust_a_data.reduce((sum, item) => sum + item.contract_count, 0)
    ).toBe(3);

    const cust_b_data = result.aggregated_data.filter(
      (item) => item.customer_id === "CUST_B"
    );
    expect(cust_b_data.length).toBe(2);
    expect(
      cust_b_data.reduce((sum, item) => sum + item.appointment_count, 0)
    ).toBe(9);
    expect(
      cust_b_data.reduce((sum, item) => sum + item.contract_count, 0)
    ).toBe(4);

    // 検証: サービス別の集計が正確であること
    const service_x_data = result.aggregated_data.filter(
      (item) => item.service_type === "SERVICE_X"
    );
    expect(service_x_data.length).toBe(2);
    expect(
      service_x_data.reduce((sum, item) => sum + item.total_revenue, 0)
    ).toBe(120000);
    expect(
      service_x_data.reduce(
        (sum, item) => sum + item.calculated_billing_amount,
        0
      )
    ).toBe(132000);

    // 検証: データ品質チェック - 欠損や重複がないこと
    expect(result.summary.data_completeness_check.validation_passed).toBe(
      true
    );
    expect(result.summary.data_completeness_check.missing_fields.length).toBe(
      0
    );
    expect(
      result.summary.data_completeness_check.duplicate_transactions.length
    ).toBe(0);

    // 検証: 抽出されたトランザクション数が正確であること
    expect(result.summary.total_transactions_extracted).toBe(4);
  });
});