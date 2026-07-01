import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import fetchMock from "jest-fetch-mock";
import { validateSalesActivityData } from "../../src/logic/it-1781935279444-2-2-1";

fetchMock.enableMocks();

describe("営業活動データ自動検証・エラー通知機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-734
  test("矛盾値（アポ確定日が営業活動日より前）を検出し、修正が必要な項目として営業担当者に通知する", async () => {
    const salesActivityDate = new Date("2024-01-15T09:00:00Z");
    const appointmentConfirmedDate = new Date("2024-01-10T14:00:00Z");

    const validationInput = {
      recordId: "SALE-20240115-001",
      salesPersonId: "SP-0001",
      salesPersonEmail: "sales@example.com",
      salesPersonName: "営業太郎",
      activityDate: salesActivityDate,
      appointmentConfirmedDate: appointmentConfirmedDate,
      customerName: "顧客A",
      customerId: "CUST-001",
      activityType: "訪問",
      result: "アポ確定",
      serviceType: "サービスA",
    };

    // API モック：エラー通知送信
    fetchMock.mockResponseOnce(
      JSON.stringify({
        notificationId: "NOTIF-20240115-001",
        status: "sent",
        timestamp: "2024-01-15T10:30:00Z",
      }),
      { status: 200 }
    );

    const result = await validateSalesActivityData(validationInput);

    // 検証結果の確認
    expect(result).toBeDefined();
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe("APPT_DATE_BEFORE_ACTIVITY");
    expect(result.errorMessage).toContain("アポ確定日が営業活動日より前");
    expect(result.conflictingFields).toEqual([
      "activityDate",
      "appointmentConfirmedDate",
    ]);

    // 対象レコード情報の確認
    expect(result.recordInfo).toBeDefined();
    expect(result.recordInfo.recordId).toBe("SALE-20240115-001");
    expect(result.recordInfo.salesPersonId).toBe("SP-0001");
    expect(result.recordInfo.customerName).toBe("顧客A");

    // エラー詳細の確認
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails.activityDate).toEqual(
      new Date("2024-01-15T09:00:00Z")
    );
    expect(result.errorDetails.appointmentConfirmedDate).toEqual(
      new Date("2024-01-10T14:00:00Z")
    );
    expect(result.errorDetails.daysDifference).toBe(-5);

    // 修正が必要な項目の確認
    expect(result.correctionRequired).toBe(true);
    expect(result.requiredCorrections).toContain(
      "アポ確定日が営業活動日より前であるため修正が必要"
    );

    // エラー通知送信の確認
    expect(result.notificationStatus).toBeDefined();
    expect(result.notificationStatus.sent).toBe(true);
    expect(result.notificationStatus.recipientEmail).toBe(
      "sales@example.com"
    );
    expect(result.notificationStatus.recipientName).toBe("営業太郎");

    // 通知内容の確認
    expect(result.notificationContent).toBeDefined();
    expect(result.notificationContent.subject).toContain("営業活動データ修正指示");
    expect(result.notificationContent.body).toContain("アポ確定日");
    expect(result.notificationContent.body).toContain("営業活動日より前");
    expect(result.notificationContent.body).toContain("SALE-20240115-001");
    expect(result.notificationContent.body).toContain("顧客A");

    // API 呼び出しの確認
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toContain("/notifications/send");
    expect(callArgs[1]?.method).toBe("POST");

    const requestBody = JSON.parse(callArgs[1]?.body as string);
    expect(requestBody.notificationType).toBe("validation_error");
    expect(requestBody.priority).toBe("high");
    expect(requestBody.salesPersonId).toBe("SP-0001");
    expect(requestBody.recordId).toBe("SALE-20240115-001");
  });
});