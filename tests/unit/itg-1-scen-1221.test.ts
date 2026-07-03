import { describe, test, expect, beforeEach } from "@jest/globals";
import { updateContractAndBillingDataOnAgreementReceipt } from "../../src/logic/it-1-2-1";

describe("契約・請求データリアルタイム更新機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1221
  test("顧客合意確認受領時に契約・請求データが最新状態に更新される", () => {
    const agreementReceipt = {
      contract_id: "C-2024-001",
      customer_id: "CUS-A001",
      agreement_status: "受領完了",
      agreed_at: "2024-01-15T09:30:00Z",
      contract_amount: 500000,
      contract_start_date: "2024-02-01",
      contract_end_date: "2024-12-31",
      service_type: "営業代行サービス",
      discount_rate: 0.1,
      payment_terms: 30,
    };

    const result = updateContractAndBillingDataOnAgreementReceipt(
      agreementReceipt
    );

    expect(result).toEqual({
      contract_updated: true,
      contract_data: {
        contract_id: "C-2024-001",
        customer_id: "CUS-A001",
        amount: 500000,
        start_date: "2024-02-01",
        end_date: "2024-12-31",
        service_type: "営業代行サービス",
        discount_rate: 0.1,
        valid: true,
        updated_at: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
        ),
      },
      billing_updated: true,
      billing_data: {
        contract_id: "C-2024-001",
        customer_id: "CUS-A001",
        billing_amount: 450000,
        next_billing_date: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}$/
        ),
        billing_period_start: "2024-02-01",
        billing_period_end: "2024-12-31",
        payment_terms_days: 30,
        synchronized: true,
        updated_at: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
        ),
      },
      system_log: {
        event_type: "CONTRACT_BILLING_AUTO_UPDATE",
        triggered_by: "AGREEMENT_RECEIPT",
        agreement_received_at: "2024-01-15T09:30:00Z",
        processing_completed_at: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
        ),
        status: "SUCCESS",
      },
    });

    expect(result.contract_updated).toBe(true);
    expect(result.billing_updated).toBe(true);
    expect(result.billing_data.billing_amount).toBe(450000);
    expect(result.contract_data.amount).toBe(500000);
    expect(result.contract_data.valid).toBe(true);
    expect(result.system_log.status).toBe("SUCCESS");
  });

  test("契約合意確認受領時に複数サービスの請求データが正確に集計される", () => {
    const agreementReceipt = {
      contract_id: "C-2024-002",
      customer_id: "CUS-B002",
      agreement_status: "受領完了",
      agreed_at: "2024-01-16T14:00:00Z",
      services: [
        {
          service_id: "SVC-001",
          service_name: "営業代行",
          base_fee: 300000,
          performance_fee_rate: 0.05,
          discount_rate: 0.05,
        },
        {
          service_id: "SVC-002",
          service_name: "マーケティング支援",
          base_fee: 150000,
          performance_fee_rate: 0.03,
          discount_rate: 0.05,
        },
      ],
      contract_start_date: "2024-03-01",
      contract_end_date: "2024-12-31",
      payment_terms: 45,
    };

    const result = updateContractAndBillingDataOnAgreementReceipt(
      agreementReceipt
    );

    const total_base_fee = 300000 + 150000;
    const total_discount = total_base_fee * 0.05;
    const expected_billing_amount = total_base_fee - total_discount;

    expect(result.contract_updated).toBe(true);
    expect(result.billing_updated).toBe(true);
    expect(result.billing_data.billing_amount).toBe(expected_billing_amount);
    expect(result.billing_data.contract_id).toBe("C-2024-002");
    expect(result.billing_data.customer_id).toBe("CUS-B002");
    expect(result.contract_data.service_type).toContain("営業代行");
    expect(result.system_log.status).toBe("SUCCESS");
  });

  test("合意確認ステータスが不正な場合は契約・請求データ更新が実行されない", () => {
    const agreementReceipt = {
      contract_id: "C-2024-003",
      customer_id: "CUS-C003",
      agreement_status: "保留中",
      agreed_at: "2024-01-17T10:00:00Z",
      contract_amount: 250000,
      contract_start_date: "2024-04-01",
      contract_end_date: "2024-12-31",
      service_type: "営業データ分析",
      discount_rate: 0.0,
      payment_terms: 30,
    };

    expect(() =>
      updateContractAndBillingDataOnAgreementReceipt(agreementReceipt)
    ).toThrow(/受領完了/);
  });

  test("契約データが存在しない場合は処理がスキップされ、エラー通知が返される", () => {
    const agreementReceipt = {
      contract_id: "C-NONEXISTENT",
      customer_id: "CUS-UNKNOWN",
      agreement_status: "受領完了",
      agreed_at: "2024-01-18T11:00:00Z",
      contract_amount: 100000,
      contract_start_date: "2024-05-01",
      contract_end_date: "2024-12-31",
      service_type: "テストサービス",
      discount_rate: 0.0,
      payment_terms: 30,
    };

    expect(() =>
      updateContractAndBillingDataOnAgreementReceipt(agreementReceipt)
    ).toThrow(/契約/);
  });

  test("割引率が適用された請求額が正確に計算される", () => {
    const agreementReceipt = {
      contract_id: "C-2024-004",
      customer_id: "CUS-D004",
      agreement_status: "受領完了",
      agreed_at: "2024-01-19T13:30:00Z",
      contract_amount: 1000000,
      discount_rate: 0.15,
      contract_start_date: "2024-06-01",
      contract_end_date: "2024-12-31",
      service_type: "統合営業支援",
      payment_terms: 60,
    };

    const result = updateContractAndBillingDataOnAgreementReceipt(
      agreementReceipt
    );

    const expected_billing_amount = 1000000 * (1 - 0.15);

    expect(result.billing_data.billing_amount).toBe(expected_billing_amount);
    expect(result.billing_data.billing_amount).toBe(850000);
    expect(result.contract_updated).toBe(true);
    expect(result.billing_updated).toBe(true);
  });

  test("契約・請求データ更新時にシステムログが正確に記録される", () => {
    const agreementReceipt = {
      contract_id: "C-2024-005",
      customer_id: "CUS-E005",
      agreement_status: "受領完了",
      agreed_at: "2024-01-20T15:45:00Z",
      contract_amount: 600000,
      contract_start_date: "2024-07-01",
      contract_end_date: "2024-12-31",
      service_type: "営業プロセス最適化",
      discount_rate: 0.08,
      payment_terms: 45,
    };

    const result = updateContractAndBillingDataOnAgreementReceipt(
      agreementReceipt
    );

    expect(result.system_log.event_type).toBe(
      "CONTRACT_BILLING_AUTO_UPDATE"
    );
    expect(result.system_log.triggered_by).toBe("AGREEMENT_RECEIPT");
    expect(result.system_log.agreement_received_at).toBe("2024-01-20T15:45:00Z");
    expect(result.system_log.status).toBe("SUCCESS");
    expect(result.system_log.processing_completed_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
  });

  test("複数契約の同時更新でも各契約データが独立して正確に更新される", () => {
    const agreementReceipt1 = {
      contract_id: "C-2024-006",
      customer_id: "CUS-F006",
      agreement_status: "受領完了",
      agreed_at: "2024-01-21T09:00:00Z",
      contract_amount: 400000,
      contract_start_date: "2024-08-01",
      contract_end_date: "2024-12-31",
      service_type: "営業トレーニング",
      discount_rate: 0.1,
      payment_terms: 30,
    };

    const agreementReceipt2 = {
      contract_id: "C-2024-007",
      customer_id: "CUS-G007",
      agreement_status: "受領完了",
      agreed_at: "2024-01-21T10:00:00Z",
      contract_amount: 800000,
      contract_start_date: "2024-08-01",
      contract_end_date: "2024-12-31",
      service_type: "営業管理ツール導入",
      discount_rate: 0.12,
      payment_terms: 60,
    };

    const result1 = updateContractAndBillingDataOnAgreementReceipt(
      agreementReceipt1
    );
    const result2 = updateContractAndBillingDataOnAgreementReceipt(
      agreementReceipt2
    );

    expect(result1.contract_data.contract_id).toBe("C-2024-006");
    expect(result1.billing_data.billing_amount).toBe(360000);
    expect(result2.contract_data.contract_id).toBe("C-2024-007");
    expect(result2.billing_data.billing_amount).toBe(704000);
    expect(result1.contract_updated).toBe(true);
    expect(result2.contract_updated).toBe(true);
  });

  test("請求データの次回請求日が正確に計算される", () => {
    const agreementReceipt = {
      contract_id: "C-2024-008",
      customer_id: "CUS-H008",
      agreement_status: "受領完了",
      agreed_at: "2024-01-22T12:00:00Z",
      contract_amount: 550000,
      contract_start_date: "2024-09-01",
      contract_end_date: "2024-12-31",
      service_type: "営業データ品質管理",
      discount_rate: 0.0,
      payment_terms: 45,
    };

    const result = updateContractAndBillingDataOnAgreementReceipt(
      agreementReceipt
    );

    expect(result.billing_data.next_billing_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.billing_data.payment_terms_days).toBe(45);
    expect(result.billing_data.billing_period_start).toBe("2024-09-01");
    expect(result.billing_data.billing_period_end).toBe("2024-12-31");
  });

  test("無割引の契約でも請求額が正確に計算される", () => {
    const agreementReceipt = {
      contract_id: "C-2024-009",
      customer_id: "CUS-I009",
      agreement_status: "受領完了",
      agreed_at: "2024-01-23T14:15:00Z",
      contract_amount: 300000,
      contract_start_date: "2024-10-01",
      contract_end_date: "2024-12-31",
      service_type: "基本営業支援",
      discount_rate: 0.0,
      payment_terms: 30,
    };

    const result = updateContractAndBillingDataOnAgreementReceipt(
      agreementReceipt
    );

    expect(result.billing_data.billing_amount).toBe(300000);
    expect(result.contract_data.discount_rate).toBe(0.0);
    expect(result.billing_updated).toBe(true);
  });

  test("更新されたタイムスタンプが現在時刻に設定される", () => {
    const agreementReceipt = {
      contract_id: "C-2024-010",
      customer_id: "CUS-J010",
      agreement_status: "受領完了",
      agreed_at: "2024-01-24T16:30:00Z",
      contract_amount: 700000,
      contract_start_date: "2024-11-01",
      contract_end_date: "2024-12-31",
      service_type: "営業レポート自動化",
      discount_rate: 0.05,
      payment_terms: 45,
    };

    const before_time = new Date("2024-01-24T16:30:00Z");
    const result = updateContractAndBillingDataOnAgreementReceipt(
      agreementReceipt
    );
    const after_time = new Date("2024-01-24T16:35:00Z");

    const contract_updated_at = new Date(result.contract_data.updated_at);
    const billing_updated_at = new Date(result.billing_data.updated_at);

    expect(contract_updated_at.getTime()).toBeGreaterThanOrEqual(
      before_time.getTime()
    );
    expect(contract_updated_at.getTime()).toBeLessThanOrEqual(
      after_time.getTime()
    );
    expect(billing_updated_at.getTime()).toBeGreaterThanOrEqual(
      before_time.getTime()
    );
    expect(billing_updated_at.getTime()).toBeLessThanOrEqual(
      after_time.getTime()
    );
  });

  test("契約・請求データが同期して更新されることが確認される", () => {
    const agreementReceipt = {
      contract_id: "C-2024-011",
      customer_id: "CUS-K011",
      agreement_status: "受領完了",
      agreed_at: "2024-01-25T11:00:00Z",
      contract_amount: 900000,
      contract_start_date: "2024-12-01",
      contract_end_date: "2025-12-31",
      service_type: "営業管理システム",
      discount_rate: 0.2,
      payment_terms: 60,
    };

    const result = updateContractAndBillingDataOnAgreementReceipt(
      agreementReceipt
    );

    expect(result.contract_data.customer_id).toBe(result.billing_data.customer_id);
    expect(result.contract_data.contract_id).toBe(result.billing_data.contract_id);
    expect(result.contract_updated).toBe(result.billing_updated);
    expect(result.billing_data.billing_amount).toBe(
      result.contract_data.amount * (1 - result.contract_data.discount_rate)
    );
    expect(result.billing_data.synchronized).toBe(true);
  });
});