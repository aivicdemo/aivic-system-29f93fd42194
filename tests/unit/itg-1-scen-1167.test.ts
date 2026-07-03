import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";

const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

import { searchSalesActivities } from "../../src/logic/it-1-2-1";

describe("営業活動データの検索・抽出機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1167
  test("検索条件の顧客IDが無効な形式の場合、バリデーションエラーを返す", async () => {
    const invalid_customer_ids = [
      "@#$",
      "",
      null,
      "abc123XYZ",
      "!@#$%",
      "   ",
      "cust-@invalid",
    ];

    for (const invalid_id of invalid_customer_ids) {
      fetchMock.resetMocks();

      fetchMock.mockResponseOnce(
        JSON.stringify({
          status_code: 400,
          error_code: "INVALID_CUSTOMER_ID_FORMAT",
          message: "顧客IDの形式が不正です",
          details: {
            field: "customer_id",
            reason: "顧客IDは英数字とハイフンのみで構成される必要があります",
            received_value: invalid_id,
          },
        }),
        { status: 400 }
      );

      const result = await searchSalesActivities({
        customer_id: invalid_id,
        start_date: "2024-01-01",
        end_date: "2024-01-31",
      });

      expect(result.status_code).toBe(400);
      expect(result.error_code).toBe("INVALID_CUSTOMER_ID_FORMAT");
      expect(result.message).toMatch(/顧客ID/);
      expect(result.message).toMatch(/形式/);
      expect(result.details).toBeDefined();
      expect(result.details.field).toBe("customer_id");
      expect(result.details.received_value).toBe(invalid_id);
    }
  });
});