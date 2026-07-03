import { classifyInquiry } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1161: [error] 問い合わせ内容の分類・優先度決定機能 - 分類不可能または曖昧な問い合わせ内容をエラーで検出する
  test("問い合わせ内容の分類・優先度決定: 分類不可能・曖昧な内容をエラーで検出", () => {
    // 分類不可能なケース1: 空文字列
    expect(() => {
      classifyInquiry({
        inquiryId: "INQ-001",
        inquiryContent: "",
        customerId: "CUST-123",
        submittedAt: new Date("2024-01-15T10:00:00Z"),
      });
    }).toThrow(/分類/);

    // 分類不可能なケース2: 記号のみ
    expect(() => {
      classifyInquiry({
        inquiryId: "INQ-002",
        inquiryContent: "!!@##$$%%",
        customerId: "CUST-123",
        submittedAt: new Date("2024-01-15T10:00:00Z"),
      });
    }).toThrow(/分類/);

    // 分類不可能なケース3: 言語判定不可の混在テキスト
    expect(() => {
      classifyInquiry({
        inquiryId: "INQ-003",
        inquiryContent: "あいうえおXYZ123🎉🎊",
        customerId: "CUST-123",
        submittedAt: new Date("2024-01-15T10:00:00Z"),
      });
    }).toThrow(/分類/);

    // 曖昧なケース1: 複数カテゴリに該当する内容
    expect(() => {
      classifyInquiry({
        inquiryId: "INQ-004",
        inquiryContent: "請求額が間違っていて、納期も遅れています。どうなっているのか",
        customerId: "CUST-123",
        submittedAt: new Date("2024-01-15T10:00:00Z"),
      });
    }).toThrow(/複数/);

    // 曖昧なケース2: 複数の異なる問題が混在
    expect(() => {
      classifyInquiry({
        inquiryId: "INQ-005",
        inquiryContent: "請求書が届かないし、成果物も確認できません。契約内容も変わったと聞きました",
        customerId: "CUST-123",
        submittedAt: new Date("2024-01-15T10:00:00Z"),
      });
    }).toThrow(/複数/);

    // 正常系: 単一の明確なカテゴリに分類可能
    const result = classifyInquiry({
      inquiryId: "INQ-006",
      inquiryContent: "今月の請求額が前月より100万円高いです。確認してください",
      customerId: "CUST-123",
      submittedAt: new Date("2024-01-15T10:00:00Z"),
    });

    expect(result).toEqual({
      inquiryId: "INQ-006",
      classifiedCategory: "請求額異常",
      priority: 1,
      status: "classified",
      errorMessage: null,
      loggedAt: expect.any(String),
    });

    // 正常系: 納期関連の明確な問い合わせ
    const result2 = classifyInquiry({
      inquiryId: "INQ-007",
      inquiryContent: "成果物の納期が予定より3日遅れると聞きましたが、理由を教えてください",
      customerId: "CUST-456",
      submittedAt: new Date("2024-01-15T11:30:00Z"),
    });

    expect(result2).toEqual({
      inquiryId: "INQ-007",
      classifiedCategory: "納期遅延",
      priority: 2,
      status: "classified",
      errorMessage: null,
      loggedAt: expect.any(String),
    });

    // 正常系: 契約変更関連の問い合わせ
    const result3 = classifyInquiry({
      inquiryId: "INQ-008",
      inquiryContent: "新しい契約条件が適用されると聞きましたが、いつからですか",
      customerId: "CUST-789",
      submittedAt: new Date("2024-01-15T14:00:00Z"),
    });

    expect(result3).toEqual({
      inquiryId: "INQ-008",
      classifiedCategory: "契約変更",
      priority: 3,
      status: "classified",
      errorMessage: null,
      loggedAt: expect.any(String),
    });
  });
});