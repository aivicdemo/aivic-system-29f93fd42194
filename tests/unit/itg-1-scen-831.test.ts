import { notifyConsultationContent } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-831: [error] 代表への相談内容通知機能 - 相談内容レコードに対応者情報が含まれていない場合、エラーが返却される
  test("相談内容レコードの対応者情報が空またはnullの場合、エラーが返却される", () => {
    const consultationRecord_missing_handler = {
      consultationId: "consul-20240115-001",
      customerId: "cust-12345",
      consultationContent: "契約内容の変更について質問があります",
      consultationDate: "2024-01-15T14:30:00Z",
      handlerName: null,
      handlerEmail: null,
      handlerUserId: null,
    };

    expect(() =>
      notifyConsultationContent(consultationRecord_missing_handler)
    ).toThrow(/対応者情報/);
  });

  test("相談内容レコードの対応者情報が空文字列の場合、エラーが返却される", () => {
    const consultationRecord_empty_handler = {
      consultationId: "consul-20240115-002",
      customerId: "cust-67890",
      consultationContent: "請求額の内訳について確認したいです",
      consultationDate: "2024-01-15T15:00:00Z",
      handlerName: "",
      handlerEmail: "",
      handlerUserId: "",
    };

    expect(() =>
      notifyConsultationContent(consultationRecord_empty_handler)
    ).toThrow(/対応者情報/);
  });

  test("相談内容レコードの対応者情報がすべて揃っている場合、正常に通知される", () => {
    const consultationRecord_with_handler = {
      consultationId: "consul-20240115-003",
      customerId: "cust-11111",
      consultationContent: "納期の変更について協議したい",
      consultationDate: "2024-01-15T16:00:00Z",
      handlerName: "営業担当太郎",
      handlerEmail: "taro.eigyo@company.com",
      handlerUserId: "user-5555",
      priority: "high",
      responseDeadline: "2024-01-16T09:00:00Z",
    };

    const result = notifyConsultationContent(consultationRecord_with_handler);

    expect(result).toEqual({
      notificationId: expect.any(String),
      consultationId: "consul-20240115-003",
      handlerName: "営業担当太郎",
      handlerEmail: "taro.eigyo@company.com",
      status: "notified",
      notificationSentAt: expect.any(String),
      routingPriority: "high",
    });
  });

  test("相談内容レコードのhandlerNameのみnullの場合、エラーが返却される", () => {
    const consultationRecord_partial_missing = {
      consultationId: "consul-20240115-004",
      customerId: "cust-22222",
      consultationContent: "サービス内容の確認",
      consultationDate: "2024-01-15T17:00:00Z",
      handlerName: null,
      handlerEmail: "taro.eigyo@company.com",
      handlerUserId: "user-6666",
    };

    expect(() =>
      notifyConsultationContent(consultationRecord_partial_missing)
    ).toThrow(/対応者情報/);
  });
});