import { validateDeliveryFeasibility } from "../../src/logic/it-1";

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("納期実現可能性判定機能 - 製造能力が必要量ちょうどの場合に納期実現可能性が正しく判定される", () => {
    // SCEN-343
    const requestedDeliveryDate = new Date("2024-01-16");
    const productSpecification = {
      productId: "PROD001",
      specifications: "標準仕様製品",
      requiredProcesses: ["工程1", "工程2", "工程3"]
    };
    const currentProductionSchedule = [
      {
        date: "2024-01-15",
        allocatedCapacity: 0,
        availableCapacity: 100
      }
    ];
    const equipmentCapacity = [
      {
        equipmentId: "EQ001",
        dailyCapacity: 100,
        current_utilization: 0.0,
        status: "available"
      }
    ];
    const requiredProductionDays = 1;

    const result = validateDeliveryFeasibility(
      requestedDeliveryDate,
      productSpecification,
      currentProductionSchedule,
      equipmentCapacity,
      requiredProductionDays
    );

    expect(result.feasible).toBe(true);
    expect(result.earliestStartDate).toEqual(new Date("2024-01-15"));
    expect(result.alternativeDeliveryDate).toEqual(requestedDeliveryDate);
    expect(result.utilizationRate).toBe(0.0);
    expect(result.conflictingOrders).toEqual([]);
  });
});