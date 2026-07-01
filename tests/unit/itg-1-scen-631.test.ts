import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";

const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

import { searchSalesActivityData } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業活動データ検索・権限制御機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-631: [error] 営業活動データ検索・権限制御機能 - 権限外の顧客データへのアクセス要求がエラーで拒否される
  test("権限外の顧客データへのアクセス要求がHTTP 403エラーで拒否される", async () => {
    const user_id = "user_dept_a_001";
    const user_department = "department_a";
    const unauthorized_customer_id = "customer_dept_b_001";
    const search_period_start = "2024-01-01";
    const search_period_end = "2024-01-31";
    const access_timestamp = "2024-01-15T11:00:00Z";

    const error_response = {
      status: 403,
      error_code: "FORBIDDEN_ACCESS",
      error_message: "アクセス権限がありません",
      details: {
        requested_customer_id: unauthorized_customer_id,
        user_department: user_department,
        reason: "要求された顧客がユーザーの所属部門に割り当てられていません"
      },
      timestamp: access_timestamp
    };

    fetchMock.mockResponseOnce(JSON.stringify(error_response), { status: 403 });

    const search_params = {
      user_id: user_id,
      user_department: user_department,
      customer_id: unauthorized_customer_id,
      period_start: search_period_start,
      period_end: search_period_end
    };

    try {
      await searchSalesActivityData(search_params);
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error).toMatch(/アクセス権限/);
    }

    const call_args = fetchMock.mock.calls[0];
    expect(call_args).toBeDefined();
    expect(call_args[1]?.method).toBe("POST");

    const request_body = JSON.parse(call_args[1]?.body || "{}");
    expect(request_body.customer_id).toBe(unauthorized_customer_id);
    expect(request_body.user_department).toBe("department_a");
  });
});