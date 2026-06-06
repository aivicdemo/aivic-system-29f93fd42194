import { calculateProcessSequenceAndTime } from "../../src/logic/it-1";

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("工程数1つの製品で工程順序と所要時間が正しく算出される", () => {
    // SCEN-349
    const productSpecification = {
      dimensions: "100x50x30mm",
      material: "アルミニウム",
      processes: ["machining"]
    };
    const deliveryDate = new Date("2024-03-15T10:00:00Z");
    const processMaster = [
      {
        processId: "machining",
        processName: "機械加工",
        standardTime: 240,
        prerequisites: []
      }
    ];

    const result = calculateProcessSequenceAndTime(productSpecification, deliveryDate, processMaster);

    expect(result.processSequence).toHaveLength(1);
    expect(result.processSequence[0]).toEqual({
      processId: "machining",
      processName: "機械加工",
      standardTime: 240,
      prerequisites: []
    });
    expect(result.totalWorkTime).toBe(240);
    expect(result.processDetails).toHaveLength(1);
    expect(result.processDetails[0]).toEqual({
      processId: "machining",
      processName: "機械加工",
      workTime: 240,
      startTime: expect.any(Date)
    });
  });
});