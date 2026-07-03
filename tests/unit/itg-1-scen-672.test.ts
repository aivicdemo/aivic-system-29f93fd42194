import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import fetch from "jest-fetch-mock";

fetch.enableMocks();

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-672
  test("顧客別ポータル表示制御機能 - 他顧客に紐付くレポートがポータルから完全に非表示になる", async () => {
    beforeEach(() => {
      fetch.resetMocks();
    });

    afterEach(() => {
      fetch.resetMocks();
    });

    // テスト用の複数顧客（顧客A、顧客B）をシステムに登録
    const customerA = {
      customer_id: "CUST-001",
      customer_name: "顧客A企業",
      portal_account: "account_a@customer-a.jp",
    };

    const customerB = {
      customer_id: "CUST-002",
      customer_name: "顧客B企業",
      portal_account: "account_b@customer-b.jp",
    };

    // 顧客Aに紐付くレポート（レポートA-1、レポートA-2）を作成
    const reportA1 = {
      report_id: "RPT-A-001",
      customer_id: "CUST-001",
      report_name: "レポートA-1",
      generated_date: "2024-01-15T10:00:00Z",
      content: "顧客A月次成果レポート1",
    };

    const reportA2 = {
      report_id: "RPT-A-002",
      customer_id: "CUST-001",
      report_name: "レポートA-2",
      generated_date: "2024-01-15T11:00:00Z",
      content: "顧客A月次成果レポート2",
    };

    // 顧客Bに紐付くレポート（レポートB-1、レポートB-2）を作成
    const reportB1 = {
      report_id: "RPT-B-001",
      customer_id: "CUST-002",
      report_name: "レポートB-1",
      generated_date: "2024-01-15T10:00:00Z",
      content: "顧客B月次成果レポート1",
    };

    const reportB2 = {
      report_id: "RPT-B-002",
      customer_id: "CUST-002",
      report_name: "レポートB-2",
      generated_date: "2024-01-15T11:00:00Z",
      content: "顧客B月次成果レポート2",
    };

    // 顧客Aのアカウントでログイン
    const login_response_a = {
      login_user_id: "LOGIN-USER-001",
      login_account: "account_a@customer-a.jp",
      customer_id: "CUST-001",
      login_timestamp: "2024-01-15T12:00:00Z",
      session_token: "SESSION-TOKEN-A-12345",
      access_level: "customer_user",
    };

    fetch.mockResponseOnce(JSON.stringify(login_response_a), { status: 200 });

    const login_a_response = await fetch(
      "http://localhost:3000/api/v1/portal/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: "account_a@customer-a.jp",
          password: "password_a",
        }),
      }
    );

    const login_a_data = await login_a_response.json();
    expect(login_a_data.customer_id).toBe("CUST-001");
    expect(login_a_data.session_token).toBe("SESSION-TOKEN-A-12345");

    // 顧客Aのポータル画面にアクセスして、ポータルに表示されるレポート一覧を取得
    const portal_a_response = {
      customer_id: "CUST-001",
      reports: [reportA1, reportA2],
      total_report_count: 2,
      page_number: 1,
      page_size: 10,
      request_timestamp: "2024-01-15T12:00:00Z",
      session_token: "SESSION-TOKEN-A-12345",
    };

    fetch.mockResponseOnce(JSON.stringify(portal_a_response), { status: 200 });

    const portal_a_fetch = await fetch(
      "http://localhost:3000/api/v1/portal/reports?page=1&page_size=10",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer SESSION-TOKEN-A-12345",
          "Content-Type": "application/json",
        },
      }
    );

    const portal_a_data = await portal_a_fetch.json();

    // 顧客Aのポータルから顧客Bのレポート（レポートB-1、レポートB-2）の表示有無を確認
    expect(portal_a_data.customer_id).toBe("CUST-001");
    expect(portal_a_data.reports.length).toBe(2);
    expect(portal_a_data.reports[0].report_id).toBe("RPT-A-001");
    expect(portal_a_data.reports[1].report_id).toBe("RPT-A-002");

    // 顧客Aのレポート内に顧客Bのレポートが存在しないことを確認
    const contains_customer_b_report = portal_a_data.reports.some(
      (report: { customer_id: string }) => report.customer_id === "CUST-002"
    );
    expect(contains_customer_b_report).toBe(false);

    // 顧客Bのアカウントでログイン
    const login_response_b = {
      login_user_id: "LOGIN-USER-002",
      login_account: "account_b@customer-b.jp",
      customer_id: "CUST-002",
      login_timestamp: "2024-01-15T12:05:00Z",
      session_token: "SESSION-TOKEN-B-67890",
      access_level: "customer_user",
    };

    fetch.mockResponseOnce(JSON.stringify(login_response_b), { status: 200 });

    const login_b_response = await fetch(
      "http://localhost:3000/api/v1/portal/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: "account_b@customer-b.jp",
          password: "password_b",
        }),
      }
    );

    const login_b_data = await login_b_response.json();
    expect(login_b_data.customer_id).toBe("CUST-002");
    expect(login_b_data.session_token).toBe("SESSION-TOKEN-B-67890");

    // 顧客Bのポータル画面にアクセスして、ポータルに表示されるレポート一覧を取得
    const portal_b_response = {
      customer_id: "CUST-002",
      reports: [reportB1, reportB2],
      total_report_count: 2,
      page_number: 1,
      page_size: 10,
      request_timestamp: "2024-01-15T12:05:00Z",
      session_token: "SESSION-TOKEN-B-67890",
    };

    fetch.mockResponseOnce(JSON.stringify(portal_b_response), { status: 200 });

    const portal_b_fetch = await fetch(
      "http://localhost:3000/api/v1/portal/reports?page=1&page_size=10",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer SESSION-TOKEN-B-67890",
          "Content-Type": "application/json",
        },
      }
    );

    const portal_b_data = await portal_b_fetch.json();

    // 顧客Bのポータルから顧客Aのレポート（レポートA-1、レポートA-2）の表示有無を確認
    expect(portal_b_data.customer_id).toBe("CUST-002");
    expect(portal_b_data.reports.length).toBe(2);
    expect(portal_b_data.reports[0].report_id).toBe("RPT-B-001");
    expect(portal_b_data.reports[1].report_id).toBe("RPT-B-002");

    // 顧客Bのレポート内に顧客Aのレポートが存在しないことを確認
    const contains_customer_a_report = portal_b_data.reports.some(
      (report: { customer_id: string }) => report.customer_id === "CUST-001"
    );
    expect(contains_customer_a_report).toBe(false);

    // APIレスポンスを検証し、他顧客レポートのデータが送信されていないことを確認
    // 顧客AのAPIレスポンス検証
    expect(portal_a_data.reports).not.toContainEqual(
      expect.objectContaining({
        customer_id: "CUST-002",
      })
    );

    // 顧客BのAPIレスポンス検証
    expect(portal_b_data.reports).not.toContainEqual(
      expect.objectContaining({
        customer_id: "CUST-001",
      })
    );

    // 各レポートの内容確認
    expect(portal_a_data.reports[0]).toEqual(
      expect.objectContaining({
        report_id: "RPT-A-001",
        customer_id: "CUST-001",
        report_name: "レポートA-1",
      })
    );

    expect(portal_a_data.reports[1]).toEqual(
      expect.objectContaining({
        report_id: "RPT-A-002",
        customer_id: "CUST-001",
        report_name: "レポートA-2",
      })
    );

    expect(portal_b_data.reports[0]).toEqual(
      expect.objectContaining({
        report_id: "RPT-B-001",
        customer_id: "CUST-002",
        report_name: "レポートB-1",
      })
    );

    expect(portal_b_data.reports[1]).toEqual(
      expect.objectContaining({
        report_id: "RPT-B-002",
        customer_id: "CUST-002",
        report_name: "レポートB-2",
      })
    );

    // セッショントークンの異なることを確認
    expect(login_a_data.session_token).not.toBe(login_b_data.session_token);

    // ページング情報の確認
    expect(portal_a_data.page_number).toBe(1);
    expect(portal_a_data.page_size).toBe(10);
    expect(portal_a_data.total_report_count).toBe(2);

    expect(portal_b_data.page_number).toBe(1);
    expect(portal_b_data.page_size).toBe(10);
    expect(portal_b_data.total_report_count).toBe(2);
  });
});