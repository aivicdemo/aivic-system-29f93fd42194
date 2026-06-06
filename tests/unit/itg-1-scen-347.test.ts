import { calculateProcessSequenceAndTime } from "../../src/logic/it-1";

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("工程順序・所要時間算出機能 - 製品仕様に基づいて最適な工程順序と総所要時間が正しく算出される", () => {
    // SCEN-347
    const productSpecification = {
      productId: "PROD-001",
      dimensions: "100x50x20",
      material: "steel",
      processingRequirements: ["cutting", "drilling", "assembly"]
    };
    
    const deliveryDate = new Date("2024-02-15T10:00:00Z");
    
    const processMaster = [
      {
        processId: "cutting",
        processName: "切断",
        standardTime: 30,
        prerequisites: [],
        equipmentRequired: "cutting_machine"
      },
      {
        processId: "drilling",
        processName: "穴あけ",
        standardTime: 20,
        prerequisites: ["cutting"],
        equipmentRequired: "drill"
      },
      {
        processId: "assembly",
        processName: "組立",
        standardTime: 45,
        prerequisites: ["drilling"],
        equipmentRequired: "assembly_station"
      }
    ];

    const result = calculateProcessSequenceAndTime(
      productSpecification,
      deliveryDate,
      processMaster
    );

    expect(result.processSequence).toEqual([
      {
        processId: "cutting",
        processName: "切断",
        workTime: 30,
        order: 1
      },
      {
        processId: "drilling", 
        processName: "穴あけ",
        workTime: 20,
        order: 2
      },
      {
        processId: "assembly",
        processName: "組立", 
        workTime: 45,
        order: 3
      }
    ]);

    expect(result.totalWorkTime).toBe(95);

    expect(result.processDetails).toEqual([
      {
        processName: "切断",
        workTime: 30,
        startTime: new Date("2024-02-14T08:00:00Z")
      },
      {
        processName: "穴あけ",
        workTime: 20,
        startTime: new Date("2024-02-14T08:30:00Z")
      },
      {
        processName: "組立",
        workTime: 45,
        startTime: new Date("2024-02-14T08:50:00Z")
      }
    ]);
  });
});