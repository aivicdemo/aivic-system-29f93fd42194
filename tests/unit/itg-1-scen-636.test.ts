import {
  detectSalesDataQualityIssues,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質異常検出・補正指示生成機能", () => {
  // SCEN-636: [normal] 営業データ品質異常検出・補正指示生成機能 - 月次営業データの異常値と漏れが正確に検出され、補正指示が生成される
  test("月次営業データから異常値と漏れを検出し、補正指示を生成する", () => {
    const salesData = [
      {
        record_id: "REC001",
        sales_amount: 150000,
        customer_id: "CUST001",
        product_code: "PROD001",
        transaction_date: "2024-01-15",
      },
      {
        record_id: "REC002",
        sales_amount: -50000,
        customer_id: "CUST_INVALID",
        product_code: "PROD002",
        transaction_date: "2024-01-16",
      },
      {
        record_id: "REC003",
        sales_amount: 200000,
        customer_id: "CUST003",
        product_code: null,
        transaction_date: "2024-01-17",
      },
      {
        record_id: "REC004",
        sales_amount: 120000,
        customer_id: "CUST004",
        product_code: "PROD_NONEXISTENT",
        transaction_date: "",
      },
      {
        record_id: "REC005",
        sales_amount: 0,
        customer_id: "",
        product_code: "PROD005",
        transaction_date: "2024-01-19",
      },
    ];

    const validCustomerIds = ["CUST001", "CUST003", "CUST004", "CUST005"];
    const validProductCodes = ["PROD001", "PROD002", "PROD005", "PROD006"];
    const minSalesAmount = 1000;
    const maxSalesAmount = 1000000;

    const result = detectSalesDataQualityIssues(
      salesData,
      validCustomerIds,
      validProductCodes,
      minSalesAmount,
      maxSalesAmount
    );

    expect(result).toBeDefined();
    expect(result.total_records).toBe(5);
    expect(result.issues_detected).toBe(4);
    expect(result.anomalies).toBeDefined();
    expect(Array.isArray(result.anomalies)).toBe(true);
    expect(result.anomalies.length).toBe(4);

    const anomaly_rec002 = result.anomalies.find(
      (a: any) => a.record_id === "REC002"
    );
    expect(anomaly_rec002).toBeDefined();
    expect(anomaly_rec002.anomaly_type).toMatch(/金額|顧客ID/);
    expect(anomaly_rec002.severity).toBeDefined();

    const anomaly_rec003 = result.anomalies.find(
      (a: any) => a.record_id === "REC003"
    );
    expect(anomaly_rec003).toBeDefined();
    expect(anomaly_rec003.anomaly_type).toMatch(/商品コード/);
    expect(anomaly_rec003.details).toMatch(/NULL/);

    const anomaly_rec004 = result.anomalies.find(
      (a: any) => a.record_id === "REC004"
    );
    expect(anomaly_rec004).toBeDefined();
    expect(anomaly_rec004.anomaly_type).toMatch(/取引日付|商品コード/);

    const anomaly_rec005 = result.anomalies.find(
      (a: any) => a.record_id === "REC005"
    );
    expect(anomaly_rec005).toBeDefined();
    expect(anomaly_rec005.anomaly_type).toMatch(/金額|顧客ID/);

    expect(result.corrections).toBeDefined();
    expect(Array.isArray(result.corrections)).toBe(true);
    expect(result.corrections.length).toBe(4);

    const correction_rec002 = result.corrections.find(
      (c: any) => c.record_id === "REC002"
    );
    expect(correction_rec002).toBeDefined();
    expect(correction_rec002.correction_type).toBeDefined();
    expect(correction_rec002.recommended_action).toBeDefined();
    expect(correction_rec002.priority).toMatch(/高|中|低/);

    const correction_rec003 = result.corrections.find(
      (c: any) => c.record_id === "REC003"
    );
    expect(correction_rec003).toBeDefined();
    expect(correction_rec003.recommended_action).toMatch(/補正|確認/);

    expect(result.generated_at).toBeDefined();
    expect(typeof result.generated_at).toBe("string");
    const timestamp = new Date(result.generated_at);
    expect(timestamp.getFullYear()).toBe(2024);

    expect(result.metadata).toBeDefined();
    expect(result.metadata.batch_id).toBeDefined();
    expect(result.metadata.total_anomalies).toBe(4);
    expect(result.metadata.total_corrections_generated).toBe(4);
    expect(result.metadata.processing_status).toMatch(/完了|処理済み/);
  });
});