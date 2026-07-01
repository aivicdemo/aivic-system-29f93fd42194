import { extractAndAggregateChargeableItems } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 請求対象項目自動抽出・集計", () => {
  // SCEN-1060
  test("[normal] 複数サービスの営業データが混在する場合、サービス別に正確に請求額が分離される", () => {
    // テストデータ準備: 複数サービス（A, B, C）の営業データを構築
    const salesDataForServiceA = {
      serviceId: "SERVICE_A",
      serviceName: "サービスA",
      quantity: 5,
      unitPrice: 10000,
      applicationDate: "2024-01-15",
    };

    const salesDataForServiceB = {
      serviceId: "SERVICE_B",
      serviceName: "サービスB",
      quantity: 3,
      unitPrice: 25000,
      applicationDate: "2024-01-15",
    };

    const salesDataForServiceC = {
      serviceId: "SERVICE_C",
      serviceName: "サービスC",
      quantity: 8,
      unitPrice: 15000,
      applicationDate: "2024-01-15",
    };

    const mixedSalesData = [
      salesDataForServiceA,
      salesDataForServiceB,
      salesDataForServiceC,
    ];

    // 請求対象項目自動抽出・集計機能を実行
    const result = extractAndAggregateChargeableItems(mixedSalesData);

    // 抽出されたデータがサービス別に分類されていることを確認
    expect(result.aggregatedByService).toBeDefined();
    expect(Object.keys(result.aggregatedByService)).toHaveLength(3);
    expect(result.aggregatedByService).toHaveProperty("SERVICE_A");
    expect(result.aggregatedByService).toHaveProperty("SERVICE_B");
    expect(result.aggregatedByService).toHaveProperty("SERVICE_C");

    // サービスAの請求額が正確に計算されていることを検証（単価×数量）
    const chargeForServiceA = result.aggregatedByService["SERVICE_A"];
    expect(chargeForServiceA.quantity).toBe(5);
    expect(chargeForServiceA.unitPrice).toBe(10000);
    expect(chargeForServiceA.totalCharge).toBe(50000); // 5 * 10000

    // サービスBの請求額が正確に計算されていることを検証（単価×数量）
    const chargeForServiceB = result.aggregatedByService["SERVICE_B"];
    expect(chargeForServiceB.quantity).toBe(3);
    expect(chargeForServiceB.unitPrice).toBe(25000);
    expect(chargeForServiceB.totalCharge).toBe(75000); // 3 * 25000

    // サービスCの請求額が正確に計算されていることを検証（単価×数量）
    const chargeForServiceC = result.aggregatedByService["SERVICE_C"];
    expect(chargeForServiceC.quantity).toBe(8);
    expect(chargeForServiceC.unitPrice).toBe(15000);
    expect(chargeForServiceC.totalCharge).toBe(120000); // 8 * 15000

    // 各サービス間でデータの混在がないことを確認
    expect(chargeForServiceA.serviceId).toBe("SERVICE_A");
    expect(chargeForServiceB.serviceId).toBe("SERVICE_B");
    expect(chargeForServiceC.serviceId).toBe("SERVICE_C");

    // 請求額の合計がすべてのサービスを合算した値と一致することを確認
    const expectedTotalCharge = 50000 + 75000 + 120000; // 245000
    expect(result.totalChargeAcrossAllServices).toBe(245000);
    expect(result.totalChargeAcrossAllServices).toBe(expectedTotalCharge);

    // 各サービスの請求額が個別に正確に抽出・集計されていることを確認
    const serviceATotal = result.aggregatedByService["SERVICE_A"].totalCharge;
    const serviceBTotal = result.aggregatedByService["SERVICE_B"].totalCharge;
    const serviceCTotal = result.aggregatedByService["SERVICE_C"].totalCharge;

    expect(serviceATotal + serviceBTotal + serviceCTotal).toBe(
      result.totalChargeAcrossAllServices
    );
  });
});