import { recordOperationLog } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 操作ログ自動記録", () => {
  test("SCEN-856: ポータルへのログイン時にログイン日時・実行者情報が自動記録される", () => {
    // Arrange: ログイン時の操作ログ記録入力データ
    const loginOperationInput = {
      userId: "user_12345",
      userName: "山田太郎",
      operationType: "ログイン",
      operationTimestamp: new Date("2024-01-15T10:30:45Z"),
      systemName: "営業データ品質管理・請求自動化システム",
      ipAddress: "192.168.1.100",
      sessionId: "sess_abc123def456",
    };

    // Act: ポータルログイン時の操作ログ記録関数を呼び出す
    const recordedLog = recordOperationLog(loginOperationInput);

    // Assert: 記録されたログの検証
    // (1) ログイン日時が正確に記録されていることを検証
    expect(recordedLog.operationTimestamp).toEqual(
      new Date("2024-01-15T10:30:45Z")
    );

    // (2) 実行者情報（ユーザーID、ユーザー名）が正確に記録されていることを検証
    expect(recordedLog.userId).toBe("user_12345");
    expect(recordedLog.userName).toBe("山田太郎");

    // (3) 操作の種類が「ログイン」として記録されていることを検証
    expect(recordedLog.operationType).toBe("ログイン");

    // (4) ログレコードの構造と必須フィールドの存在を検証
    expect(recordedLog).toHaveProperty("logId");
    expect(recordedLog).toHaveProperty("operationTimestamp");
    expect(recordedLog).toHaveProperty("userId");
    expect(recordedLog).toHaveProperty("userName");
    expect(recordedLog).toHaveProperty("operationType");
    expect(recordedLog).toHaveProperty("systemName");
    expect(recordedLog).toHaveProperty("ipAddress");
    expect(recordedLog).toHaveProperty("sessionId");

    // (5) ログが永続化可能な形式で返されていることを検証
    expect(typeof recordedLog.logId).toBe("string");
    expect(recordedLog.logId.length).toBeGreaterThan(0);

    // (6) ログインシステム名が記録されていることを検証
    expect(recordedLog.systemName).toBe(
      "営業データ品質管理・請求自動化システム"
    );

    // (7) セッション識別情報が記録されていることを検証
    expect(recordedLog.sessionId).toBe("sess_abc123def456");

    // (8) IP アドレス情報が記録されていることを検証
    expect(recordedLog.ipAddress).toBe("192.168.1.100");

    // (9) ログが有効な状態として記録されていることを検証
    expect(recordedLog.isActive).toBe(true);
  });
});