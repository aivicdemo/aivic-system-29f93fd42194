import { approveInvoiceInfo } from "../../src/logic/it-1-2-1";

describe("請求情報最終承認機能", () => {
  // SCEN-1272: [error] 請求情報最終承認機能 - 検証エラーが存在する請求情報は差戻しされる
  test("検証エラーが存在する請求情報は差戻しされ、エラー詳細が記録される", () => {
    const invoiceInfo = {
      invoice_id: "INV-20240201-001",
      customer_id: "CUST-001",
      service_id: "SVC-A01",
      billing_period: "2024-01",
      base_amount: -5000,
      discount_rate: 0.15,
      final_amount: 4250,
      required_field_contact_name: "",
      invoice_date: "2024-02-01",
      due_date: "invalid-date-format",
      status: "pending_approval",
      created_at: "2024-02-01T09:00:00Z",
      created_by: "OPE-001",
    };

    const result = approveInvoiceInfo(invoiceInfo);

    expect(result.approval_status).toBe("rejected");
    expect(result.rejection_reason).toContain("金額");
    expect(result.rejection_reason).toContain("必須項目");
    expect(result.rejection_reason).toContain("日付形式");
    expect(result.validation_errors).toBeInstanceOf(Array);
    expect(result.validation_errors.length).toBeGreaterThan(0);
    expect(result.validation_errors.some((err: any) =>
      /金額不一致|マイナス/.test(err.message)
    )).toBe(true);
    expect(result.validation_errors.some((err: any) =>
      /連絡先名|必須/.test(err.message)
    )).toBe(true);
    expect(result.validation_errors.some((err: any) =>
      /期限|日付形式/.test(err.message)
    )).toBe(true);
    expect(result.rejected_at).toBeDefined();
    expect(result.rejected_by).toBe("SYSTEM");
    expect(result.original_status).toBe("pending_approval");
    expect(result.is_saved).toBe(false);
  });
});