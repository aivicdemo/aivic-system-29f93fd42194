import { describe, test, expect } from "@jest/globals";
import { validateContractChangeConsistency } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 契約変更前後の整合性検証", () => {
  test("SCEN-870: 複数サービスの請求額変更が同時に検証される場合、各サービスの整合性が個別に判定される", () => {
    // テストデータ: 複数サービスを含む契約データ
    const contractData = {
      contractId: "CTR-20240115-001",
      customerId: "CUST-A001",
      effectiveDate: "2024-01-01",
      services: [
        {
          serviceId: "SVC-A",
          serviceName: "サービスA",
          baseAmount: 100000,
          taxRate: 0.1,
          discountRate: 0.0,
          oldAmount: 100000,
          oldTaxAmount: 10000,
          oldDiscountAmount: 0,
          newAmount: 110000,
          newTaxAmount: 11000,
          newDiscountAmount: 0,
          changeRatePercent: 10
        },
        {
          serviceId: "SVC-B",
          serviceName: "サービスB",
          baseAmount: 200000,
          taxRate: 0.1,
          discountRate: 0.05,
          oldAmount: 190000,
          oldTaxAmount: 19000,
          oldDiscountAmount: 10000,
          newAmount: 180500,
          newTaxAmount: 18050,
          newDiscountAmount: 9500,
          changeRatePercent: -5
        },
        {
          serviceId: "SVC-C",
          serviceName: "サービスC",
          baseAmount: 150000,
          taxRate: 0.1,
          discountRate: 0.0,
          oldAmount: 150000,
          oldTaxAmount: 15000,
          oldDiscountAmount: 0,
          newAmount: 180000,
          newTaxAmount: 18000,
          newDiscountAmount: 0,
          changeRatePercent: 20
        }
      ]
    };

    // 複数サービスの請求額変更リクエストを同時に送信して整合性検証を実行
    const validationResults = validateContractChangeConsistency(contractData);

    // 各サービスの検証結果を確認
    expect(validationResults).toBeDefined();
    expect(validationResults).toHaveLength(3);

    // サービスA (+10%) の検証結果を確認
    const serviceAResult = validationResults.find(
      (r: any) => r.serviceId === "SVC-A"
    );
    expect(serviceAResult).toBeDefined();
    expect(serviceAResult.serviceId).toBe("SVC-A");
    expect(serviceAResult.isConsistent).toBe(true);
    expect(serviceAResult.changeRatePercent).toBe(10);
    expect(serviceAResult.oldTotalAmount).toBe(110000);
    expect(serviceAResult.newTotalAmount).toBe(121000);
    expect(serviceAResult.oldTaxAmount).toBe(10000);
    expect(serviceAResult.newTaxAmount).toBe(11000);
    expect(serviceAResult.oldDiscountAmount).toBe(0);
    expect(serviceAResult.newDiscountAmount).toBe(0);
    expect(serviceAResult.validationMessage).toBe("整合性あり");

    // サービスB (-5%) の検証結果を確認
    const serviceBResult = validationResults.find(
      (r: any) => r.serviceId === "SVC-B"
    );
    expect(serviceBResult).toBeDefined();
    expect(serviceBResult.serviceId).toBe("SVC-B");
    expect(serviceBResult.isConsistent).toBe(true);
    expect(serviceBResult.changeRatePercent).toBe(-5);
    expect(serviceBResult.oldTotalAmount).toBe(209000);
    expect(serviceBResult.newTotalAmount).toBe(198550);
    expect(serviceBResult.oldTaxAmount).toBe(19000);
    expect(serviceBResult.newTaxAmount).toBe(18050);
    expect(serviceBResult.oldDiscountAmount).toBe(10000);
    expect(serviceBResult.newDiscountAmount).toBe(9500);
    expect(serviceBResult.validationMessage).toBe("整合性あり");

    // サービスC (+20%) の検証結果を確認
    const serviceCResult = validationResults.find(
      (r: any) => r.serviceId === "SVC-C"
    );
    expect(serviceCResult).toBeDefined();
    expect(serviceCResult.serviceId).toBe("SVC-C");
    expect(serviceCResult.isConsistent).toBe(true);
    expect(serviceCResult.changeRatePercent).toBe(20);
    expect(serviceCResult.oldTotalAmount).toBe(165000);
    expect(serviceCResult.newTotalAmount).toBe(198000);
    expect(serviceCResult.oldTaxAmount).toBe(15000);
    expect(serviceCResult.newTaxAmount).toBe(18000);
    expect(serviceCResult.oldDiscountAmount).toBe(0);
    expect(serviceCResult.newDiscountAmount).toBe(0);
    expect(serviceCResult.validationMessage).toBe("整合性あり");

    // 各サービスの検証結果が独立して返却されることを確認
    expect(serviceAResult.isConsistent).not.toBe(serviceBResult.isConsistent);
    expect(serviceAResult.changeRatePercent).not.toBe(
      serviceBResult.changeRatePercent
    );
    expect(serviceBResult.changeRatePercent).not.toBe(
      serviceCResult.changeRatePercent
    );

    // 各サービスの検証は他のサービスの結果に左右されていないことを検証
    expect(serviceAResult.oldTotalAmount).toBe(110000);
    expect(serviceBResult.oldTotalAmount).toBe(209000);
    expect(serviceCResult.oldTotalAmount).toBe(165000);

    expect(serviceAResult.newTotalAmount).toBe(121000);
    expect(serviceBResult.newTotalAmount).toBe(198550);
    expect(serviceCResult.newTotalAmount).toBe(198000);

    // 各サービスの個別判定ロジックが正確に機能していることを確認
    const allServicesValid = validationResults.every(
      (r: any) => r.isConsistent === true
    );
    expect(allServicesValid).toBe(true);

    // 複数サービス処理時に順序が保証されることを確認
    expect(validationResults[0].serviceId).toBe("SVC-A");
    expect(validationResults[1].serviceId).toBe("SVC-B");
    expect(validationResults[2].serviceId).toBe("SVC-C");
  });
});