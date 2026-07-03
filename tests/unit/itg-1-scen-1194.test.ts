import { describe, test, expect } from "@jest/globals";
import { validateResponseContentAgainstContract } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1194: [error] 回答内容の最終確認・承認機能 - 回答内容が契約条件と矛盾している場合、修正指示がエラーとして返される
  test("should detect contract contradiction and return error with correction instruction when response content conflicts with contract terms", () => {
    const contractData = {
      contract_id: "CONTRACT-001",
      customer_id: "CUST-001",
      contract_amount: 100000,
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
      service_content: "営業代行サービス",
      billing_rule_type: "fixed_amount",
    };

    const responseContent = {
      response_id: "RESP-001",
      contract_id: "CONTRACT-001",
      response_type: "billing_confirmation",
      response_amount: 150000,
      response_period_start: "2024-01-01",
      response_period_end: "2024-12-31",
      response_service_detail: "営業代行サービス",
      response_status: "pending_approval",
    };

    expect(() =>
      validateResponseContentAgainstContract(contractData, responseContent)
    ).toThrow(/請求額が契約金額を超過/);
  });

  test("should allow approval when response content matches contract terms", () => {
    const contractData = {
      contract_id: "CONTRACT-002",
      customer_id: "CUST-002",
      contract_amount: 100000,
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
      service_content: "営業代行サービス",
      billing_rule_type: "fixed_amount",
    };

    const responseContent = {
      response_id: "RESP-002",
      contract_id: "CONTRACT-002",
      response_type: "billing_confirmation",
      response_amount: 100000,
      response_period_start: "2024-01-01",
      response_period_end: "2024-12-31",
      response_service_detail: "営業代行サービス",
      response_status: "pending_approval",
    };

    const result = validateResponseContentAgainstContract(
      contractData,
      responseContent
    );

    expect(result).toEqual({
      is_valid: true,
      validation_status: "approved",
      contradiction_detected: false,
      correction_required: false,
    });
  });

  test("should detect service content mismatch and return error with correction instruction", () => {
    const contractData = {
      contract_id: "CONTRACT-003",
      customer_id: "CUST-003",
      contract_amount: 100000,
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
      service_content: "営業代行サービス",
      billing_rule_type: "fixed_amount",
    };

    const responseContent = {
      response_id: "RESP-003",
      contract_id: "CONTRACT-003",
      response_type: "billing_confirmation",
      response_amount: 100000,
      response_period_start: "2024-01-01",
      response_period_end: "2024-12-31",
      response_service_detail: "コンサルティングサービス",
      response_status: "pending_approval",
    };

    expect(() =>
      validateResponseContentAgainstContract(contractData, responseContent)
    ).toThrow(/サービス内容が一致/);
  });

  test("should detect contract period mismatch and return error with correction instruction", () => {
    const contractData = {
      contract_id: "CONTRACT-004",
      customer_id: "CUST-004",
      contract_amount: 100000,
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
      service_content: "営業代行サービス",
      billing_rule_type: "fixed_amount",
    };

    const responseContent = {
      response_id: "RESP-004",
      contract_id: "CONTRACT-004",
      response_type: "billing_confirmation",
      response_amount: 100000,
      response_period_start: "2024-01-01",
      response_period_end: "2025-12-31",
      response_service_detail: "営業代行サービス",
      response_status: "pending_approval",
    };

    expect(() =>
      validateResponseContentAgainstContract(contractData, responseContent)
    ).toThrow(/契約期間が一致/);
  });

  test("should allow response when billing rule is performance-based and response amount is within contract range", () => {
    const contractData = {
      contract_id: "CONTRACT-005",
      customer_id: "CUST-005",
      contract_amount: 100000,
      contract_min_amount: 50000,
      contract_max_amount: 150000,
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
      service_content: "営業代行サービス",
      billing_rule_type: "performance_based",
    };

    const responseContent = {
      response_id: "RESP-005",
      contract_id: "CONTRACT-005",
      response_type: "billing_confirmation",
      response_amount: 120000,
      response_period_start: "2024-01-01",
      response_period_end: "2024-12-31",
      response_service_detail: "営業代行サービス",
      response_status: "pending_approval",
    };

    const result = validateResponseContentAgainstContract(
      contractData,
      responseContent
    );

    expect(result).toEqual({
      is_valid: true,
      validation_status: "approved",
      contradiction_detected: false,
      correction_required: false,
    });
  });

  test("should reject response when billing amount exceeds performance-based contract maximum", () => {
    const contractData = {
      contract_id: "CONTRACT-006",
      customer_id: "CUST-006",
      contract_amount: 100000,
      contract_min_amount: 50000,
      contract_max_amount: 150000,
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
      service_content: "営業代行サービス",
      billing_rule_type: "performance_based",
    };

    const responseContent = {
      response_id: "RESP-006",
      contract_id: "CONTRACT-006",
      response_type: "billing_confirmation",
      response_amount: 160000,
      response_period_start: "2024-01-01",
      response_period_end: "2024-12-31",
      response_service_detail: "営業代行サービス",
      response_status: "pending_approval",
    };

    expect(() =>
      validateResponseContentAgainstContract(contractData, responseContent)
    ).toThrow(/契約上限額を超過/);
  });

  test("should reject response when billing amount is below performance-based contract minimum", () => {
    const contractData = {
      contract_id: "CONTRACT-007",
      customer_id: "CUST-007",
      contract_amount: 100000,
      contract_min_amount: 50000,
      contract_max_amount: 150000,
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
      service_content: "営業代行サービス",
      billing_rule_type: "performance_based",
    };

    const responseContent = {
      response_id: "RESP-007",
      contract_id: "CONTRACT-007",
      response_type: "billing_confirmation",
      response_amount: 30000,
      response_period_start: "2024-01-01",
      response_period_end: "2024-12-31",
      response_service_detail: "営業代行サービス",
      response_status: "pending_approval",
    };

    expect(() =>
      validateResponseContentAgainstContract(contractData, responseContent)
    ).toThrow(/契約下限額未満/);
  });

  test("should return validation result with contradiction details when multiple contradictions exist", () => {
    const contractData = {
      contract_id: "CONTRACT-008",
      customer_id: "CUST-008",
      contract_amount: 100000,
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
      service_content: "営業代行サービス",
      billing_rule_type: "fixed_amount",
    };

    const responseContent = {
      response_id: "RESP-008",
      contract_id: "CONTRACT-008",
      response_type: "billing_confirmation",
      response_amount: 200000,
      response_period_start: "2024-01-01",
      response_period_end: "2025-12-31",
      response_service_detail: "コンサルティングサービス",
      response_status: "pending_approval",
    };

    expect(() =>
      validateResponseContentAgainstContract(contractData, responseContent)
    ).toThrow(/請求額が契約金額を超過|サービス内容が一致|契約期間が一致/);
  });
});