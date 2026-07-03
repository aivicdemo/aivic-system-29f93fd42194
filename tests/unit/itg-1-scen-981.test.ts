import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  calculateMonthlySummary,
  validateSummaryTemplate,
  generateInvoicesForMonth,
  trackProcessingTime,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレート定義・管理機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-981: [normal] 月次請求自動化機能 - 月次請求業務がSLA期限内に完了する
  test("should complete monthly invoicing within SLA deadline of 3 business days", () => {
    // Setup: 処理開始時刻（月初営業日）
    const processStartTime = new Date("2024-02-01T09:00:00Z"); // 2月1日（木）

    // Setup: SLA期限（月初3営業日以内 = 2月5日の営業日終了時）
    const slaDeadlineTime = new Date("2024-02-05T17:59:59Z");

    // Setup: 請求対象期間設定
    const billingPeriod = {
      startDate: "2024-02-01",
      endDate: "2024-02-29",
    };

    // Setup: 対象顧客データ（100件以上）
    const customerDataSet = Array.from({ length: 120 }, (_, idx) => ({
      customer_id: `CUST_${String(idx + 1).padStart(6, "0")}`,
      customer_name: `Customer ${idx + 1}`,
      service_type: idx % 3 === 0 ? "serviceA" : idx % 3 === 1 ? "serviceB" : "serviceC",
      contract_amount: 50000 + idx * 1000,
      billing_address: `Address ${idx + 1}`,
      email: `customer${idx + 1}@example.com`,
      status: "active",
    }));

    // Setup: 請求書テンプレート定義
    const invoiceTemplate = {
      template_id: "TMPL_INVOICE_001",
      template_name: "Standard Monthly Invoice",
      template_version: "1.0",
      fields: [
        { field_name: "invoice_number", required: true, format: "text" },
        { field_name: "customer_name", required: true, format: "text" },
        { field_name: "billing_amount", required: true, format: "currency" },
        { field_name: "service_description", required: true, format: "text" },
        { field_name: "billing_period", required: true, format: "date_range" },
      ],
      output_format: "PDF",
      email_enabled: true,
    };

    // Action: テンプレート検証
    const templateValidation = validateSummaryTemplate(invoiceTemplate);
    expect(templateValidation.is_valid).toBe(true);
    expect(templateValidation.error_count).toBe(0);

    // Action: 月次サマリー計算
    const monthlySummary = calculateMonthlySummary({
      period_start: billingPeriod.startDate,
      period_end: billingPeriod.endDate,
      customer_count: customerDataSet.length,
      template_id: invoiceTemplate.template_id,
    });

    expect(monthlySummary.summary_id).toBeTruthy();
    expect(monthlySummary.total_customers).toBe(120);
    expect(monthlySummary.billing_period_start).toBe("2024-02-01");
    expect(monthlySummary.billing_period_end).toBe("2024-02-29");
    expect(monthlySummary.status).toBe("ready");

    // Action: 請求書自動生成処理を開始
    const generationStartTime = new Date(processStartTime);
    const invoiceGenerationResult = generateInvoicesForMonth({
      summary_id: monthlySummary.summary_id,
      customer_list: customerDataSet,
      template_id: invoiceTemplate.template_id,
      billing_period: billingPeriod,
      output_format: invoiceTemplate.output_format,
      send_email: invoiceTemplate.email_enabled,
    });

    expect(invoiceGenerationResult.generated_count).toBe(120);
    expect(invoiceGenerationResult.failed_count).toBe(0);
    expect(invoiceGenerationResult.all_invoices_valid).toBe(true);

    // Action: 処理実行時間を測定
    const processingMetrics = trackProcessingTime({
      process_start: generationStartTime.toISOString(),
      process_type: "monthly_invoice_generation",
      customer_count: 120,
    });

    expect(processingMetrics.elapsed_seconds).toBeLessThan(180); // 3分以内
    expect(processingMetrics.average_seconds_per_customer).toBeLessThan(1.5); // 顧客あたり1.5秒以内

    // Assertion: 請求書生成完了時刻
    const processEndTime = new Date(
      generationStartTime.getTime() + processingMetrics.elapsed_seconds * 1000
    );
    expect(processEndTime.getTime()).toBeLessThanOrEqual(slaDeadlineTime.getTime());

    // Assertion: SLA期限内での完了確認
    const time_to_deadline_hours =
      (slaDeadlineTime.getTime() - processEndTime.getTime()) / (1000 * 60 * 60);
    expect(time_to_deadline_hours).toBeGreaterThan(0);

    // Assertion: 生成された請求書の内容確認
    expect(invoiceGenerationResult.sample_invoice).toBeDefined();
    expect(invoiceGenerationResult.sample_invoice.invoice_number).toBeTruthy();
    expect(invoiceGenerationResult.sample_invoice.customer_name).toBeTruthy();
    expect(invoiceGenerationResult.sample_invoice.billing_amount).toBeGreaterThan(0);
    expect(invoiceGenerationResult.sample_invoice.service_description).toBeTruthy();

    // Assertion: 出力形式（PDF）検証
    expect(invoiceGenerationResult.output_format).toBe("PDF");
    expect(invoiceGenerationResult.pdf_files_created).toBe(120);

    // Assertion: メール送信実行の確認
    expect(invoiceGenerationResult.email_send_initiated).toBe(true);
    expect(invoiceGenerationResult.email_recipients_count).toBe(120);

    // Assertion: ログに記録される完了時刻確認
    expect(invoiceGenerationResult.process_log).toBeDefined();
    expect(invoiceGenerationResult.process_log.completion_timestamp).toBeLessThanOrEqual(
      slaDeadlineTime.toISOString()
    );

    // Assertion: 全体の処理成功確認
    expect(invoiceGenerationResult.overall_status).toBe("completed_successfully");
    expect(invoiceGenerationResult.compliance_status).toBe("within_sla");
  });
});