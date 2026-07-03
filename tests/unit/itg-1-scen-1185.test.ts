import { saveInquiryResponseRecord } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-1185
  test("根拠資料が不足している状態で問い合わせ対応記録の保存を試行した場合、エラーが返される", () => {
    const inquiryRecord = {
      inquiry_id: "INQ-20240115-001",
      inquiry_content: "請求額が前月と異なります。確認してください。",
      inquiry_category: "請求金額相違",
      response_content: "契約条件の割引が今月から適用されたため、請求額が変更されました。",
      response_date: "2024-01-15T10:30:00Z",
      responder_name: "営業代行企業 営業オペレーター",
      responder_id: "OP-001",
      supporting_documents: [],
      inquiry_response_id: "RESP-20240115-001",
      customer_id: "CUST-ABC",
      contract_id: "CONTRACT-XYZ",
    };

    expect(() => saveInquiryResponseRecord(inquiryRecord)).toThrow(/根拠資料/);
  });
});