import { classifyInquiryCategory } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1188
  test("問い合わせメール内容から5つのカテゴリに正しく分類される", () => {
    const billingInquiry = {
      subject: "請求額の確認",
      body: "2024年1月の請求額が前月比で50%増加しているのはなぜですか。内訳を確認したいです。",
    };

    const contractInquiry = {
      subject: "契約条件の変更確認",
      body: "先月提示いただいた契約変更内容について、新しい割引率が適用される開始日時を教えてください。",
    };

    const deliverableInquiry = {
      subject: "成果物の納期について",
      body: "契約で定義された成果物の納期が3月末となっていますが、現在の進捗状況と最終納期を確認したいです。",
    };

    const salesDataInquiry = {
      subject: "営業データの検証",
      body: "今月のアポ数が記録されている営業データですが、成約数との整合性に疑問があります。営業活動の詳細を確認できますか。",
    };

    const otherInquiry = {
      subject: "その他の問い合わせ",
      body: "システムへのアクセス方法がわかりません。ポータルにログインできないのですが、どうすればよいですか。",
    };

    const billingResult = classifyInquiryCategory(billingInquiry);
    expect(billingResult.category).toBe("請求");
    expect(billingResult.priority).toBe(1);

    const contractResult = classifyInquiryCategory(contractInquiry);
    expect(contractResult.category).toBe("契約");
    expect(contractResult.priority).toBe(1);

    const deliverableResult = classifyInquiryCategory(deliverableInquiry);
    expect(deliverableResult.category).toBe("成果物");
    expect(deliverableResult.priority).toBe(2);

    const salesDataResult = classifyInquiryCategory(salesDataInquiry);
    expect(salesDataResult.category).toBe("営業データ");
    expect(salesDataResult.priority).toBe(2);

    const otherResult = classifyInquiryCategory(otherInquiry);
    expect(otherResult.category).toBe("その他");
    expect(otherResult.priority).toBe(3);
  });
});