import { determineActiveContractVersion } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 契約書バージョン自動判定", () => {
  test("SCEN-1058: 契約書バージョン自動判定機能 - 顧客ごとの現在有効な契約書バージョンが正しく判定される", () => {
    const now = new Date("2024-06-15T10:00:00Z");
    const yesterday = new Date("2024-06-14T10:00:00Z");
    const tomorrow = new Date("2024-06-16T10:00:00Z");
    const sixMonthsAgo = new Date("2023-12-15T10:00:00Z");
    const sixMonthsFuture = new Date("2024-12-15T10:00:00Z");

    // テストケース1: 単一顧客の複数バージョン管理 - 有効な最新版を判定
    const contractsCustomer1 = [
      {
        contractId: "contract_001_v1",
        customerId: "cust_001",
        version: "1.0",
        effectiveFrom: new Date("2024-01-01T00:00:00Z"),
        effectiveTo: new Date("2024-03-31T23:59:59Z"),
        lastUpdatedAt: new Date("2024-01-15T09:30:00Z"),
      },
      {
        contractId: "contract_001_v2",
        customerId: "cust_001",
        version: "2.0",
        effectiveFrom: new Date("2024-04-01T00:00:00Z"),
        effectiveTo: new Date("2024-08-31T23:59:59Z"),
        lastUpdatedAt: new Date("2024-03-25T14:20:00Z"),
      },
      {
        contractId: "contract_001_v3",
        customerId: "cust_001",
        version: "3.0",
        effectiveFrom: new Date("2024-09-01T00:00:00Z"),
        effectiveTo: new Date("2024-12-31T23:59:59Z"),
        lastUpdatedAt: new Date("2024-08-30T11:15:00Z"),
      },
    ];

    const result1 = determineActiveContractVersion(
      contractsCustomer1,
      "cust_001",
      now
    );

    expect(result1).toEqual({
      version: "2.0",
      contractId: "contract_001_v2",
      lastUpdatedAt: new Date("2024-03-25T14:20:00Z"),
      effectiveFrom: new Date("2024-04-01T00:00:00Z"),
      effectiveTo: new Date("2024-08-31T23:59:59Z"),
    });

    // テストケース2: 有効期限切れの契約書は除外される
    const contractsWithExpired = [
      {
        contractId: "contract_002_old",
        customerId: "cust_002",
        version: "1.0",
        effectiveFrom: new Date("2024-01-01T00:00:00Z"),
        effectiveTo: new Date("2024-06-14T23:59:59Z"),
        lastUpdatedAt: new Date("2024-01-10T10:00:00Z"),
      },
      {
        contractId: "contract_002_current",
        customerId: "cust_002",
        version: "2.0",
        effectiveFrom: new Date("2024-06-15T00:00:00Z"),
        effectiveTo: new Date("2024-12-31T23:59:59Z"),
        lastUpdatedAt: new Date("2024-06-10T15:45:00Z"),
      },
    ];

    const result2 = determineActiveContractVersion(
      contractsWithExpired,
      "cust_002",
      now
    );

    expect(result2).toEqual({
      version: "2.0",
      contractId: "contract_002_current",
      lastUpdatedAt: new Date("2024-06-10T15:45:00Z"),
      effectiveFrom: new Date("2024-06-15T00:00:00Z"),
      effectiveTo: new Date("2024-12-31T23:59:59Z"),
    });

    // テストケース3: 複数顧客のシナリオ - 顧客ごとに異なるバージョンが返される
    const contractsMultipleCustomers = [
      {
        contractId: "contract_003_v1",
        customerId: "cust_003",
        version: "1.5",
        effectiveFrom: new Date("2024-02-01T00:00:00Z"),
        effectiveTo: new Date("2024-07-31T23:59:59Z"),
        lastUpdatedAt: new Date("2024-02-05T08:20:00Z"),
      },
      {
        contractId: "contract_004_v2",
        customerId: "cust_004",
        version: "2.1",
        effectiveFrom: new Date("2024-05-01T00:00:00Z"),
        effectiveTo: new Date("2024-10-31T23:59:59Z"),
        lastUpdatedAt: new Date("2024-04-28T16:30:00Z"),
      },
    ];

    const result3a = determineActiveContractVersion(
      contractsMultipleCustomers,
      "cust_003",
      now
    );

    expect(result3a).toEqual({
      version: "1.5",
      contractId: "contract_003_v1",
      lastUpdatedAt: new Date("2024-02-05T08:20:00Z"),
      effectiveFrom: new Date("2024-02-01T00:00:00Z"),
      effectiveTo: new Date("2024-07-31T23:59:59Z"),
    });

    const result3b = determineActiveContractVersion(
      contractsMultipleCustomers,
      "cust_004",
      now
    );

    expect(result3b).toEqual({
      version: "2.1",
      contractId: "contract_004_v2",
      lastUpdatedAt: new Date("2024-04-28T16:30:00Z"),
      effectiveFrom: new Date("2024-05-01T00:00:00Z"),
      effectiveTo: new Date("2024-10-31T23:59:59Z"),
    });

    // テストケース4: 複数の有効な契約書が存在する場合、最新版が優先される
    const contractsMultipleActive = [
      {
        contractId: "contract_005_v1",
        customerId: "cust_005",
        version: "1.0",
        effectiveFrom: new Date("2024-01-01T00:00:00Z"),
        effectiveTo: new Date("2024-12-31T23:59:59Z"),
        lastUpdatedAt: new Date("2024-01-05T10:00:00Z"),
      },
      {
        contractId: "contract_005_v2",
        customerId: "cust_005",
        version: "2.0",
        effectiveFrom: new Date("2024-06-01T00:00:00Z"),
        effectiveTo: new Date("2024-12-31T23:59:59Z"),
        lastUpdatedAt: new Date("2024-05-28T13:00:00Z"),
      },
    ];

    const result4 = determineActiveContractVersion(
      contractsMultipleActive,
      "cust_005",
      now
    );

    expect(result4).toEqual({
      version: "2.0",
      contractId: "contract_005_v2",
      lastUpdatedAt: new Date("2024-05-28T13:00:00Z"),
      effectiveFrom: new Date("2024-06-01T00:00:00Z"),
      effectiveTo: new Date("2024-12-31T23:59:59Z"),
    });

    // テストケース5: 有効な契約書がない顧客 - エラー
    const contractsWithoutValid = [
      {
        contractId: "contract_006_old",
        customerId: "cust_006",
        version: "1.0",
        effectiveFrom: new Date("2024-01-01T00:00:00Z"),
        effectiveTo: new Date("2024-06-14T23:59:59Z"),
        lastUpdatedAt: new Date("2024-01-10T10:00:00Z"),
      },
    ];

    expect(() => {
      determineActiveContractVersion(
        contractsWithoutValid,
        "cust_006",
        now
      );
    }).toThrow(/有効な契約書/);

    // テストケース6: 指定顧客IDが存在しない - エラー
    const contractsOtherCustomer = [
      {
        contractId: "contract_007_v1",
        customerId: "cust_007",
        version: "1.0",
        effectiveFrom: new Date("2024-01-01T00:00:00Z"),
        effectiveTo: new Date("2024-12-31T23:59:59Z"),
        lastUpdatedAt: new Date("2024-01-15T09:00:00Z"),
      },
    ];

    expect(() => {
      determineActiveContractVersion(
        contractsOtherCustomer,
        "cust_999",
        now
      );
    }).toThrow(/顧客/);

    // テストケース7: 有効期限が今から始まる契約書（境界値）
    const contractsBoundaryStart = [
      {
        contractId: "contract_008_v1",
        customerId: "cust_008",
        version: "1.0",
        effectiveFrom: new Date("2024-06-15T00:00:00Z"),
        effectiveTo: new Date("2024-12-31T23:59:59Z"),
        lastUpdatedAt: new Date("2024-06-10T11:00:00Z"),
      },
    ];

    const result7 = determineActiveContractVersion(
      contractsBoundaryStart,
      "cust_008",
      now
    );

    expect(result7).toEqual({
      version: "1.0",
      contractId: "contract_008_v1",
      lastUpdatedAt: new Date("2024-06-10T11:00:00Z"),
      effectiveFrom: new Date("2024-06-15T00:00:00Z"),
      effectiveTo: new Date("2024-12-31T23:59:59Z"),
    });

    // テストケース8: 有効期限が今で終わる契約書（境界値 - 有効）
    const contractsBoundaryEnd = [
      {
        contractId: "contract_009_v1",
        customerId: "cust_009",
        version: "1.0",
        effectiveFrom: new Date("2024-01-01T00:00:00Z"),
        effectiveTo: new Date("2024-06-15T23:59:59Z"),
        lastUpdatedAt: new Date("2024-01-10T10:00:00Z"),
      },
    ];

    const result8 = determineActiveContractVersion(
      contractsBoundaryEnd,
      "cust_009",
      now
    );

    expect(result8).toEqual({
      version: "1.0",
      contractId: "contract_009_v1",
      lastUpdatedAt: new Date("2024-01-10T10:00:00Z"),
      effectiveFrom: new Date("2024-01-01T00:00:00Z"),
      effectiveTo: new Date("2024-06-15T23:59:59Z"),
    });
  });
});