import { classifyCustomerInquiry } from "../../src/logic/it-1-1-1";

describe("顧客質問・異議の内容分類と対応ルート判定", () => {
  test("SCEN-984: 不正な質問形式でも例外ハンドリングされる", () => {
    // ケース1: null値を含むリクエスト
    const nullValueRequest = {
      inquiry_id: "INQ001",
      customer_id: "CUST001",
      inquiry_content: null,
      inquiry_date: "2024-01-15T10:00:00Z",
      inquiry_type: "question",
    };

    const nullResult = classifyCustomerInquiry(nullValueRequest);
    expect(nullResult).toEqual({
      classification: "escalate",
      routing: "admin",
      error_code: "INVALID_CONTENT",
      is_handled: true,
    });

    // ケース2: 空文字列を含むリクエスト
    const emptyStringRequest = {
      inquiry_id: "INQ002",
      customer_id: "CUST001",
      inquiry_content: "",
      inquiry_date: "2024-01-15T10:00:00Z",
      inquiry_type: "question",
    };

    const emptyResult = classifyCustomerInquiry(emptyStringRequest);
    expect(emptyResult).toEqual({
      classification: "escalate",
      routing: "admin",
      error_code: "EMPTY_CONTENT",
      is_handled: true,
    });

    // ケース3: 定義されていないデータ型（数値のみ）
    const numericOnlyRequest = {
      inquiry_id: "INQ003",
      customer_id: "CUST001",
      inquiry_content: 12345,
      inquiry_date: "2024-01-15T10:00:00Z",
      inquiry_type: "question",
    };

    const numericResult = classifyCustomerInquiry(numericOnlyRequest);
    expect(numericResult).toEqual({
      classification: "escalate",
      routing: "admin",
      error_code: "INVALID_TYPE",
      is_handled: true,
    });

    // ケース4: 極端に長い文字列（5000文字超過）
    const longStringRequest = {
      inquiry_id: "INQ004",
      customer_id: "CUST001",
      inquiry_content: "a".repeat(5001),
      inquiry_date: "2024-01-15T10:00:00Z",
      inquiry_type: "question",
    };

    const longResult = classifyCustomerInquiry(longStringRequest);
    expect(longResult).toEqual({
      classification: "escalate",
      routing: "admin",
      error_code: "CONTENT_TOO_LONG",
      is_handled: true,
    });

    // ケース5: 特殊文字のみで構成されたリクエスト
    const specialCharRequest = {
      inquiry_id: "INQ005",
      customer_id: "CUST001",
      inquiry_content: "!@#$%^&*()",
      inquiry_date: "2024-01-15T10:00:00Z",
      inquiry_type: "question",
    };

    const specialResult = classifyCustomerInquiry(specialCharRequest);
    expect(specialResult).toEqual({
      classification: "escalate",
      routing: "admin",
      error_code: "INVALID_FORMAT",
      is_handled: true,
    });

    // すべてのケースでシステムが停止していないことを確認
    expect(nullResult.is_handled).toBe(true);
    expect(emptyResult.is_handled).toBe(true);
    expect(numericResult.is_handled).toBe(true);
    expect(longResult.is_handled).toBe(true);
    expect(specialResult.is_handled).toBe(true);

    // すべてのケースで管理者へのエスカレーションが実行されることを確認
    expect(nullResult.routing).toBe("admin");
    expect(emptyResult.routing).toBe("admin");
    expect(numericResult.routing).toBe("admin");
    expect(longResult.routing).toBe("admin");
    expect(specialResult.routing).toBe("admin");
  });
});