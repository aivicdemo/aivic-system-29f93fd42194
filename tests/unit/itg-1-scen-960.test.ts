import { describe, test, expect } from "@jest/globals";
import { validateCalculationResultAgainstStandards } from "../../src/logic/it-1-2-1";

describe("計算結果の手順書照合・検証", () => {
  test("SCEN-960: 計算結果が1つ以上の基準を満たさない場合、不承認と判定して理由を詳細に返す", () => {
    // 基準を定義
    const standardA = {
      id: "standard_a",
      name: "基準A",
      expectedMin: 1000,
      expectedMax: 5000,
    };
    const standardB = {
      id: "standard_b",
      name: "基準B",
      expectedMin: 100,
      expectedMax: 500,
    };
    const standardC = {
      id: "standard_c",
      name: "基準C",
      expectedMin: 50,
      expectedMax: 200,
    };
    const standards = [standardA, standardB, standardC];

    // ケース1: 基準Aのみを満たさないデータ
    const resultFailA = {
      customerId: "cust_001",
      serviceId: "srv_001",
      amount: 800,
      unit_b_value: 150,
      unit_c_value: 75,
    };

    const responseFailA = validateCalculationResultAgainstStandards(
      resultFailA,
      standards
    );

    expect(responseFailA.status).toBe("不承認");
    expect(responseFailA.reasons).toHaveLength(1);
    expect(responseFailA.reasons[0]).toMatchObject({
      standardId: "standard_a",
      standardName: "基準A",
      expectedMin: 1000,
      expectedMax: 5000,
      actualValue: 800,
    });
    expect(responseFailA.reasons[0].detail).toMatch(/基準A/);
    expect(responseFailA.reasons[0].detail).toMatch(/1000/);
    expect(responseFailA.reasons[0].detail).toMatch(/5000/);
    expect(responseFailA.reasons[0].detail).toMatch(/800/);

    // ケース2: 基準BとCを満たさないデータ
    const resultFailBC = {
      customerId: "cust_001",
      serviceId: "srv_001",
      amount: 1500,
      unit_b_value: 600,
      unit_c_value: 250,
    };

    const responseFailBC = validateCalculationResultAgainstStandards(
      resultFailBC,
      standards
    );

    expect(responseFailBC.status).toBe("不承認");
    expect(responseFailBC.reasons).toHaveLength(2);

    const reasonB = responseFailBC.reasons.find(
      (r) => r.standardId === "standard_b"
    );
    expect(reasonB).toBeDefined();
    expect(reasonB!.standardName).toBe("基準B");
    expect(reasonB!.expectedMin).toBe(100);
    expect(reasonB!.expectedMax).toBe(500);
    expect(reasonB!.actualValue).toBe(600);
    expect(reasonB!.detail).toMatch(/基準B/);
    expect(reasonB!.detail).toMatch(/100/);
    expect(reasonB!.detail).toMatch(/500/);
    expect(reasonB!.detail).toMatch(/600/);

    const reasonC = responseFailBC.reasons.find(
      (r) => r.standardId === "standard_c"
    );
    expect(reasonC).toBeDefined();
    expect(reasonC!.standardName).toBe("基準C");
    expect(reasonC!.expectedMin).toBe(50);
    expect(reasonC!.expectedMax).toBe(200);
    expect(reasonC!.actualValue).toBe(250);
    expect(reasonC!.detail).toMatch(/基準C/);
    expect(reasonC!.detail).toMatch(/50/);
    expect(reasonC!.detail).toMatch(/200/);
    expect(reasonC!.detail).toMatch(/250/);

    // エラーメッセージのフォーマット検証
    expect(responseFailBC.message).toBeDefined();
    expect(responseFailBC.message).toMatch(/不承認/);
    expect(responseFailBC.message).toMatch(/基準B/);
    expect(responseFailBC.message).toMatch(/基準C/);
    expect(responseFailBC.timestamp).toBeDefined();
    expect(typeof responseFailBC.timestamp).toBe("string");
  });
});