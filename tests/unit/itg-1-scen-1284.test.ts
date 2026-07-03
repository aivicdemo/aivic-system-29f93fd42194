import { describeMonthlySummaryTemplate } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-1284: 配信対象顧客が1件のみの場合、当該顧客にレポートが配信される", () => {
    // テストデータ: 配信対象となる顧客を1件のみ設定
    const templateDefinition = {
      template_id: "tpl_monthly_001",
      template_name: "月次成果レポート",
      description: "営業成果の月次集計レポート",
      distribution_rules: {
        target_customers: [
          {
            customer_id: "cust_001",
            customer_name: "顧客A株式会社",
            contract_id: "cont_001",
            distribution_enabled: true,
            delivery_channel: "email",
            recipient_email: "manager@customer-a.jp",
          },
        ],
        distribution_timing: "monthly_end",
        distribution_timezone: "Asia/Tokyo",
      },
      template_sections: [
        {
          section_id: "sec_001",
          section_name: "営業成果指標",
          sort_order: 1,
          visible: true,
          calculation_logic: "COUNT(appointments) as appointments_count",
        },
        {
          section_id: "sec_002",
          section_name: "契約件数",
          sort_order: 2,
          visible: true,
          calculation_logic: "COUNT(contracts) as contracts_count",
        },
      ],
      created_at: "2024-01-01T09:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
      created_by: "admin_001",
    };

    const monthlyData = {
      month: "2024-01",
      reporting_period_start: "2024-01-01",
      reporting_period_end: "2024-01-31",
      customer_id: "cust_001",
      data_points: {
        appointments_count: 12,
        contracts_count: 3,
        customer_response_rate: 0.85,
        service_type: "Premium",
      },
    };

    const result = describeMonthlySummaryTemplate({
      template_definition: templateDefinition,
      monthly_data: monthlyData,
      action: "generate_and_deliver",
    });

    // 定義済みルール（配信条件）を確認し、該当する顧客が1件であることを検証
    expect(result.applicable_customers).toHaveLength(1);
    expect(result.applicable_customers[0].customer_id).toBe("cust_001");
    expect(result.applicable_customers[0].customer_name).toBe("顧客A株式会社");

    // 自動配信機能が実行されたことを検証
    expect(result.distribution_status).toBe("completed");
    expect(result.distribution_executed).toBe(true);

    // 配信ログを確認し、対象顧客に対して配信が実行されたことを検証
    expect(result.delivery_logs).toHaveLength(1);
    const deliveryLog = result.delivery_logs[0];
    expect(deliveryLog.customer_id).toBe("cust_001");
    expect(deliveryLog.delivery_channel).toBe("email");
    expect(deliveryLog.recipient_email).toBe("manager@customer-a.jp");
    expect(deliveryLog.delivery_status).toBe("sent");
    expect(deliveryLog.sent_at).toBe("2024-01-31T15:30:00Z");

    // 対象顧客がレポートを受信したことを確認
    expect(deliveryLog.delivery_confirmed).toBe(true);
    expect(deliveryLog.received_at).toBe("2024-01-31T15:31:15Z");

    // 配信されたレポートの内容が正確であることを検証
    expect(result.generated_report).toEqual({
      report_id: "rpt_001",
      template_id: "tpl_monthly_001",
      customer_id: "cust_001",
      month: "2024-01",
      report_title: "月次成果レポート - 2024年1月",
      sections: [
        {
          section_id: "sec_001",
          section_name: "営業成果指標",
          sort_order: 1,
          calculated_value: 12,
          display_format: "appointments_count",
          unit: "件",
        },
        {
          section_id: "sec_002",
          section_name: "契約件数",
          sort_order: 2,
          calculated_value: 3,
          display_format: "contracts_count",
          unit: "件",
        },
      ],
      generated_at: "2024-01-31T14:00:00Z",
      content_hash: "hash_abc123def456",
    });

    // 配信ステータスが「完了」に更新されていることを確認
    expect(result.distribution_status).toBe("completed");
    expect(result.overall_success).toBe(true);

    // 配信実行の詳細メトリクスを検証
    expect(result.distribution_metrics).toEqual({
      total_customers_targeted: 1,
      successfully_delivered: 1,
      failed_deliveries: 0,
      delivery_rate: 1.0,
      average_delivery_time_seconds: 75,
    });

    // 配信対象顧客が正確に1件であることを再確認
    expect(result.delivery_logs.filter((log) => log.delivery_status === "sent"))
      .toHaveLength(1);
  });
});