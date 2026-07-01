import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { validateAndSendLatestVersionNotification } from "../../src/logic/it-1781935279444-2-2-1";

describe("最新版リリース通知自動配信機能 - エラーハンドリング", () => {
  let consoleErrorSpy: jest.SpyInstance;
  let errorLogs: string[];

  beforeEach(() => {
    errorLogs = [];
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation((message: string) => {
        errorLogs.push(message);
      });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // SCEN-775
  test("通知内容が空または必須項目が欠落している場合にエラーとして検出される", () => {
    // ケース1: 通知内容が空（null）
    expect(() => {
      validateAndSendLatestVersionNotification(null);
    }).toThrow(/通知内容/);

    // ケース2: 通知内容が空（undefined）
    expect(() => {
      validateAndSendLatestVersionNotification(undefined);
    }).toThrow(/通知内容/);

    // ケース3: 通知内容が空オブジェクト
    expect(() => {
      validateAndSendLatestVersionNotification({});
    }).toThrow(/リリース版番号/);

    // ケース4: リリース版番号が欠落
    expect(() => {
      validateAndSendLatestVersionNotification({
        releaseDate: "2024-01-15T10:00:00Z",
        targetUsers: ["user001", "user002"],
        notificationContent: "新しいバージョンがリリースされました",
      });
    }).toThrow(/リリース版番号/);

    // ケース5: リリース版番号が空文字列
    expect(() => {
      validateAndSendLatestVersionNotification({
        releaseVersion: "",
        releaseDate: "2024-01-15T10:00:00Z",
        targetUsers: ["user001", "user002"],
        notificationContent: "新しいバージョンがリリースされました",
      });
    }).toThrow(/リリース版番号/);

    // ケース6: リリース日時が欠落
    expect(() => {
      validateAndSendLatestVersionNotification({
        releaseVersion: "v2.1.0",
        targetUsers: ["user001", "user002"],
        notificationContent: "新しいバージョンがリリースされました",
      });
    }).toThrow(/リリース日時/);

    // ケース7: リリース日時が空文字列
    expect(() => {
      validateAndSendLatestVersionNotification({
        releaseVersion: "v2.1.0",
        releaseDate: "",
        targetUsers: ["user001", "user002"],
        notificationContent: "新しいバージョンがリリースされました",
      });
    }).toThrow(/リリース日時/);

    // ケース8: 通知対象ユーザーが欠落
    expect(() => {
      validateAndSendLatestVersionNotification({
        releaseVersion: "v2.1.0",
        releaseDate: "2024-01-15T10:00:00Z",
        notificationContent: "新しいバージョンがリリースされました",
      });
    }).toThrow(/通知対象ユーザー/);

    // ケース9: 通知対象ユーザーが空配列
    expect(() => {
      validateAndSendLatestVersionNotification({
        releaseVersion: "v2.1.0",
        releaseDate: "2024-01-15T10:00:00Z",
        targetUsers: [],
        notificationContent: "新しいバージョンがリリースされました",
      });
    }).toThrow(/通知対象ユーザー/);

    // ケース10: 通知対象ユーザーが null
    expect(() => {
      validateAndSendLatestVersionNotification({
        releaseVersion: "v2.1.0",
        releaseDate: "2024-01-15T10:00:00Z",
        targetUsers: null,
        notificationContent: "新しいバージョンがリリース",
      });
    }).toThrow(/通知対象ユーザー/);

    // エラーが記録されたことを検証
    expect(errorLogs.length).toBeGreaterThan(0);

    // 正常系：すべての必須項目が揃っている場合
    const validNotification = {
      releaseVersion: "v2.1.0",
      releaseDate: "2024-01-15T10:00:00Z",
      targetUsers: ["user001", "user002", "user003"],
      notificationContent: "新しいバージョンがリリースされました",
      changeDescription: "バグ修正とパフォーマンス改善",
    };

    const result = validateAndSendLatestVersionNotification(validNotification);

    // 結果の構造を検証
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("notificationId");
    expect(result).toHaveProperty("sentAt");
    expect(result).toHaveProperty("recipientCount");

    // 結果の具体的な値を検証
    expect(result.success).toBe(true);
    expect(result.recipientCount).toBe(3);
    expect(typeof result.notificationId).toBe("string");
    expect(result.notificationId.length).toBeGreaterThan(0);
  });
});