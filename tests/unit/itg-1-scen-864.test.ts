import { extractContractAndBillingHistory } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-864: [normal] 契約履歴と請求データの時系列抽出機能 - 指定顧客・契約・期間に基づき過去の契約条件と請求パターンが時系列で正確に抽出される
  test("指定された顧客ID、契約ID、期間に該当するすべての契約履歴と請求データが時系列で正確に抽出される", () => {
    // 入力: 顧客ID、契約ID、抽出期間開始日、抽出期間終了日
    const customerId = "CUST-001";
    const contractId = "CONTRACT-001";
    const periodStartDate = new Date("2023-01-01T00:00:00Z");
    const periodEndDate = new Date("2024-12-31T23:59:59Z");

    // 期待される契約履歴データ
    // 過去の契約条件: 契約金額300,000円、契約期間2023年1月1日〜2023年6月30日、割引率0%
    // その後変更: 契約金額350,000円、契約期間2023年7月1日〜2024年6月30日、割引率5%
    // さらに変更: 契約金額400,000円、契約期間2024年7月1日〜2024年12月31日、割引率10%
    
    const result = extractContractAndBillingHistory({
      customerId: customerId,
      contractId: contractId,
      periodStartDate: periodStartDate,
      periodEndDate: periodEndDate,
    });

    // 期待される抽出結果の検証
    expect(result).toBeDefined();
    expect(result.customerId).toBe("CUST-001");
    expect(result.contractId).toBe("CONTRACT-001");
    expect(result.extractedRecordsCount).toBe(9); // 9件の履歴・請求レコード
    expect(result.hasDuplicates).toBe(false); // 重複なし
    expect(result.allRecordsInPeriod).toBe(true); // すべてのレコードが指定期間内

    // 時系列順序の検証（古い順）
    expect(result.records).toHaveLength(9);
    
    // 第1契約期間（2023/1/1〜2023/6/30）の履歴と請求
    expect(result.records[0]).toEqual({
      recordId: "HIST-001",
      recordType: "contract_history", // 契約履歴
      contractAmount: 300000,
      contractStartDate: new Date("2023-01-01T00:00:00Z"),
      contractEndDate: new Date("2023-06-30T23:59:59Z"),
      discountRate: 0,
      changeDate: new Date("2023-01-01T00:00:00Z"),
      changeReason: "契約開始",
    });
    expect(result.records[1]).toEqual({
      recordId: "BILL-001",
      recordType: "billing", // 請求データ
      billingDate: new Date("2023-01-15T00:00:00Z"),
      billingAmount: 300000,
      billingPeriodStart: new Date("2023-01-01T00:00:00Z"),
      billingPeriodEnd: new Date("2023-01-31T23:59:59Z"),
      paymentStatus: "完了",
      paymentDate: new Date("2023-01-25T00:00:00Z"),
    });
    expect(result.records[2]).toEqual({
      recordId: "BILL-002",
      recordType: "billing",
      billingDate: new Date("2023-02-15T00:00:00Z"),
      billingAmount: 300000,
      billingPeriodStart: new Date("2023-02-01T00:00:00Z"),
      billingPeriodEnd: new Date("2023-02-28T23:59:59Z"),
      paymentStatus: "完了",
      paymentDate: new Date("2023-02-25T00:00:00Z"),
    });
    
    // 第1契約期間最後の月と変更前のデータ
    expect(result.records[3]).toEqual({
      recordId: "BILL-003",
      recordType: "billing",
      billingDate: new Date("2023-06-15T00:00:00Z"),
      billingAmount: 300000,
      billingPeriodStart: new Date("2023-06-01T00:00:00Z"),
      billingPeriodEnd: new Date("2023-06-30T23:59:59Z"),
      paymentStatus: "完了",
      paymentDate: new Date("2023-06-25T00:00:00Z"),
    });

    // 契約変更: 契約金額350,000円、割引率5%（2023/7/1〜2024/6/30）
    expect(result.records[4]).toEqual({
      recordId: "HIST-002",
      recordType: "contract_history",
      contractAmount: 350000,
      contractStartDate: new Date("2023-07-01T00:00:00Z"),
      contractEndDate: new Date("2024-06-30T23:59:59Z"),
      discountRate: 5,
      changeDate: new Date("2023-07-01T00:00:00Z"),
      changeReason: "契約更新・金額変更",
    });
    expect(result.records[5]).toEqual({
      recordId: "BILL-004",
      recordType: "billing",
      billingDate: new Date("2023-07-15T00:00:00Z"),
      billingAmount: 332500, // 350000 * (1 - 0.05) = 332500
      billingPeriodStart: new Date("2023-07-01T00:00:00Z"),
      billingPeriodEnd: new Date("2023-07-31T23:59:59Z"),
      paymentStatus: "完了",
      paymentDate: new Date("2023-07-25T00:00:00Z"),
    });
    
    // 第2契約期間の別月請求データ
    expect(result.records[6]).toEqual({
      recordId: "BILL-005",
      recordType: "billing",
      billingDate: new Date("2024-06-15T00:00:00Z"),
      billingAmount: 332500, // 350000 * (1 - 0.05) = 332500
      billingPeriodStart: new Date("2024-06-01T00:00:00Z"),
      billingPeriodEnd: new Date("2024-06-30T23:59:59Z"),
      paymentStatus: "完了",
      paymentDate: new Date("2024-06-25T00:00:00Z"),
    });

    // 契約変更: 契約金額400,000円、割引率10%（2024/7/1〜2024/12/31）
    expect(result.records[7]).toEqual({
      recordId: "HIST-003",
      recordType: "contract_history",
      contractAmount: 400000,
      contractStartDate: new Date("2024-07-01T00:00:00Z"),
      contractEndDate: new Date("2024-12-31T23:59:59Z"),
      discountRate: 10,
      changeDate: new Date("2024-07-01T00:00:00Z"),
      changeReason: "契約更新・金額変更",
    });
    expect(result.records[8]).toEqual({
      recordId: "BILL-006",
      recordType: "billing",
      billingDate: new Date("2024-07-15T00:00:00Z"),
      billingAmount: 360000, // 400000 * (1 - 0.10) = 360000
      billingPeriodStart: new Date("2024-07-01T00:00:00Z"),
      billingPeriodEnd: new Date("2024-07-31T23:59:59Z"),
      paymentStatus: "完了",
      paymentDate: new Date("2024-07-25T00:00:00Z"),
    });

    // 時系列の順序検証（日付が昇順）
    for (let i = 1; i < result.records.length; i++) {
      const prevDate = result.records[i - 1].changeDate || result.records[i - 1].billingDate;
      const currDate = result.records[i].changeDate || result.records[i].billingDate;
      expect(prevDate.getTime()).toBeLessThanOrEqual(currDate.getTime());
    }

    // 期間外のデータが含まれていないことを確認
    for (const record of result.records) {
      const recordDate = record.changeDate || record.billingDate;
      expect(recordDate.getTime()).toBeGreaterThanOrEqual(periodStartDate.getTime());
      expect(recordDate.getTime()).toBeLessThanOrEqual(periodEndDate.getTime());
    }

    // 抽出結果のデータ品質検証
    expect(result.dataQualityCheck).toEqual({
      missingFieldsCount: 0,
      inconsistenciesDetected: 0,
      outOfPeriodRecordsCount: 0,
      duplicateRecordsCount: 0,
    });

    // CSV形式ダウンロード用データの検証
    expect(result.csvData).toBeDefined();
    expect(result.csvData).toContain("recordId,recordType,contractAmount,billingAmount");
    expect(result.csvData).toContain("HIST-001");
    expect(result.csvData).toContain("BILL-001");
    expect(result.csvData).toContain("HIST-002");
  });
});