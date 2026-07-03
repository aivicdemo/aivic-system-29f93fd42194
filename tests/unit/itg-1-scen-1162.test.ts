import { classifyAndPrioritizeInquiry } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1162: [edge] 問い合わせ内容の分類・優先度決定機能 - 空文字列またはnullの問い合わせ内容に対してバリデーションエラーを返す
  test("should return validation error when inquiry content is empty string or null", () => {
    // Test Case 1: Empty string input
    expect(() => {
      classifyAndPrioritizeInquiry({
        inquiryContent: "",
        customerId: "CUST001",
        inquiryDate: "2024-01-15T10:30:00Z",
      });
    }).toThrow(/問い合わせ内容/);

    // Test Case 2: Null input
    expect(() => {
      classifyAndPrioritizeInquiry({
        inquiryContent: null as any,
        customerId: "CUST001",
        inquiryDate: "2024-01-15T10:30:00Z",
      });
    }).toThrow(/問い合わせ内容/);

    // Test Case 3: Undefined input
    expect(() => {
      classifyAndPrioritizeInquiry({
        inquiryContent: undefined as any,
        customerId: "CUST001",
        inquiryDate: "2024-01-15T10:30:00Z",
      });
    }).toThrow(/問い合わせ内容/);

    // Test Case 4: Whitespace-only string should also fail
    expect(() => {
      classifyAndPrioritizeInquiry({
        inquiryContent: "   ",
        customerId: "CUST001",
        inquiryDate: "2024-01-15T10:30:00Z",
      });
    }).toThrow(/問い合わせ内容/);

    // Test Case 5: Valid inquiry content should succeed
    const validResult = classifyAndPrioritizeInquiry({
      inquiryContent: "請求額について質問があります",
      customerId: "CUST001",
      inquiryDate: "2024-01-15T10:30:00Z",
    });

    expect(validResult).toBeDefined();
    expect(validResult.classification).toBeDefined();
    expect(validResult.priority).toBeDefined();
    expect(typeof validResult.priority).toBe("number");
    expect(validResult.priority).toBeGreaterThanOrEqual(1);
    expect(validResult.priority).toBeLessThanOrEqual(5);
  });
});