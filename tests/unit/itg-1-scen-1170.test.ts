import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証 - 金額項目の異常値検出", () => {
  // SCEN-1170
  test("負数・異常に大きい値・正常値の金額項目を検証し、異常フラグと詳細を返す", () => {
    // テストデータ: 負数の金額値
    const negativeAmountRecord = {
      id: "rec_001",
      customerId: "cust_A",
      serviceId: "svc_001",
      amount: -50000,
      appointmentCount: 5,
      contractCount: 2,
      recordDate: "2024-01-15",
    };

    // テストデータ: 異常に大きい金額値
    const largeAmountRecord = {
      id: "rec_002",
      customerId: "cust_B",
      serviceId: "svc_002",
      amount: 999999999999,
      appointmentCount: 10,
      contractCount: 3,
      recordDate: "2024-01-16",
    };

    // テストデータ: 正常な金額値
    const normalAmountRecord = {
      id: "rec_003",
      customerId: "cust_C",
      serviceId: "svc_003",
      amount: 100000,
      appointmentCount: 3,
      contractCount: 1,
      recordDate: "2024-01-17",
    };

    // 異常検出ロジック実行
    const result_negative = validateSalesDataQuality(negativeAmountRecord);
    const result_large = validateSalesDataQuality(largeAmountRecord);
    const result_normal = validateSalesDataQuality(normalAmountRecord);

    // 負数レコードの検証
    expect(result_negative.isValid).toBe(false);
    expect(result_negative.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: "amount",
          errorCode: "NEGATIVE_AMOUNT",
          message: "金額が負数です",
        }),
      ])
    );

    // 異常に大きい値レコードの検証
    expect(result_large.isValid).toBe(false);
    expect(result_large.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: "amount",
          errorCode: "AMOUNT_OUT_OF_RANGE",
          message: "金額が許容範囲を超えています",
        }),
      ])
    );

    // 正常なレコードの検証
    expect(result_normal.isValid).toBe(true);
    expect(result_normal.errors).toEqual([]);

    // 複数異常値を含むレコード（負数かつ正常な他フィールド）
    const multiAnomalyRecord = {
      id: "rec_004",
      customerId: "cust_D",
      serviceId: "svc_004",
      amount: -100000,
      appointmentCount: 5,
      contractCount: 2,
      recordDate: "2024-01-18",
    };

    const result_multiAnomaly = validateSalesDataQuality(multiAnomalyRecord);
    expect(result_multiAnomaly.isValid).toBe(false);
    expect(result_multiAnomaly.errors.length).toBeGreaterThan(0);
    expect(result_multiAnomaly.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: "amount",
          errorCode: "NEGATIVE_AMOUNT",
        }),
      ])
    );

    // 複数の異常値を含むレコード（許容範囲超過の大きな値）
    const extremeAnomalyRecord = {
      id: "rec_005",
      customerId: "cust_E",
      serviceId: "svc_005",
      amount: 9999999999999,
      appointmentCount: 100,
      contractCount: 50,
      recordDate: "2024-01-19",
    };

    const result_extremeAnomaly = validateSalesDataQuality(
      extremeAnomalyRecord
    );
    expect(result_extremeAnomaly.isValid).toBe(false);
    expect(result_extremeAnomaly.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: "amount",
          errorCode: "AMOUNT_OUT_OF_RANGE",
        }),
      ])
    );

    // 許容範囲内の最大値（100万円）
    const maxNormalRecord = {
      id: "rec_006",
      customerId: "cust_F",
      serviceId: "svc_006",
      amount: 1000000,
      appointmentCount: 20,
      contractCount: 5,
      recordDate: "2024-01-20",
    };

    const result_maxNormal = validateSalesDataQuality(maxNormalRecord);
    expect(result_maxNormal.isValid).toBe(true);
    expect(result_maxNormal.errors).toEqual([]);

    // 許容範囲内の最小値（0円）
    const zeroAmountRecord = {
      id: "rec_007",
      customerId: "cust_G",
      serviceId: "svc_007",
      amount: 0,
      appointmentCount: 0,
      contractCount: 0,
      recordDate: "2024-01-21",
    };

    const result_zero = validateSalesDataQuality(zeroAmountRecord);
    expect(result_zero.isValid).toBe(true);
    expect(result_zero.errors).toEqual([]);
  });
});