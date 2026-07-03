import {
  generateAndDistributeInvoiceAndReport,
} from "../../src/logic/it-1-2-1";

describe("請求書・報告書配信機能", () => {
  // SCEN-932: [normal] 請求書・報告書配信機能 - 顧客企業種別・契約内容・配信先設定に基づき、正しい形式で正しい宛先に配信される
  test("顧客企業種別・契約内容・配信先設定に基づいて正しい形式で配信される", () => {
    const customerData = [
      {
        customer_id: "CUST-001",
        customer_name: "製造業A社",
        industry_type: "manufacturing",
        contract_type: "standard",
        contract_id: "CTR-001",
        service_names: ["営業支援", "データ分析"],
        billing_amount: 500000,
        delivery_settings: [
          {
            delivery_id: "DEL-001",
            recipient_name: "山田太郎",
            email: "yamada@company-a.jp",
            delivery_format: "PDF",
            delivery_method: "email",
          },
          {
            delivery_id: "DEL-002",
            postal_address: "東京都渋谷区1-1-1",
            delivery_format: "paper",
            delivery_method: "postal",
          },
        ],
      },
      {
        customer_id: "CUST-002",
        customer_name: "小売業B社",
        industry_type: "retail",
        contract_type: "premium",
        contract_id: "CTR-002",
        service_names: ["営業支援", "レポート生成"],
        billing_amount: 750000,
        delivery_settings: [
          {
            delivery_id: "DEL-003",
            recipient_name: "鈴木花子",
            email: "suzuki@company-b.jp",
            delivery_format: "Excel",
            delivery_method: "email",
          },
          {
            delivery_id: "DEL-004",
            recipient_name: "佐藤次郎",
            email: "sato@company-b.jp",
            delivery_format: "Excel",
            delivery_method: "email",
          },
        ],
      },
      {
        customer_id: "CUST-003",
        customer_name: "サービス業C社",
        industry_type: "service",
        contract_type: "custom",
        contract_id: "CTR-003",
        service_names: ["営業支援"],
        billing_amount: 1000000,
        delivery_settings: [
          {
            delivery_id: "DEL-005",
            recipient_name: "田中三郎",
            email: "tanaka@company-c.jp",
            delivery_format: "PDF",
            delivery_method: "email",
          },
        ],
      },
    ];

    const result = generateAndDistributeInvoiceAndReport(customerData);

    // 全顧客のレコードが生成されているか検証
    expect(result.total_customers_processed).toBe(3);

    // 全配信先が処理されているか検証
    expect(result.total_delivery_targets_processed).toBe(5);

    // 成功した配信の件数検証
    expect(result.successful_deliveries).toBe(5);

    // 失敗した配信の件数検証
    expect(result.failed_deliveries).toBe(0);

    // 配信ログ内容検証
    expect(result.delivery_logs).toHaveLength(5);

    // 製造業A社のメール配信ログ検証
    const manufacturing_email_log = result.delivery_logs[0];
    expect(manufacturing_email_log.customer_id).toBe("CUST-001");
    expect(manufacturing_email_log.customer_name).toBe("製造業A社");
    expect(manufacturing_email_log.industry_type).toBe("manufacturing");
    expect(manufacturing_email_log.contract_type).toBe("standard");
    expect(manufacturing_email_log.delivery_method).toBe("email");
    expect(manufacturing_email_log.recipient_email).toBe("yamada@company-a.jp");
    expect(manufacturing_email_log.document_format).toBe("PDF");
    expect(manufacturing_email_log.delivery_status).toBe("success");
    expect(manufacturing_email_log.delivery_timestamp).toBe(
      "2024-01-15T09:00:00Z"
    );
    expect(manufacturing_email_log.invoice_generated).toBe(true);
    expect(manufacturing_email_log.report_generated).toBe(true);

    // 製造業A社の郵送配信ログ検証
    const manufacturing_postal_log = result.delivery_logs[1];
    expect(manufacturing_postal_log.customer_id).toBe("CUST-001");
    expect(manufacturing_postal_log.delivery_method).toBe("postal");
    expect(manufacturing_postal_log.postal_address).toBe(
      "東京都渋谷区1-1-1"
    );
    expect(manufacturing_postal_log.document_format).toBe("paper");
    expect(manufacturing_postal_log.delivery_status).toBe("success");
    expect(manufacturing_postal_log.queued_for_postal_processing).toBe(true);

    // 小売業B社第1受取人のExcel配信ログ検証
    const retail_email_log_1 = result.delivery_logs[2];
    expect(retail_email_log_1.customer_id).toBe("CUST-002");
    expect(retail_email_log_1.customer_name).toBe("小売業B社");
    expect(retail_email_log_1.industry_type).toBe("retail");
    expect(retail_email_log_1.contract_type).toBe("premium");
    expect(retail_email_log_1.delivery_method).toBe("email");
    expect(retail_email_log_1.recipient_email).toBe("suzuki@company-b.jp");
    expect(retail_email_log_1.document_format).toBe("Excel");
    expect(retail_email_log_1.delivery_status).toBe("success");

    // 小売業B社第2受取人のExcel配信ログ検証
    const retail_email_log_2 = result.delivery_logs[3];
    expect(retail_email_log_2.customer_id).toBe("CUST-002");
    expect(retail_email_log_2.recipient_email).toBe("sato@company-b.jp");
    expect(retail_email_log_2.document_format).toBe("Excel");
    expect(retail_email_log_2.delivery_status).toBe("success");

    // サービス業C社のPDF配信ログ検証
    const service_email_log = result.delivery_logs[4];
    expect(service_email_log.customer_id).toBe("CUST-003");
    expect(service_email_log.customer_name).toBe("サービス業C社");
    expect(service_email_log.industry_type).toBe("service");
    expect(service_email_log.contract_type).toBe("custom");
    expect(service_email_log.delivery_method).toBe("email");
    expect(service_email_log.recipient_email).toBe("tanaka@company-c.jp");
    expect(service_email_log.document_format).toBe("PDF");
    expect(service_email_log.delivery_status).toBe("success");

    // 契約内容に応じたカスタマイズ検証
    expect(result.contract_customization_applied).toEqual({
      "CTR-001": "standard_format",
      "CTR-002": "premium_format",
      "CTR-003": "custom_format",
    });

    // 企業種別別フォーマット検証
    expect(result.industry_format_mapping).toEqual({
      manufacturing: "manufacturing_standard",
      retail: "retail_premium",
      service: "service_custom",
    });

    // 全体の配信成功率検証
    expect(result.overall_delivery_success_rate).toBe(1.0);

    // 配信完了フラグが立っているか検証
    expect(result.distribution_complete).toBe(true);
  });
});