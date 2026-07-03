import { validatePaymentApprovalCriteria } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1291
  test("支払い承認基準を満たす請求情報について支払い処理が自動実行される", () => {
    const billingInfo = {
      invoice_id: "INV-2024-001",
      customer_id: "CUST-001",
      billing_amount: 50000,
      billing_date: new Date("2024-01-15T10:00:00Z"),
      due_date: new Date("2024-02-15T23:59:59Z"),
      approval_status: "approved",
      payment_status: "pending",
      contract_id: "CON-001",
      service_type: "sales_operation",
    };

    const currentDate = new Date("2024-01-20T09:00:00Z");

    const result = validatePaymentApprovalCriteria(billingInfo, currentDate);

    expect(result).toEqual({
      meets_criteria: true,
      payment_executable: true,
      updated_status: "paid",
      execution_log: {
        invoice_id: "INV-2024-001",
        executed_at: expect.any(String),
        execution_status: "success",
        amount_processed: 50000,
        previous_status: "pending",
        new_status: "paid",
      },
    });

    expect(result.meets_criteria).toBe(true);
    expect(result.payment_executable).toBe(true);
    expect(result.updated_status).toBe("paid");
    expect(result.execution_log.amount_processed).toBe(50000);
    expect(result.execution_log.execution_status).toBe("success");
  });

  test("支払い承認基準を満たさない請求情報（承認待ち）について支払い処理が実行されない", () => {
    const billingInfo = {
      invoice_id: "INV-2024-002",
      customer_id: "CUST-002",
      billing_amount: 75000,
      billing_date: new Date("2024-01-15T10:00:00Z"),
      due_date: new Date("2024-02-15T23:59:59Z"),
      approval_status: "pending",
      payment_status: "pending",
      contract_id: "CON-002",
      service_type: "sales_operation",
    };

    const currentDate = new Date("2024-01-20T09:00:00Z");

    const result = validatePaymentApprovalCriteria(billingInfo, currentDate);

    expect(result.meets_criteria).toBe(false);
    expect(result.payment_executable).toBe(false);
    expect(result.updated_status).toBe("pending");
  });

  test("支払い承認基準を満たさない請求情報（期限超過）について支払い処理が保留される", () => {
    const billingInfo = {
      invoice_id: "INV-2024-003",
      customer_id: "CUST-003",
      billing_amount: 100000,
      billing_date: new Date("2024-01-01T10:00:00Z"),
      due_date: new Date("2024-01-15T23:59:59Z"),
      approval_status: "approved",
      payment_status: "pending",
      contract_id: "CON-003",
      service_type: "sales_operation",
    };

    const currentDate = new Date("2024-01-20T09:00:00Z");

    const result = validatePaymentApprovalCriteria(billingInfo, currentDate);

    expect(result.meets_criteria).toBe(false);
    expect(result.payment_executable).toBe(false);
  });

  test("金額が無効な値の場合、エラーを返す", () => {
    const billingInfo = {
      invoice_id: "INV-2024-004",
      customer_id: "CUST-004",
      billing_amount: -50000,
      billing_date: new Date("2024-01-15T10:00:00Z"),
      due_date: new Date("2024-02-15T23:59:59Z"),
      approval_status: "approved",
      payment_status: "pending",
      contract_id: "CON-004",
      service_type: "sales_operation",
    };

    const currentDate = new Date("2024-01-20T09:00:00Z");

    expect(() =>
      validatePaymentApprovalCriteria(billingInfo, currentDate)
    ).toThrow(/金額/);
  });

  test("承認ステータスが無効な値の場合、エラーを返す", () => {
    const billingInfo = {
      invoice_id: "INV-2024-005",
      customer_id: "CUST-005",
      billing_amount: 50000,
      billing_date: new Date("2024-01-15T10:00:00Z"),
      due_date: new Date("2024-02-15T23:59:59Z"),
      approval_status: "invalid_status",
      payment_status: "pending",
      contract_id: "CON-005",
      service_type: "sales_operation",
    };

    const currentDate = new Date("2024-01-20T09:00:00Z");

    expect(() =>
      validatePaymentApprovalCriteria(billingInfo, currentDate)
    ).toThrow(/承認ステータス/);
  });

  test("必須項目が欠落している場合、エラーを返す", () => {
    const billingInfoIncomplete = {
      invoice_id: "INV-2024-006",
      customer_id: "CUST-006",
      billing_amount: 50000,
      billing_date: new Date("2024-01-15T10:00:00Z"),
      due_date: new Date("2024-02-15T23:59:59Z"),
      approval_status: "approved",
    } as any;

    const currentDate = new Date("2024-01-20T09:00:00Z");

    expect(() =>
      validatePaymentApprovalCriteria(billingInfoIncomplete, currentDate)
    ).toThrow(/必須項目/);
  });

  test("複数の承認基準を満たす場合、支払い処理ログに詳細情報が記録される", () => {
    const billingInfo = {
      invoice_id: "INV-2024-007",
      customer_id: "CUST-007",
      billing_amount: 125000,
      billing_date: new Date("2024-01-10T10:00:00Z"),
      due_date: new Date("2024-02-20T23:59:59Z"),
      approval_status: "approved",
      payment_status: "pending",
      contract_id: "CON-007",
      service_type: "sales_operation",
    };

    const currentDate = new Date("2024-01-18T14:30:00Z");

    const result = validatePaymentApprovalCriteria(billingInfo, currentDate);

    expect(result.meets_criteria).toBe(true);
    expect(result.payment_executable).toBe(true);
    expect(result.execution_log).toHaveProperty("executed_at");
    expect(result.execution_log).toHaveProperty("execution_status");
    expect(result.execution_log.invoice_id).toBe("INV-2024-007");
    expect(result.execution_log.amount_processed).toBe(125000);
  });
});