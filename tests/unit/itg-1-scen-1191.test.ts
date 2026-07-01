import { classifyInquiry } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1191: [error] 問い合わせ分類・優先度決定機能 - 内容が空文字列または不正な形式の問い合わせでエラーが発生する
  test("問い合わせ内容が空文字列または不正な形式のとき、エラーを発生させ分かりやすいエラーメッセージを表示する", () => {
    // 空文字列の場合
    expect(() =>
      classifyInquiry({
        inquiryContent: "",
        inquiryDate: "2024-01-15T10:00:00Z",
        customerId: "CUST001",
      })
    ).toThrow(/問い合わせ内容/);

    // nullの場合
    expect(() =>
      classifyInquiry({
        inquiryContent: null as any,
        inquiryDate: "2024-01-15T10:00:00Z",
        customerId: "CUST001",
      })
    ).toThrow(/問い合わせ内容/);

    // undefinedの場合
    expect(() =>
      classifyInquiry({
        inquiryContent: undefined as any,
        inquiryDate: "2024-01-15T10:00:00Z",
        customerId: "CUST001",
      })
    ).toThrow(/問い合わせ内容/);

    // 特殊文字のみの場合
    expect(() =>
      classifyInquiry({
        inquiryContent: "!@#$%",
        inquiryDate: "2024-01-15T10:00:00Z",
        customerId: "CUST001",
      })
    ).toThrow(/形式/);

    // 正常な問い合わせ内容の場合は正常に処理される
    const result = classifyInquiry({
      inquiryContent: "請求金額について質問があります",
      inquiryDate: "2024-01-15T10:00:00Z",
      customerId: "CUST001",
    });

    expect(result).toEqual({
      inquiryId: expect.any(String),
      classification: expect.any(String),
      priority: expect.any(Number),
      inquiryContent: "請求金額について質問があります",
      customerId: "CUST001",
      inquiryDate: "2024-01-15T10:00:00Z",
      errorLogged: false,
      createdAt: expect.any(String),
    });

    expect(result.priority).toBeGreaterThanOrEqual(1);
    expect(result.priority).toBeLessThanOrEqual(5);
  });
});