import { generateMonthlySummary } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次営業成果サマリー自動生成機能", () => {
  test("SCEN-902: 月末日時点でのデータスナップショットが正しくサマリーに反映される", () => {
    // 初期状態: 月初1日のダミー営業データ
    const initialData = [
      {
        id: "sale_001",
        date: "2024-01-01T00:00:00Z",
        amount: 100000,
        count: 5,
        customer_id: "cust_001",
        service_type: "service_a",
      },
      {
        id: "sale_002",
        date: "2024-01-01T12:00:00Z",
        amount: 150000,
        count: 3,
        customer_id: "cust_002",
        service_type: "service_b",
      },
    ];

    // 月中15日のデータ更新・追加
    const midMonthData = [
      {
        id: "sale_003",
        date: "2024-01-15T10:30:00Z",
        amount: 200000,
        count: 8,
        customer_id: "cust_001",
        service_type: "service_a",
      },
      {
        id: "sale_004",
        date: "2024-01-15T14:00:00Z",
        amount: 120000,
        count: 4,
        customer_id: "cust_003",
        service_type: "service_c",
      },
    ];

    // 月末日23:59:59時点の最後のデータ
    const endOfMonthData = [
      {
        id: "sale_005",
        date: "2024-01-31T23:59:59Z",
        amount: 180000,
        count: 6,
        customer_id: "cust_002",
        service_type: "service_b",
      },
    ];

    // 翌月1日以降のデータ（除外対象）
    const nextMonthData = [
      {
        id: "sale_006",
        date: "2024-02-01T00:00:00Z",
        amount: 250000,
        count: 10,
        customer_id: "cust_004",
        service_type: "service_a",
      },
    ];

    // すべてのデータを結合して生成関数に渡す
    const allData = [
      ...initialData,
      ...midMonthData,
      ...endOfMonthData,
      ...nextMonthData,
    ];

    // 月末日23:59:59時点でのサマリー生成を実行
    const snapshotTimestamp = "2024-01-31T23:59:59Z";
    const generatedSummary = generateMonthlySummary({
      sales_data: allData,
      snapshot_date: snapshotTimestamp,
      month: "2024-01",
      fiscal_year: 2024,
    });

    // 検証1: サマリーが生成されていること
    expect(generatedSummary).toBeDefined();
    expect(generatedSummary.month).toBe("2024-01");

    // 検証2: 月末日23:59:59までのデータが含まれていること
    // 対象データ: sale_001, sale_002, sale_003, sale_004, sale_005 (5件)
    expect(generatedSummary.total_count).toBe(5);

    // 検証3: 売上金額の合計が正確に計算されていること
    // 100000 + 150000 + 200000 + 120000 + 180000 = 750000
    expect(generatedSummary.total_amount).toBe(750000);

    // 検証4: 営業データの件数が正確に計算されていること
    // 5 + 3 + 8 + 4 + 6 = 26
    expect(generatedSummary.total_items).toBe(26);

    // 検証5: 顧客数が正確に計算されていること
    // 顧客: cust_001, cust_002, cust_003 (3顧客)
    expect(generatedSummary.unique_customer_count).toBe(3);

    // 検証6: 翌月1日以降のデータが除外されていること
    // sale_006は含まれていないため、total_countは5のままであること
    expect(generatedSummary.included_sales_ids).not.toContain("sale_006");
    expect(generatedSummary.included_sales_ids).toContain("sale_001");
    expect(generatedSummary.included_sales_ids).toContain("sale_002");
    expect(generatedSummary.included_sales_ids).toContain("sale_003");
    expect(generatedSummary.included_sales_ids).toContain("sale_004");
    expect(generatedSummary.included_sales_ids).toContain("sale_005");

    // 検証7: サービス別の集計が正確であること
    // service_a: 100000 + 200000 = 300000 (5+8=13件)
    // service_b: 150000 + 180000 = 330000 (3+6=9件)
    // service_c: 120000 (4件)
    expect(generatedSummary.service_breakdown).toEqual({
      service_a: { total_amount: 300000, total_items: 13 },
      service_b: { total_amount: 330000, total_items: 9 },
      service_c: { total_amount: 120000, total_items: 4 },
    });

    // 検証8: 顧客別の集計が正確であること
    // cust_001: 100000 + 200000 = 300000 (5+8=13件)
    // cust_002: 150000 + 180000 = 330000 (3+6=9件)
    // cust_003: 120000 (4件)
    expect(generatedSummary.customer_breakdown).toEqual({
      cust_001: { total_amount: 300000, total_items: 13 },
      cust_002: { total_amount: 330000, total_items: 9 },
      cust_003: { total_amount: 120000, total_items: 4 },
    });

    // 検証9: スナップショット時刻が正確に記録されていること
    expect(generatedSummary.snapshot_timestamp).toBe(
      "2024-01-31T23:59:59Z"
    );

    // 検証10: 前月のサマリーとの境界が明確に分離されていること
    expect(generatedSummary.period_start).toBe("2024-01-01T00:00:00Z");
    expect(generatedSummary.period_end).toBe("2024-01-31T23:59:59Z");

    // 検証11: データ品質フラグが正常であること
    expect(generatedSummary.data_quality_status).toBe("VALID");

    // 検証12: 翌月のデータを含むサマリーを生成して月が異なることを確認
    const nextMonthSummary = generateMonthlySummary({
      sales_data: allData,
      snapshot_date: "2024-02-29T23:59:59Z",
      month: "2024-02",
      fiscal_year: 2024,
    });

    // 翌月のサマリーには sale_006 のみが含まれるべき
    expect(nextMonthSummary.month).toBe("2024-02");
    expect(nextMonthSummary.total_count).toBe(1);
    expect(nextMonthSummary.total_amount).toBe(250000);
    expect(nextMonthSummary.included_sales_ids).toContain("sale_006");
    expect(nextMonthSummary.included_sales_ids).not.toContain("sale_001");
  });
});