import { recordAlertNotificationError } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  // SCEN-1178
  test("アラート通知 - アラート送信先の設定が不完全な場合、通知処理が失敗してエラーログが記録される", () => {
    const incompleteAlertConfig = {
      alertName: "品質閾値超過",
      recipients: null,
      recipientEmail: "",
      notificationChannel: "email",
      thresholdValue: 80,
      isActive: true,
    };

    const expectedErrorCode = "ALERT_CONFIG_INCOMPLETE";
    const expectedTimestamp = new Date("2024-01-15T10:30:45Z");

    const result = recordAlertNotificationError(incompleteAlertConfig);

    expect(result).toEqual({
      errorCode: expectedErrorCode,
      errorMessage: "アラート送信先設定が不完全です",
      timestamp: expectedTimestamp,
      failedAlertName: "品質閾値超過",
      systemImpact: "isolated",
    });

    expect(result.errorCode).toBe(expectedErrorCode);
    expect(result.errorMessage).toMatch(/送信先/);
    expect(result.timestamp).toEqual(expectedTimestamp);
    expect(result.systemImpact).toBe("isolated");
  });

  test("アラート通知 - 送信先が指定されていない場合、エラーを throw する", () => {
    const invalidAlertConfig = {
      alertName: "品質低下警告",
      recipients: [],
      recipientEmail: null,
      notificationChannel: "email",
      thresholdValue: 75,
      isActive: true,
    };

    expect(() => recordAlertNotificationError(invalidAlertConfig)).toThrow(
      /送信先/
    );
  });

  test("アラート通知 - 必須項目が null の場合、エラーを throw する", () => {
    const missingRequiredFieldConfig = {
      alertName: "精度低下検知",
      recipients: null,
      recipientEmail: null,
      notificationChannel: "email",
      thresholdValue: 70,
      isActive: true,
    };

    expect(() =>
      recordAlertNotificationError(missingRequiredFieldConfig)
    ).toThrow(/設定/);
  });

  test("アラート通知 - 設定が完全な場合、正常に処理される", () => {
    const completeAlertConfig = {
      alertName: "品質閾値超過",
      recipients: ["user@example.com"],
      recipientEmail: "user@example.com",
      notificationChannel: "email",
      thresholdValue: 80,
      isActive: true,
    };

    const result = recordAlertNotificationError(completeAlertConfig);

    expect(result.errorCode).toBeUndefined();
    expect(result.systemImpact).toBe("none");
    expect(result.status).toBe("success");
  });
});