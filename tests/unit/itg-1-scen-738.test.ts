import { aggregateBillingItems } from "../../src/logic/it-1-2-1";

describe("請求対象項目の自動抽出・集計機能", () => {
  // SCEN-738
  test("同一顧客・同一サービスの複数営業データが集計時に正しく合算される", () => {
    // テストデータ: 同一顧客ID、同一サービスコードを持つ複数営業データレコード
    const salesData = [
      {
        customerId: "CUST-001",
        serviceCode: "SVC-A",
        salesAmount: 100000,
        quantity: 5,
        date: "2024-01-10",
        serviceType: "consultation",
      },
      {
        customerId: "CUST-001",
        serviceCode: "SVC-A",
        salesAmount: 50000,
        quantity: 3,
        date: "2024-01-15",
        serviceType: "consultation",
      },
      {
        customerId: "CUST-001",
        serviceCode: "SVC-A",
        salesAmount: 75000,
        quantity: 4,
        date: "2024-01-20",
        serviceType: "consultation",
      },
    ];

    // 請求対象項目の自動抽出・集計機能を実行
    const result = aggregateBillingItems(salesData);

    // 同一顧客・同一サービスでグループ化されていることを確認
    expect(result).toHaveLength(1);

    // 抽出されたレコード
    const aggregated = result[0];

    // 売上金額が各レコードの金額合計と一致することを検証
    // 100000 + 50000 + 75000 = 225000
    expect(aggregated.salesAmount).toBe(225000);

    // 数量が各レコードの数量合計と一致することを検証
    // 5 + 3 + 4 = 12
    expect(aggregated.quantity).toBe(12);

    // 顧客ID、サービスコードが元データと一致することを確認
    expect(aggregated.customerId).toBe("CUST-001");
    expect(aggregated.serviceCode).toBe("SVC-A");
    expect(aggregated.serviceType).toBe("consultation");
  });

  test("同一顧客の異なるサービスは別レコードで集計される", () => {
    // テストデータ: 同一顧客、異なるサービス
    const salesData = [
      {
        customerId: "CUST-002",
        serviceCode: "SVC-A",
        salesAmount: 100000,
        quantity: 5,
        date: "2024-01-10",
        serviceType: "consultation",
      },
      {
        customerId: "CUST-002",
        serviceCode: "SVC-B",
        salesAmount: 80000,
        quantity: 4,
        date: "2024-01-15",
        serviceType: "development",
      },
      {
        customerId: "CUST-002",
        serviceCode: "SVC-A",
        salesAmount: 50000,
        quantity: 2,
        date: "2024-01-20",
        serviceType: "consultation",
      },
    ];

    // 請求対象項目の自動抽出・集計機能を実行
    const result = aggregateBillingItems(salesData);

    // 2つのサービスコードで2件の請求レコードが生成されていることを確認
    expect(result).toHaveLength(2);

    // サービスA（SVC-A）のレコード検証
    const svcARecord = result.find((r) => r.serviceCode === "SVC-A");
    expect(svcARecord).toBeDefined();
    if (svcARecord) {
      expect(svcARecord.customerId).toBe("CUST-002");
      // 100000 + 50000 = 150000
      expect(svcARecord.salesAmount).toBe(150000);
      // 5 + 2 = 7
      expect(svcARecord.quantity).toBe(7);
      expect(svcARecord.serviceType).toBe("consultation");
    }

    // サービスB（SVC-B）のレコード検証
    const svcBRecord = result.find((r) => r.serviceCode === "SVC-B");
    expect(svcBRecord).toBeDefined();
    if (svcBRecord) {
      expect(svcBRecord.customerId).toBe("CUST-002");
      expect(svcBRecord.salesAmount).toBe(80000);
      expect(svcBRecord.quantity).toBe(4);
      expect(svcBRecord.serviceType).toBe("development");
    }
  });

  test("複数顧客の営業データは顧客ごとに分離される", () => {
    // テストデータ: 異なる顧客、同じサービス
    const salesData = [
      {
        customerId: "CUST-001",
        serviceCode: "SVC-A",
        salesAmount: 100000,
        quantity: 5,
        date: "2024-01-10",
        serviceType: "consultation",
      },
      {
        customerId: "CUST-002",
        serviceCode: "SVC-A",
        salesAmount: 60000,
        quantity: 3,
        date: "2024-01-15",
        serviceType: "consultation",
      },
      {
        customerId: "CUST-001",
        serviceCode: "SVC-A",
        salesAmount: 40000,
        quantity: 2,
        date: "2024-01-20",
        serviceType: "consultation",
      },
    ];

    // 請求対象項目の自動抽出・集計機能を実行
    const result = aggregateBillingItems(salesData);

    // 2つの顧客で2件の請求レコードが生成されていることを確認
    expect(result).toHaveLength(2);

    // 顧客CUST-001のレコード検証
    const cust001Record = result.find((r) => r.customerId === "CUST-001");
    expect(cust001Record).toBeDefined();
    if (cust001Record) {
      expect(cust001Record.serviceCode).toBe("SVC-A");
      // 100000 + 40000 = 140000
      expect(cust001Record.salesAmount).toBe(140000);
      // 5 + 2 = 7
      expect(cust001Record.quantity).toBe(7);
    }

    // 顧客CUST-002のレコード検証
    const cust002Record = result.find((r) => r.customerId === "CUST-002");
    expect(cust002Record).toBeDefined();
    if (cust002Record) {
      expect(cust002Record.serviceCode).toBe("SVC-A");
      expect(cust002Record.salesAmount).toBe(60000);
      expect(cust002Record.quantity).toBe(3);
    }
  });

  test("請求対象項目がすべて正確に保持される", () => {
    // テストデータ: 追加属性を含む営業データ
    const salesData = [
      {
        customerId: "CUST-003",
        serviceCode: "SVC-X",
        salesAmount: 120000,
        quantity: 6,
        date: "2024-01-10",
        serviceType: "support",
        accountManagerId: "MGR-001",
        contractId: "CNT-001",
      },
      {
        customerId: "CUST-003",
        serviceCode: "SVC-X",
        salesAmount: 80000,
        quantity: 4,
        date: "2024-01-25",
        serviceType: "support",
        accountManagerId: "MGR-001",
        contractId: "CNT-001",
      },
    ];

    // 請求対象項目の自動抽出・集計機能を実行
    const result = aggregateBillingItems(salesData);

    expect(result).toHaveLength(1);

    const aggregated = result[0];

    // 売上金額と数量の集計検証
    expect(aggregated.salesAmount).toBe(200000);
    expect(aggregated.quantity).toBe(10);

    // 顧客ID、サービスコード、その他請求対象項目が保持されていることを確認
    expect(aggregated.customerId).toBe("CUST-003");
    expect(aggregated.serviceCode).toBe("SVC-X");
    expect(aggregated.serviceType).toBe("support");
    expect(aggregated.accountManagerId).toBe("MGR-001");
    expect(aggregated.contractId).toBe("CNT-001");
  });

  test("単一の営業データレコードの場合も正しく処理される", () => {
    // テストデータ: 1件のみ
    const salesData = [
      {
        customerId: "CUST-004",
        serviceCode: "SVC-Z",
        salesAmount: 50000,
        quantity: 2,
        date: "2024-01-10",
        serviceType: "training",
      },
    ];

    // 請求対象項目の自動抽出・集計機能を実行
    const result = aggregateBillingItems(salesData);

    // 1件の請求レコードが生成されていることを確認
    expect(result).toHaveLength(1);

    const aggregated = result[0];

    // 値が変更されずに保持されていることを確認
    expect(aggregated.customerId).toBe("CUST-004");
    expect(aggregated.serviceCode).toBe("SVC-Z");
    expect(aggregated.salesAmount).toBe(50000);
    expect(aggregated.quantity).toBe(2);
    expect(aggregated.serviceType).toBe("training");
  });

  test("空の営業データ配列の場合は空配列を返す", () => {
    // テストデータ: 空配列
    const salesData: Array<{
      customerId: string;
      serviceCode: string;
      salesAmount: number;
      quantity: number;
      date: string;
      serviceType: string;
    }> = [];

    // 請求対象項目の自動抽出・集計機能を実行
    const result = aggregateBillingItems(salesData);

    // 空配列が返されることを確認
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  test("必須フィールドが欠落している場合はエラーを発生させる", () => {
    // テストデータ: customerId が欠落
    const invalidData = [
      {
        serviceCode: "SVC-A",
        salesAmount: 100000,
        quantity: 5,
        date: "2024-01-10",
        serviceType: "consultation",
      },
    ];

    // 必須フィールド欠落でエラー発生を検証
    expect(() =>
      aggregateBillingItems(invalidData as any)
    ).toThrow(/customerId/);
  });

  test("売上金額がゼロまたは負数の場合はエラーを発生させる", () => {
    // テストデータ: 負の売上金額
    const invalidData = [
      {
        customerId: "CUST-005",
        serviceCode: "SVC-A",
        salesAmount: -50000,
        quantity: 5,
        date: "2024-01-10",
        serviceType: "consultation",
      },
    ];

    // 負数でエラー発生を検証
    expect(() => aggregateBillingItems(invalidData)).toThrow(/売上金額/);
  });

  test("数量がゼロまたは負数の場合はエラーを発生させる", () => {
    // テストデータ: ゼロの数量
    const invalidData = [
      {
        customerId: "CUST-005",
        serviceCode: "SVC-A",
        salesAmount: 50000,
        quantity: 0,
        date: "2024-01-10",
        serviceType: "consultation",
      },
    ];

    // ゼロでエラー発生を検証
    expect(() => aggregateBillingItems(invalidData)).toThrow(/数量/);
  });
});