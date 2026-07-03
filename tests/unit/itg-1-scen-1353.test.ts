import { validateSalesDataCompleteness } from "../../src/logic/it-1781935279444-2-2-1";

const fetchMock = require("jest-fetch-mock");

describe("営業データの完全性・正確性自動検証", () => {
  test("SCEN-1353: 必須項目未入力時に不足データとして検出され通知される", () => {
    fetchMock.resetMocks();

    // 【入力】必須項目の一部が未入力のデータ
    const incompleteData = {
      customerId: "", // 顧客ID未入力
      customerName: "", // 顧客名未入力
      salesAmount: 0, // 売上金額未入力（0は無効値）
      transactionDate: "", // 取引日未入力
      serviceType: "consulting", // サービス種別（入力済み）
      accountOwner: "user001", // 営業担当者（入力済み）
      userEmail: "user001@example.com",
    };

    // 【期待】検証ルール定義
    const validationRules = {
      customerId: { required: true, pattern: /^CUS-\d{6}$/ },
      customerName: { required: true, minLength: 1 },
      salesAmount: { required: true, min: 1 },
      transactionDate: {
        required: true,
        pattern: /^\d{4}-\d{2}-\d{2}$/,
      },
      serviceType: { required: false },
      accountOwner: { required: true, minLength: 1 },
    };

    // 【期待】メール通知のモック
    fetchMock.mockResponseOnce(
      JSON.stringify({
        messageId: "msg-001",
        sent: true,
        timestamp: "2024-01-15T10:30:00Z",
      }),
      { status: 200 }
    );

    // 【実行】検証を実行
    const result = validateSalesDataCompleteness(
      incompleteData,
      validationRules
    );

    // 【検証1】検証失敗が返される
    expect(result.isValid).toBe(false);

    // 【検証2】不足項目が正確に検出される
    expect(result.missingFields.length).toBe(4);
    expect(result.missingFields).toContain("customerId");
    expect(result.missingFields).toContain("customerName");
    expect(result.missingFields).toContain("salesAmount");
    expect(result.missingFields).toContain("transactionDate");

    // 【検証3】エラーメッセージに欠落項目名と件数が含まれる
    expect(result.notificationMessage).toMatch(/必須項目/);
    expect(result.notificationMessage).toMatch(/4件/);
    expect(result.notificationMessage).toMatch(/顧客ID/);
    expect(result.notificationMessage).toMatch(/顧客名/);

    // 【検証4】メール通知が送信される
    expect(fetchMock).toHaveBeenCalledWith(
      "https://notification-service/api/v1/send-email",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );

    // 【検証5】通知メール本文に欠落項目と件数が含まれる
    const emailCall = fetchMock.mock.calls[0];
    const emailBody = JSON.parse(emailCall[1].body);
    expect(emailBody.recipient).toBe("user001@example.com");
    expect(emailBody.subject).toMatch(/営業データ検証エラー/);
    expect(emailBody.body).toMatch(/必須項目が未入力/);
    expect(emailBody.body).toMatch(/4件/);

    // 【検証6】データ保存が実行されない（isValid === false で処理継続なし）
    expect(result.isSaved).toBe(false);

    // 【検証7】エラー状態が維持される
    expect(result.status).toBe("VALIDATION_FAILED");

    // 【検証8】各欠落項目の詳細が構造化されている
    expect(result.fieldErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: "customerId",
          reason: expect.stringMatching(/必須項目/),
        }),
        expect.objectContaining({
          fieldName: "customerName",
          reason: expect.stringMatching(/必須項目/),
        }),
        expect.objectContaining({
          fieldName: "salesAmount",
          reason: expect.stringMatching(/必須項目|値の範囲/),
        }),
        expect.objectContaining({
          fieldName: "transactionDate",
          reason: expect.stringMatching(/必須項目|形式/),
        }),
      ])
    );

    // 【検証9】タイムスタンプが正確に記録される
    expect(result.validationTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 【検証10】ユーザーに対する画面表示メッセージが準備される
    expect(result.displayMessage).toContain("エラー");
    expect(result.displayMessage).toContain("必須項目が未入力です");
  });
});