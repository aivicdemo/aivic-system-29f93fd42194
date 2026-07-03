import { extractBillingItemsFromSalesData } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-851: [normal] 過去契約履歴・請求データの時系列抽出機能 - 抽出データの変更前後差分が正確に可視化される
  test("過去契約履歴・請求データの変更前後差分が時系列で正確に可視化される", () => {
    // 初期状態：契約データ（変更前）をスナップショットとして記録
    const initialContractData = {
      contractId: "CNT-001",
      customerId: "CUST-A",
      serviceId: "SVC-001",
      contractAmount: 100000,
      contractStartDate: "2024-01-01",
      contractEndDate: "2024-12-31",
      discountRate: 0,
      billingCycleType: "monthly",
    };

    // 変更1：金額を100000から120000に変更
    const changeLog1 = {
      changeId: "CHG-001",
      contractId: "CNT-001",
      changedAt: new Date("2024-02-15T10:30:00Z"),
      changedBy: "user001",
      fieldName: "contractAmount",
      beforeValue: 100000,
      afterValue: 120000,
      sequenceNumber: 1,
    };

    // 変更2：割引率を0から10に変更
    const changeLog2 = {
      changeId: "CHG-002",
      contractId: "CNT-001",
      changedAt: new Date("2024-03-10T14:45:00Z"),
      changedBy: "user002",
      fieldName: "discountRate",
      beforeValue: 0,
      afterValue: 10,
      sequenceNumber: 2,
    };

    // 変更3：契約終了日を2024-12-31から2025-06-30に変更
    const changeLog3 = {
      changeId: "CHG-003",
      contractId: "CNT-001",
      changedAt: new Date("2024-04-05T09:15:00Z"),
      changedBy: "user001",
      fieldName: "contractEndDate",
      beforeValue: "2024-12-31",
      afterValue: "2025-06-30",
      sequenceNumber: 3,
    };

    const changeLogs = [changeLog1, changeLog2, changeLog3];

    // 請求データ（各変更後の状態）
    const billingDataSnapshot1 = {
      billingId: "BIL-001",
      contractId: "CNT-001",
      customerId: "CUST-A",
      serviceId: "SVC-001",
      billingAmount: 100000,
      billingDate: "2024-02-01",
      billingStatus: "draft",
    };

    const billingDataSnapshot2 = {
      billingId: "BIL-002",
      contractId: "CNT-001",
      customerId: "CUST-A",
      serviceId: "SVC-001",
      billingAmount: 120000,
      billingDate: "2024-03-01",
      billingStatus: "draft",
    };

    const billingDataSnapshot3 = {
      billingId: "BIL-003",
      contractId: "CNT-001",
      customerId: "CUST-A",
      serviceId: "SVC-001",
      billingAmount: 108000,
      billingDate: "2024-04-01",
      billingStatus: "draft",
    };

    const billingDataSnapshots = [
      billingDataSnapshot1,
      billingDataSnapshot2,
      billingDataSnapshot3,
    ];

    // 関数を呼び出して差分を抽出
    const result = extractBillingItemsFromSalesData({
      contractId: "CNT-001",
      customerId: "CUST-A",
      serviceId: "SVC-001",
      initialContractData,
      changeLogs,
      billingDataSnapshots,
    });

    // 期待結果の検証

    // 1. 抽出されたデータが存在することを確認
    expect(result).toBeDefined();
    expect(result.contractId).toBe("CNT-001");
    expect(result.customerId).toBe("CUST-A");
    expect(result.serviceId).toBe("SVC-001");

    // 2. 差分情報が3件すべて記録されていることを確認
    expect(result.changeDetails).toHaveLength(3);

    // 3. 最初の変更：金額変更（100000 → 120000）
    expect(result.changeDetails[0]).toEqual({
      changeId: "CHG-001",
      fieldName: "contractAmount",
      beforeValue: 100000,
      afterValue: 120000,
      changedAt: new Date("2024-02-15T10:30:00Z"),
      changedBy: "user001",
      sequenceNumber: 1,
    });

    // 4. 2番目の変更：割引率変更（0 → 10）
    expect(result.changeDetails[1]).toEqual({
      changeId: "CHG-002",
      fieldName: "discountRate",
      beforeValue: 0,
      afterValue: 10,
      changedAt: new Date("2024-03-10T14:45:00Z"),
      changedBy: "user002",
      sequenceNumber: 2,
    });

    // 5. 3番目の変更：契約終了日変更（2024-12-31 → 2025-06-30）
    expect(result.changeDetails[2]).toEqual({
      changeId: "CHG-003",
      fieldName: "contractEndDate",
      beforeValue: "2024-12-31",
      afterValue: "2025-06-30",
      changedAt: new Date("2024-04-05T09:15:00Z"),
      changedBy: "user001",
      sequenceNumber: 3,
    });

    // 6. 各変更時点の請求額差分が正確に計算されていることを確認
    expect(result.billingAmountDeltas).toHaveLength(3);
    expect(result.billingAmountDeltas[0]).toBe(0); // 初回請求額: 100000（変更なし）
    expect(result.billingAmountDeltas[1]).toBe(20000); // 金額変更による差分: +20000
    expect(result.billingAmountDeltas[2]).toBe(-12000); // 割引適用による差分: -12000（120000の10%割引）

    // 7. 時系列順序が正確であることを確認
    expect(result.changeDetails[0].changedAt.getTime()).toBeLessThan(
      result.changeDetails[1].changedAt.getTime()
    );
    expect(result.changeDetails[1].changedAt.getTime()).toBeLessThan(
      result.changeDetails[2].changedAt.getTime()
    );

    // 8. 最終的な請求額が正確に計算されていることを確認
    // 初期額: 100000 → 金額変更: 120000 → 割引10%適用: 108000
    expect(result.finalBillingAmount).toBe(108000);

    // 9. エクスポートデータの検証（CSV形式相当）
    expect(result.exportData).toBeDefined();
    expect(result.exportData.csvRows).toHaveLength(4); // ヘッダー + 3行のデータ
    expect(result.exportData.csvRows[0]).toBe(
      "changeId,fieldName,beforeValue,afterValue,changedAt,changedBy,sequenceNumber"
    );
    expect(result.exportData.csvRows[1]).toContain("CHG-001");
    expect(result.exportData.csvRows[1]).toContain("contractAmount");
    expect(result.exportData.csvRows[1]).toContain("100000");
    expect(result.exportData.csvRows[1]).toContain("120000");
    expect(result.exportData.csvRows[2]).toContain("CHG-002");
    expect(result.exportData.csvRows[2]).toContain("discountRate");
    expect(result.exportData.csvRows[3]).toContain("CHG-003");
    expect(result.exportData.csvRows[3]).toContain("contractEndDate");

    // 10. 複数の変更がすべて適切に集計されていることを確認
    expect(result.totalChangeCount).toBe(3);
    expect(result.affectedFieldNames).toEqual([
      "contractAmount",
      "discountRate",
      "contractEndDate",
    ]);

    // 11. 差分データが画面表示と完全に一致することを確認（フォーマット検証）
    expect(result.displayFormat).toEqual({
      showChangeTimestamp: true,
      showChangedByUser: true,
      sortOrder: "chronological",
      highlightChangedFields: true,
    });

    // 12. 請求額の最終差分（初期値から最終値までの総変化）
    const initialBillingAmount = 100000;
    const expectedTotalDelta = result.finalBillingAmount - initialBillingAmount;
    expect(expectedTotalDelta).toBe(8000); // 100000 → 108000（+8000）
  });
});