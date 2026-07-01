import { describe, test, expect } from "@jest/globals";
import {
  generateReportWithTemplate,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-601: 複数の項目が定義されたテンプレートからレポートを生成し、すべての項目が正確に反映されることを検証", () => {
    // テンプレート定義：10項目以上の複合構成
    const template = {
      id: "template_001",
      name: "月次請求レポート",
      version: 1,
      items: [
        {
          item_id: "item_001",
          order: 1,
          name: "請求日",
          data_type: "date",
          format: "YYYY-MM-DD",
          source_field: "billing_date",
        },
        {
          item_id: "item_002",
          order: 2,
          name: "請求先",
          data_type: "string",
          format: "text",
          source_field: "customer_name",
        },
        {
          item_id: "item_003",
          order: 3,
          name: "請求先住所",
          data_type: "string",
          format: "text",
          source_field: "customer_address",
        },
        {
          item_id: "item_004",
          order: 4,
          name: "請求番号",
          data_type: "string",
          format: "text",
          source_field: "invoice_number",
        },
        {
          item_id: "item_005",
          order: 5,
          name: "請求金額",
          data_type: "number",
          format: "currency_jpy",
          precision: 0,
          source_field: "total_amount",
        },
        {
          item_id: "item_006",
          order: 6,
          name: "税額",
          data_type: "number",
          format: "currency_jpy",
          precision: 0,
          source_field: "tax_amount",
        },
        {
          item_id: "item_007",
          order: 7,
          name: "納期",
          data_type: "date",
          format: "YYYY-MM-DD",
          source_field: "due_date",
        },
        {
          item_id: "item_008",
          order: 8,
          name: "摘要",
          data_type: "string",
          format: "text",
          source_field: "remarks",
        },
        {
          item_id: "item_009",
          order: 9,
          name: "成約数",
          data_type: "number",
          format: "integer",
          precision: 0,
          source_field: "contract_count",
        },
        {
          item_id: "item_010",
          order: 10,
          name: "アポ数",
          data_type: "number",
          format: "integer",
          precision: 0,
          source_field: "appointment_count",
        },
        {
          item_id: "item_011",
          order: 11,
          name: "割引率",
          data_type: "number",
          format: "percentage",
          precision: 2,
          source_field: "discount_rate",
        },
      ],
    };

    // 営業データ入力
    const businessData = {
      billing_date: "2024-01-25",
      customer_name: "株式会社テストクライアント",
      customer_address: "東京都渋谷区1-2-3\nビジネスビル5F",
      invoice_number: "INV-20240125-001",
      total_amount: 500000,
      tax_amount: 50000,
      due_date: "2024-02-25",
      remarks: "サービス利用料\n2024年1月分",
      contract_count: 5,
      appointment_count: 12,
      discount_rate: 10.5,
    };

    // レポート生成パラメータ
    const generateParams = {
      template_id: "template_001",
      period_start: "2024-01-01",
      period_end: "2024-01-31",
      customer_id: "cust_123",
      service_id: "svc_456",
    };

    // レポート生成実行
    const generatedReport = generateReportWithTemplate(
      template,
      businessData,
      generateParams
    );

    // 検証 1: レポートが正常に生成されている
    expect(generatedReport).toBeDefined();
    expect(generatedReport.status).toBe("success");

    // 検証 2: 生成されたレポートが正確なデータ型を保持
    const reportContent = generatedReport.content;
    expect(typeof reportContent).toBe("object");

    // 検証 3: 全11項目がすべてレポートに含まれている
    expect(Object.keys(reportContent)).toHaveLength(11);

    // 検証 4: 項目の順序がテンプレート定義通りである
    const reportKeys = Object.keys(reportContent);
    expect(reportKeys[0]).toBe("billing_date");
    expect(reportKeys[1]).toBe("customer_name");
    expect(reportKeys[2]).toBe("customer_address");
    expect(reportKeys[3]).toBe("invoice_number");
    expect(reportKeys[4]).toBe("total_amount");
    expect(reportKeys[5]).toBe("tax_amount");
    expect(reportKeys[6]).toBe("due_date");
    expect(reportKeys[7]).toBe("remarks");
    expect(reportKeys[8]).toBe("contract_count");
    expect(reportKeys[9]).toBe("appointment_count");
    expect(reportKeys[10]).toBe("discount_rate");

    // 検証 5: 日付フォーマットが正確に反映（請求日）
    expect(reportContent.billing_date).toBe("2024-01-25");

    // 検証 6: 文字列型データが正確に反映（請求先）
    expect(reportContent.customer_name).toBe("株式会社テストクライアント");

    // 検証 7: 改行を含む複数行テキストが正確に反映（住所）
    expect(reportContent.customer_address).toBe(
      "東京都渋谷区1-2-3\nビジネスビル5F"
    );

    // 検証 8: 数値型で通貨フォーマット適用（請求金額）
    expect(reportContent.total_amount).toBe(500000);
    expect(typeof reportContent.total_amount).toBe("number");

    // 検証 9: 数値型で通貨フォーマット適用（税額）
    expect(reportContent.tax_amount).toBe(50000);

    // 検証 10: 納期が日付形式で正確に反映
    expect(reportContent.due_date).toBe("2024-02-25");

    // 検証 11: 改行を含む摘要欄が正確に反映
    expect(reportContent.remarks).toBe("サービス利用料\n2024年1月分");

    // 検証 12: 成約数が整数型で正確に反映
    expect(reportContent.contract_count).toBe(5);
    expect(typeof reportContent.contract_count).toBe("number");

    // 検証 13: アポ数が整数型で正確に反映
    expect(reportContent.appointment_count).toBe(12);
    expect(typeof reportContent.appointment_count).toBe("number");

    // 検証 14: 小数精度 2 桁が正確に反映（割引率）
    expect(reportContent.discount_rate).toBe(10.5);
    const discountRateStr = reportContent.discount_rate.toString();
    const decimalPart = discountRateStr.split(".")[1];
    expect(decimalPart ? decimalPart.length : 0).toBeLessThanOrEqual(2);

    // 検証 15: テンプレートメタデータが生成レポートに付加されている
    expect(generatedReport.template_id).toBe("template_001");
    expect(generatedReport.template_version).toBe(1);

    // 検証 16: 生成されたレポートに欠落がないことを確認
    template.items.forEach((item) => {
      expect(reportContent[item.source_field]).toBeDefined();
    });

    // 検証 17: データ型の正確性を全項目で検証
    expect(typeof reportContent.billing_date).toBe("string");
    expect(typeof reportContent.customer_name).toBe("string");
    expect(typeof reportContent.customer_address).toBe("string");
    expect(typeof reportContent.invoice_number).toBe("string");
    expect(typeof reportContent.total_amount).toBe("number");
    expect(typeof reportContent.tax_amount).toBe("number");
    expect(typeof reportContent.due_date).toBe("string");
    expect(typeof reportContent.remarks).toBe("string");
    expect(typeof reportContent.contract_count).toBe("number");
    expect(typeof reportContent.appointment_count).toBe("number");
    expect(typeof reportContent.discount_rate).toBe("number");

    // 検証 18: 生成タイムスタンプが記録されている
    expect(generatedReport.generated_at).toBeDefined();
    expect(typeof generatedReport.generated_at).toBe("string");

    // 検証 19: 生成されたレポートにパラメータが紐付いている
    expect(generatedReport.period_start).toBe("2024-01-01");
    expect(generatedReport.period_end).toBe("2024-01-31");
    expect(generatedReport.customer_id).toBe("cust_123");

    // 検証 20: 全項目の数値が許容誤差範囲内であることを確認
    expect(reportContent.total_amount).toBeGreaterThan(0);
    expect(reportContent.tax_amount).toBeGreaterThanOrEqual(0);
    expect(reportContent.contract_count).toBeGreaterThanOrEqual(0);
    expect(reportContent.appointment_count).toBeGreaterThanOrEqual(0);
    expect(reportContent.discount_rate).toBeGreaterThanOrEqual(0);
    expect(reportContent.discount_rate).toBeLessThanOrEqual(100);
  });
});