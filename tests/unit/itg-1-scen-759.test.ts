import { recordContractVersionHistory } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  test("SCEN-759: 契約書・提案資料のバージョン履歴自動記録 - 更新者情報が不完全な場合にバージョン記録が失敗する", () => {
    // ハッピーパス: 更新者情報が完全な場合
    const validPayload = {
      contractId: "CONTRACT-20240115-001",
      contractName: "基本サービス契約書",
      fileUrl: "s3://bucket/contract_v2.pdf",
      updaterId: "USR-00001",
      updaterName: "営業太郎",
      updateTimestamp: new Date("2024-01-15T10:30:00Z"),
      changeDescription: "料金改定に伴う内容更新",
      applicableCustomerIds: ["CUST-A001", "CUST-A002"],
    };

    const result = recordContractVersionHistory(validPayload);
    expect(result.success).toBe(true);
    expect(result.versionNumber).toBe(2);
    expect(result.recordedAt).toEqual(new Date("2024-01-15T10:30:00Z"));
    expect(result.updaterId).toBe("USR-00001");

    // エラーケース 1: updaterIdが空文字列
    const missingUpdaterId = {
      contractId: "CONTRACT-20240115-001",
      contractName: "基本サービス契約書",
      fileUrl: "s3://bucket/contract_v3.pdf",
      updaterId: "",
      updaterName: "営業太郎",
      updateTimestamp: new Date("2024-01-15T11:00:00Z"),
      changeDescription: "料金改定に伴う内容更新",
      applicableCustomerIds: ["CUST-A001"],
    };

    expect(() => recordContractVersionHistory(missingUpdaterId)).toThrow(
      /更新者情報/
    );

    // エラーケース 2: updaterNameが空文字列
    const missingUpdaterName = {
      contractId: "CONTRACT-20240115-001",
      contractName: "基本サービス契約書",
      fileUrl: "s3://bucket/contract_v4.pdf",
      updaterId: "USR-00002",
      updaterName: "",
      updateTimestamp: new Date("2024-01-15T11:15:00Z"),
      changeDescription: "割引ルール追加",
      applicableCustomerIds: ["CUST-B001"],
    };

    expect(() => recordContractVersionHistory(missingUpdaterName)).toThrow(
      /更新者情報/
    );

    // エラーケース 3: updateTimestampが未定義
    const missingTimestamp = {
      contractId: "CONTRACT-20240115-001",
      contractName: "基本サービス契約書",
      fileUrl: "s3://bucket/contract_v5.pdf",
      updaterId: "USR-00003",
      updaterName: "営業次郎",
      updateTimestamp: undefined as any,
      changeDescription: "成果報酬基準変更",
      applicableCustomerIds: ["CUST-C001"],
    };

    expect(() => recordContractVersionHistory(missingTimestamp)).toThrow(
      /更新者情報/
    );

    // エラーケース 4: 複数の更新者情報が不完全
    const multipleFieldsMissing = {
      contractId: "CONTRACT-20240115-001",
      contractName: "基本サービス契約書",
      fileUrl: "s3://bucket/contract_v6.pdf",
      updaterId: "",
      updaterName: "",
      updateTimestamp: new Date("2024-01-15T11:30:00Z"),
      changeDescription: "納期変更",
      applicableCustomerIds: ["CUST-D001"],
    };

    expect(() => recordContractVersionHistory(multipleFieldsMissing)).toThrow(
      /更新者情報/
    );

    // ハッピーパス: 追加適用顧客を含む場合
    const validWithApplicableCustomers = {
      contractId: "CONTRACT-20240115-002",
      contractName: "アドオンサービス契約書",
      fileUrl: "s3://bucket/addon_contract_v1.pdf",
      updaterId: "USR-00004",
      updaterName: "営業花子",
      updateTimestamp: new Date("2024-01-15T12:00:00Z"),
      changeDescription: "新顧客への契約種別追加",
      applicableCustomerIds: [
        "CUST-E001",
        "CUST-E002",
        "CUST-E003",
        "CUST-E004",
      ],
    };

    const resultWithCustomers =
      recordContractVersionHistory(validWithApplicableCustomers);
    expect(resultWithCustomers.success).toBe(true);
    expect(resultWithCustomers.versionNumber).toBe(1);
    expect(resultWithCustomers.applicableCustomerCount).toBe(4);
  });
});