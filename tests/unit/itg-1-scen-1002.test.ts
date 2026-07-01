import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  calculateMonthlyBillingCycleSlaCompliance,
  type MonthlyBillingCycleInput,
  type MonthlyBillingCycleOutput,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次請求業務SLA管理 - 請求書生成から顧客納品までのSLA管理", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1002
  test("請求書生成から顧客納品までの全工程がSLA期限内に完了する", () => {
    const cycle_start_at = new Date("2024-01-25T09:00:00Z");
    const invoice_generation_completed_at = new Date(
      "2024-01-25T10:30:00Z"
    );
    const approval_workflow_confirmed_at = new Date(
      "2024-01-25T11:45:00Z"
    );
    const approval_completed_at = new Date("2024-01-25T13:00:00Z");
    const delivery_preparation_started_at = new Date(
      "2024-01-25T13:15:00Z"
    );
    const delivery_completed_at = new Date("2024-01-25T14:30:00Z");
    const sla_limit_business_days = 5;
    const sla_deadline_at = new Date("2024-02-02T18:00:00Z");

    const input: MonthlyBillingCycleInput = {
      cycle_start_at: cycle_start_at,
      invoice_generation_completed_at: invoice_generation_completed_at,
      approval_workflow_confirmed_at: approval_workflow_confirmed_at,
      approval_completed_at: approval_completed_at,
      delivery_preparation_started_at: delivery_preparation_started_at,
      delivery_completed_at: delivery_completed_at,
      sla_limit_business_days: sla_limit_business_days,
      sla_deadline_at: sla_deadline_at,
      customer_invoice_count: 12,
      invoice_verification_passed_count: 12,
      invoice_approval_passed_count: 12,
      invoice_delivery_completed_count: 12,
    };

    const result: MonthlyBillingCycleOutput =
      calculateMonthlyBillingCycleSlaCompliance(input);

    expect(result.sla_compliant).toBe(true);
    expect(result.cycle_duration_minutes).toBe(
      (delivery_completed_at.getTime() - cycle_start_at.getTime()) / 60000
    );
    expect(result.invoice_count).toBe(12);
    expect(result.verification_passed_count).toBe(12);
    expect(result.approval_passed_count).toBe(12);
    expect(result.delivery_completed_count).toBe(12);
    expect(result.invoice_generation_elapsed_minutes).toBe(
      (invoice_generation_completed_at.getTime() - cycle_start_at.getTime()) /
        60000
    );
    expect(result.approval_elapsed_minutes).toBe(
      (approval_completed_at.getTime() - cycle_start_at.getTime()) / 60000
    );
    expect(result.delivery_elapsed_minutes).toBe(
      (delivery_completed_at.getTime() - cycle_start_at.getTime()) / 60000
    );
    expect(result.audit_log_recorded).toBe(true);
    expect(result.sla_deadline_at).toEqual(sla_deadline_at);
    expect(result.compliance_status).toBe("passed");
  });

  test("請求書生成から顧客納品までがSLA期限を超過する場合、SLA不達と表示される", () => {
    const cycle_start_at = new Date("2024-01-25T09:00:00Z");
    const invoice_generation_completed_at = new Date(
      "2024-01-25T10:30:00Z"
    );
    const approval_workflow_confirmed_at = new Date(
      "2024-01-25T11:45:00Z"
    );
    const approval_completed_at = new Date("2024-01-25T13:00:00Z");
    const delivery_preparation_started_at = new Date(
      "2024-01-25T13:15:00Z"
    );
    const delivery_completed_at = new Date("2024-02-05T14:30:00Z");
    const sla_limit_business_days = 5;
    const sla_deadline_at = new Date("2024-02-02T18:00:00Z");

    const input: MonthlyBillingCycleInput = {
      cycle_start_at: cycle_start_at,
      invoice_generation_completed_at: invoice_generation_completed_at,
      approval_workflow_confirmed_at: approval_workflow_confirmed_at,
      approval_completed_at: approval_completed_at,
      delivery_preparation_started_at: delivery_preparation_started_at,
      delivery_completed_at: delivery_completed_at,
      sla_limit_business_days: sla_limit_business_days,
      sla_deadline_at: sla_deadline_at,
      customer_invoice_count: 12,
      invoice_verification_passed_count: 12,
      invoice_approval_passed_count: 12,
      invoice_delivery_completed_count: 12,
    };

    const result: MonthlyBillingCycleOutput =
      calculateMonthlyBillingCycleSlaCompliance(input);

    expect(result.sla_compliant).toBe(false);
    expect(result.compliance_status).toBe("failed");
    expect(result.audit_log_recorded).toBe(true);
  });

  test("請求書検証失敗がある場合、SLA管理対象外として記録される", () => {
    const cycle_start_at = new Date("2024-01-25T09:00:00Z");
    const invoice_generation_completed_at = new Date(
      "2024-01-25T10:30:00Z"
    );
    const approval_workflow_confirmed_at = new Date(
      "2024-01-25T11:45:00Z"
    );
    const approval_completed_at = new Date("2024-01-25T13:00:00Z");
    const delivery_preparation_started_at = new Date(
      "2024-01-25T13:15:00Z"
    );
    const delivery_completed_at = new Date("2024-01-25T14:30:00Z");
    const sla_limit_business_days = 5;
    const sla_deadline_at = new Date("2024-02-02T18:00:00Z");

    const input: MonthlyBillingCycleInput = {
      cycle_start_at: cycle_start_at,
      invoice_generation_completed_at: invoice_generation_completed_at,
      approval_workflow_confirmed_at: approval_workflow_confirmed_at,
      approval_completed_at: approval_completed_at,
      delivery_preparation_started_at: delivery_preparation_started_at,
      delivery_completed_at: delivery_completed_at,
      sla_limit_business_days: sla_limit_business_days,
      sla_deadline_at: sla_deadline_at,
      customer_invoice_count: 12,
      invoice_verification_passed_count: 10,
      invoice_approval_passed_count: 10,
      invoice_delivery_completed_count: 10,
    };

    const result: MonthlyBillingCycleOutput =
      calculateMonthlyBillingCycleSlaCompliance(input);

    expect(result.invoice_count).toBe(12);
    expect(result.verification_passed_count).toBe(10);
    expect(result.verification_failed_count).toBe(2);
    expect(result.audit_log_recorded).toBe(true);
  });

  test("承認プロセス失敗がある場合、SLA管理対象外として記録される", () => {
    const cycle_start_at = new Date("2024-01-25T09:00:00Z");
    const invoice_generation_completed_at = new Date(
      "2024-01-25T10:30:00Z"
    );
    const approval_workflow_confirmed_at = new Date(
      "2024-01-25T11:45:00Z"
    );
    const approval_completed_at = new Date("2024-01-25T13:00:00Z");
    const delivery_preparation_started_at = new Date(
      "2024-01-25T13:15:00Z"
    );
    const delivery_completed_at = new Date("2024-01-25T14:30:00Z");
    const sla_limit_business_days = 5;
    const sla_deadline_at = new Date("2024-02-02T18:00:00Z");

    const input: MonthlyBillingCycleInput = {
      cycle_start_at: cycle_start_at,
      invoice_generation_completed_at: invoice_generation_completed_at,
      approval_workflow_confirmed_at: approval_workflow_confirmed_at,
      approval_completed_at: approval_completed_at,
      delivery_preparation_started_at: delivery_preparation_started_at,
      delivery_completed_at: delivery_completed_at,
      sla_limit_business_days: sla_limit_business_days,
      sla_deadline_at: sla_deadline_at,
      customer_invoice_count: 12,
      invoice_verification_passed_count: 12,
      invoice_approval_passed_count: 11,
      invoice_delivery_completed_count: 11,
    };

    const result: MonthlyBillingCycleOutput =
      calculateMonthlyBillingCycleSlaCompliance(input);

    expect(result.invoice_count).toBe(12);
    expect(result.approval_passed_count).toBe(11);
    expect(result.approval_failed_count).toBe(1);
    expect(result.audit_log_recorded).toBe(true);
  });

  test("納品不完了がある場合、納品完了フラグが立たず監査ログに記録される", () => {
    const cycle_start_at = new Date("2024-01-25T09:00:00Z");
    const invoice_generation_completed_at = new Date(
      "2024-01-25T10:30:00Z"
    );
    const approval_workflow_confirmed_at = new Date(
      "2024-01-25T11:45:00Z"
    );
    const approval_completed_at = new Date("2024-01-25T13:00:00Z");
    const delivery_preparation_started_at = new Date(
      "2024-01-25T13:15:00Z"
    );
    const delivery_completed_at = new Date("2024-01-25T14:30:00Z");
    const sla_limit_business_days = 5;
    const sla_deadline_at = new Date("2024-02-02T18:00:00Z");

    const input: MonthlyBillingCycleInput = {
      cycle_start_at: cycle_start_at,
      invoice_generation_completed_at: invoice_generation_completed_at,
      approval_workflow_confirmed_at: approval_workflow_confirmed_at,
      approval_completed_at: approval_completed_at,
      delivery_preparation_started_at: delivery_preparation_started_at,
      delivery_completed_at: delivery_completed_at,
      sla_limit_business_days: sla_limit_business_days,
      sla_deadline_at: sla_deadline_at,
      customer_invoice_count: 12,
      invoice_verification_passed_count: 12,
      invoice_approval_passed_count: 12,
      invoice_delivery_completed_count: 11,
    };

    const result: MonthlyBillingCycleOutput =
      calculateMonthlyBillingCycleSlaCompliance(input);

    expect(result.delivery_completed_count).toBe(11);
    expect(result.delivery_pending_count).toBe(1);
    expect(result.delivery_completion_rate).toBe(
      (11 / 12) * 100
    );
    expect(result.audit_log_recorded).toBe(true);
  });

  test("SLA期限が null の場合、エラーが発生する", () => {
    const cycle_start_at = new Date("2024-01-25T09:00:00Z");
    const invoice_generation_completed_at = new Date(
      "2024-01-25T10:30:00Z"
    );
    const approval_workflow_confirmed_at = new Date(
      "2024-01-25T11:45:00Z"
    );
    const approval_completed_at = new Date("2024-01-25T13:00:00Z");
    const delivery_preparation_started_at = new Date(
      "2024-01-25T13:15:00Z"
    );
    const delivery_completed_at = new Date("2024-01-25T14:30:00Z");

    const input: MonthlyBillingCycleInput = {
      cycle_start_at: cycle_start_at,
      invoice_generation_completed_at: invoice_generation_completed_at,
      approval_workflow_confirmed_at: approval_workflow_confirmed_at,
      approval_completed_at: approval_completed_at,
      delivery_preparation_started_at: delivery_preparation_started_at,
      delivery_completed_at: delivery_completed_at,
      sla_limit_business_days: 5,
      sla_deadline_at: null as any,
      customer_invoice_count: 12,
      invoice_verification_passed_count: 12,
      invoice_approval_passed_count: 12,
      invoice_delivery_completed_count: 12,
    };

    expect(() =>
      calculateMonthlyBillingCycleSlaCompliance(input)
    ).toThrow(/SLA期限/);
  });

  test("請求書生成開始時刻が請求書生成完了時刻より後の場合、エラーが発生する", () => {
    const cycle_start_at = new Date("2024-01-25T11:00:00Z");
    const invoice_generation_completed_at = new Date(
      "2024-01-25T10:30:00Z"
    );
    const approval_workflow_confirmed_at = new Date(
      "2024-01-25T11:45:00Z"
    );
    const approval_completed_at = new Date("2024-01-25T13:00:00Z");
    const delivery_preparation_started_at = new Date(
      "2024-01-25T13:15:00Z"
    );
    const delivery_completed_at = new Date("2024-01-25T14:30:00Z");
    const sla_limit_business_days = 5;
    const sla_deadline_at = new Date("2024-02-02T18:00:00Z");

    const input: MonthlyBillingCycleInput = {
      cycle_start_at: cycle_start_at,
      invoice_generation_completed_at: invoice_generation_completed_at,
      approval_workflow_confirmed_at: approval_workflow_confirmed_at,
      approval_completed_at: approval_completed_at,
      delivery_preparation_started_at: delivery_preparation_started_at,
      delivery_completed_at: delivery_completed_at,
      sla_limit_business_days: sla_limit_business_days,
      sla_deadline_at: sla_deadline_at,
      customer_invoice_count: 12,
      invoice_verification_passed_count: 12,
      invoice_approval_passed_count: 12,
      invoice_delivery_completed_count: 12,
    };

    expect(() =>
      calculateMonthlyBillingCycleSlaCompliance(input)
    ).toThrow(/タイムスタンプ/);
  });

  test("納品完了時刻が配送準備開始時刻より前の場合、エラーが発生する", () => {
    const cycle_start_at = new Date("2024-01-25T09:00:00Z");
    const invoice_generation_completed_at = new Date(
      "2024-01-25T10:30:00Z"
    );
    const approval_workflow_confirmed_at = new Date(
      "2024-01-25T11:45:00Z"
    );
    const approval_completed_at = new Date("2024-01-25T13:00:00Z");
    const delivery_preparation_started_at = new Date(
      "2024-01-25T14:00:00Z"
    );
    const delivery_completed_at = new Date("2024-01-25T13:30:00Z");
    const sla_limit_business_days = 5;
    const sla_deadline_at = new Date("2024-02-02T18:00:00Z");

    const input: MonthlyBillingCycleInput = {
      cycle_start_at: cycle_start_at,
      invoice_generation_completed_at: invoice_generation_completed_at,
      approval_workflow_confirmed_at: approval_workflow_confirmed_at,
      approval_completed_at: approval_completed_at,
      delivery_preparation_started_at: delivery_preparation_started_at,
      delivery_completed_at: delivery_completed_at,
      sla_limit_business_days: sla_limit_business_days,
      sla_deadline_at: sla_deadline_at,
      customer_invoice_count: 12,
      invoice_verification_passed_count: 12,
      invoice_approval_passed_count: 12,
      invoice_delivery_completed_count: 12,
    };

    expect(() =>
      calculateMonthlyBillingCycleSlaCompliance(input)
    ).toThrow(/順序/);
  });

  test("顧客請求書数が 0 の場合、エラーが発生する", () => {
    const cycle_start_at = new Date("2024-01-25T09:00:00Z");
    const invoice_generation_completed_at = new Date(
      "2024-01-25T10:30:00Z"
    );
    const approval_workflow_confirmed_at = new Date(
      "2024-01-25T11:45:00Z"
    );
    const approval_completed_at = new Date("2024-01-25T13:00:00Z");
    const delivery_preparation_started_at = new Date(
      "2024-01-25T13:15:00Z"
    );
    const delivery_completed_at = new Date("2024-01-25T14:30:00Z");
    const sla_limit_business_days = 5;
    const sla_deadline_at = new Date("2024-02-02T18:00:00Z");

    const input: MonthlyBillingCycleInput = {
      cycle_start_at: cycle_start_at,
      invoice_generation_completed_at: invoice_generation_completed_at,
      approval_workflow_confirmed_at: approval_workflow_confirmed_at,
      approval_completed_at: approval_completed_at,
      delivery_preparation_started_at: delivery_preparation_started_at,
      delivery_completed_at: delivery_completed_at,
      sla_limit_business_days: sla_limit_business_days,
      sla_deadline_at: sla_deadline_at,
      customer_invoice_count: 0,
      invoice_verification_passed_count: 0,
      invoice_approval_passed_count: 0,
      invoice_delivery_completed_count: 0,
    };

    expect(() =>
      calculateMonthlyBillingCycleSlaCompliance(input)
    ).toThrow(/請求書数/);
  });

  test("検証パスカウントが請求書総数を超える場合、エラーが発生する", () => {
    const cycle_start_at = new Date("2024-01-25T09:00:00Z");
    const invoice_generation_completed_at = new Date(
      "2024-01-25T10:30:00Z"
    );
    const approval_workflow_confirmed_at = new Date(
      "2024-01-25T11:45:00Z"
    );
    const approval_completed_at = new Date("2024-01-25T13:00:00Z");
    const delivery_preparation_started_at = new Date(
      "2024-01-25T13:15:00Z"
    );
    const delivery_completed_at = new Date("2024-01-25T14:30:00Z");
    const sla_limit_business_days = 5;
    const sla_deadline_at = new Date("2024-02-02T18:00:00Z");

    const input: MonthlyBillingCycleInput = {
      cycle_start_at: cycle_start_at,
      invoice_generation_completed_at: invoice_generation_completed_at,
      approval_workflow_confirmed_at: approval_workflow_confirmed_at,
      approval_completed_at: approval_completed_at,
      delivery_preparation_started_at: delivery_preparation_started_at,
      delivery_completed_at: delivery_completed_at,
      sla_limit_business_days: sla_limit_business_days,
      sla_deadline_at: sla_deadline_at,
      customer_invoice_count: 10,
      invoice_verification_passed_count: 15,
      invoice_approval_passed_count: 15,
      invoice_delivery_completed_count: 10,
    };

    expect(() =>
      calculateMonthlyBillingCycleSlaCompliance(input)
    ).toThrow(/検証/);
  });

  test("請求書生成開始直後から納品完了までが 24 時間以内の場合、SLA達成と表示される", () => {
    const cycle_start_at = new Date("2024-01-25T09:00:00Z");
    const invoice_generation_completed_at = new Date(
      "2024-01-25T11:00:00Z"
    );
    const approval_workflow_confirmed_at = new Date(
      "2024-01-25T12:00:00Z"
    );
    const approval_completed_at = new Date("2024-01-25T13:00:00Z");
    const delivery_preparation_started_at = new Date(
      "2024-01-25T13:30:00Z"
    );
    const delivery_completed_at = new Date("2024-01-26T08:00:00Z");
    const sla_limit_business_days = 5;
    const sla_deadline_at = new Date("2024-02-02T18:00:00Z");

    const input: MonthlyBillingCycleInput = {
      cycle_start_at: cycle_start_at,
      invoice_generation_completed_at: invoice_generation_completed_at,
      approval_workflow_confirmed_at: approval_workflow_confirmed_at,
      approval_completed_at: approval_completed_at,
      delivery_preparation_started_at: delivery_preparation_started_at,
      delivery_completed_at: delivery_completed_at,
      sla_limit_business_days: sla_limit_business_days,
      sla_deadline_at: sla_deadline_at,
      customer_invoice_count: 8,
      invoice_verification_passed_count: 8,
      invoice_approval_passed_count: 8,
      invoice_delivery_completed_count: 8,
    };

    const result: MonthlyBillingCycleOutput =
      calculateMonthlyBillingCycleSlaCompliance(input);

    expect(result.sla_compliant).toBe(true);
    expect(result.compliance_status).toBe("passed");
    expect(result.cycle_duration_minutes).toBe(1380);
    expect(result.audit_log_recorded).toBe(true);
  });
});