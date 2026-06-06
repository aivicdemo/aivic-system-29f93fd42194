import { validateProductSpecificationAndDelivery } from "../../src/logic/it-1";

const fetchMock = require("jest-fetch-mock");

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test("営業支援システムから製品仕様データを正常取得し完全性検証に成功する", () => {
    // SCEN-338
    const orderId = "ORD-2024-001";
    const productSpecification = {
      productId: "PROD-001",
      productName: "建設用鉄骨フレーム",
      specifications: "寸法:2000x1000x500mm, 材質:S355JR, 表面処理:亜鉛めっき",
      weight: "150kg",
      requiredProcesses: ["切断", "溶接", "検査"]
    };
    const requestedDeliveryDate = "2024-03-15";
    const currentProductionCapacity = 100;

    const result = validateProductSpecificationAndDelivery(
      orderId,
      productSpecification,
      requestedDeliveryDate,
      currentProductionCapacity
    );

    expect(result.specificationValid).toBe(true);
    expect(result.deliveryFeasible).toBe(true);
    expect(result.validatedSpecification).toEqual(productSpecification);
    expect(result.confirmedDeliveryDate).toBe("2024-03-15");
    expect(result.validationErrors).toEqual([]);
  });
});