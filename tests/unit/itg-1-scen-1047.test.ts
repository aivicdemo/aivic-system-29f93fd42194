import { extractEvidenceDataAndGenerateReport } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  test("SCEN-1047: 質問内容に対応する根拠データ自動抽出と説明資料生成 - 複数の営業データが条件に合致するとき全件が抽出され説明資料に含まれる", () => {
    // テストデータ: 特定期間・部門の営業データ
    const testSalesData = [
      {
        sales_data_id: "SD001",
        customer_name: "顧客A",
        contact_date: "2024-01-10",
        department: "営業部",
        sales_amount: 50000,
        status: "成約",
        product_category: "サービスA",
      },
      {
        sales_data_id: "SD002",
        customer_name: "顧客B",
        contact_date: "2024-01-15",
        department: "営業部",
        sales_amount: 75000,
        status: "成約",
        product_category: "サービスB",
      },
      {
        sales_data_id: "SD003",
        customer_name: "顧客C",
        contact_date: "2024-01-20",
        department: "営業部",
        sales_amount: 100000,
        status: "成約",
        product_category: "サービスA",
      },
      {
        sales_data_id: "SD004",
        customer_name: "顧客D",
        contact_date: "2024-02-05",
        department: "営業部",
        sales_amount: 60000,
        status: "成約",
        product_category: "サービスC",
      },
    ];

    // 質問条件: 2024年1月の営業部の売上データを抽出
    const inquiry_condition = {
      target_period_start: "2024-01-01",
      target_period_end: "2024-01-31",
      target_department: "営業部",
    };

    // 根拠データ自動抽出と説明資料生成を実行
    const result = extractEvidenceDataAndGenerateReport(
      testSalesData,
      inquiry_condition
    );

    // 期待: 条件に合致するデータは SD001, SD002, SD003 の 3 件
    const expected_extracted_count = 3;
    expect(result.extracted_data_count).toBe(expected_extracted_count);

    // 期待: 抽出されたデータに重複がないこと
    const extracted_ids = result.extracted_sales_ids;
    const unique_ids = new Set(extracted_ids);
    expect(unique_ids.size).toBe(extracted_ids.length);

    // 期待: 抽出されたデータは正確な件数
    expect(extracted_ids).toEqual(["SD001", "SD002", "SD003"]);

    // 期待: 説明資料に含まれるデータ件数が抽出件数と一致
    expect(result.report_content.included_data_count).toBe(
      expected_extracted_count
    );

    // 期待: 各データの詳細情報が正しく含まれていること
    expect(result.report_content.data_details).toHaveLength(
      expected_extracted_count
    );

    result.report_content.data_details.forEach((detail, index) => {
      expect(detail).toHaveProperty("sales_data_id");
      expect(detail).toHaveProperty("customer_name");
      expect(detail).toHaveProperty("contact_date");
      expect(detail).toHaveProperty("department");
      expect(detail).toHaveProperty("sales_amount");
      expect(detail).toHaveProperty("status");
      expect(detail).toHaveProperty("product_category");

      // 期待: 詳細情報の値が正確であること
      if (index === 0) {
        expect(detail.sales_data_id).toBe("SD001");
        expect(detail.customer_name).toBe("顧客A");
        expect(detail.sales_amount).toBe(50000);
      } else if (index === 1) {
        expect(detail.sales_data_id).toBe("SD002");
        expect(detail.customer_name).toBe("顧客B");
        expect(detail.sales_amount).toBe(75000);
      } else if (index === 2) {
        expect(detail.sales_data_id).toBe("SD003");
        expect(detail.customer_name).toBe("顧客C");
        expect(detail.sales_amount).toBe(100000);
      }
    });

    // 期待: 生成された説明資料が有効な状態
    expect(result.report_status).toBe("generated");
    expect(result.report_generated_at).toBeTruthy();

    // 期待: 説明資料内に期間条件と部門条件が正しく記録されていること
    expect(result.report_content.query_conditions).toEqual({
      period_start: "2024-01-01",
      period_end: "2024-01-31",
      department: "営業部",
    });

    // 期待: 説明資料に集計サマリーが含まれていること
    expect(result.report_content.summary).toBeDefined();
    expect(result.report_content.summary.total_sales_amount).toBe(225000); // 50000 + 75000 + 100000
    expect(result.report_content.summary.average_sales_amount).toBe(75000); // 225000 / 3
  });
});