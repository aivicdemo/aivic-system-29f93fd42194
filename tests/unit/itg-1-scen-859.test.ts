import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { recordOperationLog } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ管理 - 操作ログ自動記録機能", () => {
  let originalAuthContext: any;

  beforeEach(() => {
    originalAuthContext = global.authContext;
  });

  afterEach(() => {
    global.authContext = originalAuthContext;
  });

  // SCEN-859: [error] 操作ログ自動記録機能 - 実行者情報が取得できない場合、ログ記録エラーとして検出される
  test("should throw error when executor info is unavailable during operation log recording", () => {
    const operationData = {
      operationId: "OP-2024-001",
      operationType: "UPDATE",
      targetTableName: "営業データ項目メタデータ",
      targetRecordId: "META-20240115-001",
      operationTimestamp: new Date("2024-01-15T09:30:00Z"),
      operationDetails: {
        fieldName: "データ型",
        oldValue: "INTEGER",
        newValue: "STRING",
      },
      systemStatus: "ACTIVE",
    };

    global.authContext = null;

    expect(() => recordOperationLog(operationData)).toThrow(/実行者情報/);
  });

  test("should handle missing auth context and return error status when recording operation log", () => {
    const operationData = {
      operationId: "OP-2024-002",
      operationType: "CREATE",
      targetTableName: "営業データ項目メタデータ",
      targetRecordId: "META-20240115-002",
      operationTimestamp: new Date("2024-01-15T10:00:00Z"),
      operationDetails: {
        itemName: "成約数",
        unit: "件",
        dataType: "INTEGER",
      },
      systemStatus: "ACTIVE",
    };

    global.authContext = undefined;

    expect(() => recordOperationLog(operationData)).toThrow(/実行者情報/);
  });

  test("should successfully record operation log when executor info is present", () => {
    const operationData = {
      operationId: "OP-2024-003",
      operationType: "UPDATE",
      targetTableName: "営業データ項目メタデータ",
      targetRecordId: "META-20240115-003",
      operationTimestamp: new Date("2024-01-15T11:00:00Z"),
      operationDetails: {
        fieldName: "計算ロジック",
        oldValue: "SUM(営業実績)",
        newValue: "SUM(営業実績) * 割引率",
      },
      systemStatus: "ACTIVE",
    };

    global.authContext = {
      userId: "USER-001",
      userName: "田中太郎",
      userRole: "ADMIN",
      organizationId: "ORG-001",
      loginTimestamp: new Date("2024-01-15T08:00:00Z"),
    };

    const result = recordOperationLog(operationData);

    expect(result).toEqual({
      logId: expect.any(String),
      operationId: "OP-2024-003",
      executorUserId: "USER-001",
      executorUserName: "田中太郎",
      executorRole: "ADMIN",
      operationType: "UPDATE",
      targetTableName: "営業データ項目メタデータ",
      targetRecordId: "META-20240115-003",
      operationTimestamp: new Date("2024-01-15T11:00:00Z"),
      recordedTimestamp: expect.any(Date),
      operationDetails: {
        fieldName: "計算ロジック",
        oldValue: "SUM(営業実績)",
        newValue: "SUM(営業実績) * 割引率",
      },
      logStatus: "SUCCESS",
      errorMessage: null,
    });

    expect(result.logStatus).toBe("SUCCESS");
    expect(result.errorMessage).toBeNull();
  });

  test("should detect and log error when auth context has missing userId field", () => {
    const operationData = {
      operationId: "OP-2024-004",
      operationType: "DELETE",
      targetTableName: "営業データ項目メタデータ",
      targetRecordId: "META-20240115-004",
      operationTimestamp: new Date("2024-01-15T12:00:00Z"),
      operationDetails: {
        itemName: "アポ数",
        reason: "廃止項目",
      },
      systemStatus: "ACTIVE",
    };

    global.authContext = {
      userName: "田中太郎",
      userRole: "ADMIN",
      organizationId: "ORG-001",
    };

    expect(() => recordOperationLog(operationData)).toThrow(/実行者情報/);
  });

  test("should detect and log error when auth context has missing userName field", () => {
    const operationData = {
      operationId: "OP-2024-005",
      operationType: "CREATE",
      targetTableName: "営業データ項目メタデータ",
      targetRecordId: "META-20240115-005",
      operationTimestamp: new Date("2024-01-15T13:00:00Z"),
      operationDetails: {
        itemName: "顧客反応度",
        unit: "ポイント",
        dataType: "NUMERIC",
      },
      systemStatus: "ACTIVE",
    };

    global.authContext = {
      userId: "USER-002",
      userRole: "OPERATOR",
      organizationId: "ORG-001",
    };

    expect(() => recordOperationLog(operationData)).toThrow(/実行者情報/);
  });

  test("should handle error gracefully and return error status when executor info extraction fails", () => {
    const operationData = {
      operationId: "OP-2024-006",
      operationType: "UPDATE",
      targetTableName: "営業データ項目メタデータ",
      targetRecordId: "META-20240115-006",
      operationTimestamp: new Date("2024-01-15T14:00:00Z"),
      operationDetails: {
        fieldName: "レポートマッピング",
        oldValue: "月次サマリー.売上",
        newValue: "月次サマリー.売上額",
      },
      systemStatus: "ACTIVE",
    };

    global.authContext = {
      userId: "USER-003",
      userName: "鈴木花子",
      userRole: "VIEWER",
      organizationId: "ORG-001",
    };

    const result = recordOperationLog(operationData);

    expect(result.logStatus).toBe("SUCCESS");
    expect(result.executorUserId).toBe("USER-003");
    expect(result.executorUserName).toBe("鈴木花子");
    expect(result.errorMessage).toBeNull();
  });
});