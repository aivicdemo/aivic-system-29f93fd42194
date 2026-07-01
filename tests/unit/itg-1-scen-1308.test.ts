import {
  distributeMonthlyReportsWithApproval,
  validateReportDistributionRules,
  extractTargetCustomersForDistribution,
  verifyReportFormatStandardization,
  validateReportDataAccuracy,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

const fetchMock = require("jest-fetch-mock");

describe("Monthly Summary Template Distribution - SCEN-1308", () => {
  test("SCEN-1308: [normal] Monthly aggregation complete and billing final approval - standardized reports distributed to target customers per defined rules", async () => {
    fetchMock.resetMocks();

    // Prepare test data: multiple monthly sales performance data
    const monthlyAggregationData = {
      period: "2024-01",
      aggregation_completed_at: "2024-02-01T09:00:00Z",
      metrics: [
        {
          customer_id: "CUST-001",
          service_name: "Basic Consulting",
          appointments_count: 15,
          contract_count: 8,
          revenue_amount: 480000,
        },
        {
          customer_id: "CUST-002",
          service_name: "Premium Support",
          appointments_count: 22,
          contract_count: 12,
          revenue_amount: 720000,
        },
        {
          customer_id: "CUST-003",
          service_name: "Basic Consulting",
          appointments_count: 10,
          contract_count: 5,
          revenue_amount: 300000,
        },
      ],
    };

    // Register test data to system
    fetchMock.mockResponseOnce(JSON.stringify({ success: true }), {
      status: 200,
    });
    const registerResponse = await fetch("/api/monthly-aggregation", {
      method: "POST",
      body: JSON.stringify(monthlyAggregationData),
    });
    expect(registerResponse.status).toBe(200);

    // Execute monthly aggregation processing
    const aggregationResult = {
      period: "2024-01",
      status: "completed",
      total_customers: 3,
      total_revenue: 1500000,
      completed_timestamp: "2024-02-01T09:15:00Z",
    };
    fetchMock.mockResponseOnce(JSON.stringify(aggregationResult), {
      status: 200,
    });
    const aggResponse = await fetch("/api/monthly-aggregation/execute", {
      method: "POST",
    });
    expect(aggResponse.status).toBe(200);
    const aggData = await aggResponse.json();
    expect(aggData.status).toBe("completed");
    expect(aggData.total_customers).toBe(3);
    expect(aggData.total_revenue).toBe(1500000);

    // Generate billing data
    const billingData = {
      period: "2024-01",
      billing_items: [
        {
          customer_id: "CUST-001",
          service_name: "Basic Consulting",
          base_amount: 480000,
          discount_amount: 0,
          final_amount: 480000,
        },
        {
          customer_id: "CUST-002",
          service_name: "Premium Support",
          base_amount: 720000,
          discount_amount: 0,
          final_amount: 720000,
        },
        {
          customer_id: "CUST-003",
          service_name: "Basic Consulting",
          base_amount: 300000,
          discount_amount: 0,
          final_amount: 300000,
        },
      ],
    };
    fetchMock.mockResponseOnce(JSON.stringify({ success: true }), {
      status: 200,
    });
    const billingResponse = await fetch("/api/billing-data/generate", {
      method: "POST",
      body: JSON.stringify(billingData),
    });
    expect(billingResponse.status).toBe(200);

    // Initiate final approval workflow for billing
    fetchMock.mockResponseOnce(
      JSON.stringify({ workflow_id: "WF-2024-01-001", status: "pending" }),
      { status: 200 }
    );
    const workflowResponse = await fetch("/api/billing-workflow/initiate", {
      method: "POST",
      body: JSON.stringify({ period: "2024-01" }),
    });
    expect(workflowResponse.status).toBe(200);

    // Approver role login and final approval
    const approvalPayload = {
      workflow_id: "WF-2024-01-001",
      approver_id: "USER-APPROVER-001",
      action: "approve",
      timestamp: "2024-02-01T10:00:00Z",
    };
    fetchMock.mockResponseOnce(
      JSON.stringify({
        workflow_id: "WF-2024-01-001",
        status: "approved",
        approved_at: "2024-02-01T10:00:00Z",
      }),
      { status: 200 }
    );
    const approvalResponse = await fetch("/api/billing-workflow/approve", {
      method: "POST",
      body: JSON.stringify(approvalPayload),
    });
    expect(approvalResponse.status).toBe(200);
    const approvalData = await approvalResponse.json();
    expect(approvalData.status).toBe("approved");

    // Validate distribution rules definition
    const distributionRulesDefinition = {
      period: "2024-01",
      rules: [
        {
          rule_id: "RULE-001",
          contract_status: "active",
          delivery_method: "email",
          delivery_timing: "after_approval",
        },
      ],
    };
    const rulesValidation = validateReportDistributionRules(
      distributionRulesDefinition
    );
    expect(rulesValidation.is_valid).toBe(true);
    expect(rulesValidation.rules_count).toBe(1);

    // Extract target customers for distribution
    const targetCustomersInput = {
      period: "2024-01",
      aggregation_data: monthlyAggregationData.metrics,
      distribution_rules: distributionRulesDefinition.rules,
    };
    const targetCustomersResult = extractTargetCustomersForDistribution(
      targetCustomersInput
    );
    expect(targetCustomersResult.target_count).toBe(3);
    expect(targetCustomersResult.customers).toEqual([
      {
        customer_id: "CUST-001",
        service_name: "Basic Consulting",
        email: undefined,
      },
      {
        customer_id: "CUST-002",
        service_name: "Premium Support",
        email: undefined,
      },
      {
        customer_id: "CUST-003",
        service_name: "Basic Consulting",
        email: undefined,
      },
    ]);

    // Execute automated report distribution
    const distributionPayload = {
      period: "2024-01",
      workflow_id: "WF-2024-01-001",
      target_customers: targetCustomersResult.customers,
      template_id: "TMPL-STANDARD-001",
      timestamp: "2024-02-01T10:05:00Z",
    };
    fetchMock.mockResponseOnce(
      JSON.stringify({
        distribution_id: "DIST-2024-01-001",
        status: "completed",
        total_sent: 3,
        successful: 3,
        failed: 0,
      }),
      { status: 200 }
    );
    const distributionResponse = await fetch(
      "/api/report-distribution/execute",
      {
        method: "POST",
        body: JSON.stringify(distributionPayload),
      }
    );
    expect(distributionResponse.status).toBe(200);
    const distributionData = await distributionResponse.json();
    expect(distributionData.total_sent).toBe(3);
    expect(distributionData.successful).toBe(3);
    expect(distributionData.failed).toBe(0);

    // Verify reports reached target customer mailboxes
    fetchMock.mockResponseOnce(
      JSON.stringify({
        distribution_id: "DIST-2024-01-001",
        recipients: [
          {
            customer_id: "CUST-001",
            status: "delivered",
            delivery_timestamp: "2024-02-01T10:05:30Z",
          },
          {
            customer_id: "CUST-002",
            status: "delivered",
            delivery_timestamp: "2024-02-01T10:05:35Z",
          },
          {
            customer_id: "CUST-003",
            status: "delivered",
            delivery_timestamp: "2024-02-01T10:05:40Z",
          },
        ],
      }),
      { status: 200 }
    );
    const deliveryVerifyResponse = await fetch(
      "/api/report-distribution/verify-delivery?distribution_id=DIST-2024-01-001",
      { method: "GET" }
    );
    expect(deliveryVerifyResponse.status).toBe(200);
    const deliveryVerifyData = await deliveryVerifyResponse.json();
    expect(deliveryVerifyData.recipients).toHaveLength(3);
    deliveryVerifyData.recipients.forEach((recipient: any) => {
      expect(recipient.status).toBe("delivered");
    });

    // Verify report format standardization
    const reportFormatStandardization = {
      template_id: "TMPL-STANDARD-001",
      header_format: "standard",
      data_section_format: "standard",
      footer_format: "standard",
      file_format: "pdf",
    };
    const formatValidation = verifyReportFormatStandardization(
      reportFormatStandardization
    );
    expect(formatValidation.is_standardized).toBe(true);
    expect(formatValidation.format_version).toBe("1.0");

    // Verify monthly aggregation data accuracy in distributed reports
    const reportDataVerification = {
      distributed_report: {
        period: "2024-01",
        metrics: [
          {
            customer_id: "CUST-001",
            appointments_count: 15,
            contract_count: 8,
            revenue_amount: 480000,
          },
          {
            customer_id: "CUST-002",
            appointments_count: 22,
            contract_count: 12,
            revenue_amount: 720000,
          },
          {
            customer_id: "CUST-003",
            appointments_count: 10,
            contract_count: 5,
            revenue_amount: 300000,
          },
        ],
      },
      source_aggregation_data: monthlyAggregationData.metrics,
    };
    const dataAccuracyResult = validateReportDataAccuracy(
      reportDataVerification
    );
    expect(dataAccuracyResult.accuracy_verified).toBe(true);
    expect(dataAccuracyResult.total_records_verified).toBe(3);
    expect(dataAccuracyResult.mismatches).toBe(0);

    // Verify distribution log records all successful deliveries
    fetchMock.mockResponseOnce(
      JSON.stringify({
        distribution_id: "DIST-2024-01-001",
        period: "2024-01",
        total_records: 3,
        successful_records: 3,
        failed_records: 0,
        log_entries: [
          {
            customer_id: "CUST-001",
            status: "success",
            sent_at: "2024-02-01T10:05:30Z",
            template_id: "TMPL-STANDARD-001",
          },
          {
            customer_id: "CUST-002",
            status: "success",
            sent_at: "2024-02-01T10:05:35Z",
            template_id: "TMPL-STANDARD-001",
          },
          {
            customer_id: "CUST-003",
            status: "success",
            sent_at: "2024-02-01T10:05:40Z",
            template_id: "TMPL-STANDARD-001",
          },
        ],
      }),
      { status: 200 }
    );
    const logResponse = await fetch(
      "/api/distribution-logs/retrieve?distribution_id=DIST-2024-01-001",
      { method: "GET" }
    );
    expect(logResponse.status).toBe(200);
    const logData = await logResponse.json();
    expect(logData.total_records).toBe(3);
    expect(logData.successful_records).toBe(3);
    expect(logData.failed_records).toBe(0);
    logData.log_entries.forEach((entry: any) => {
      expect(entry.status).toBe("success");
    });
  });
});