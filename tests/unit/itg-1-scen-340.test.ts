import { validateProductSpecificationAndDelivery } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("SCEN-340: [edge] 製品仕様・納期確認機能 - 納期が最短製造期間ちょうどの場合に実現可能と判定される", () => {
    // 手順: 生産管理システムにログインする → 製品仕様・納期確認機能にアクセスする → 確認対象の製品を選択する → 製品の最短製造期間を確認する → 納期として最短製造期間とちょうど同じ日数を入力する → 実現可能性の判定処理を実行する

    // 最短製造期間が7日の製品を設定
    const orderId = "ORDER-20240115-001";
    const productSpecification = {
      productId: "PROD-001",
      dimensions: "100x50x20mm",
      material: "ステンレス鋼",
      processingRequirements: ["切削加工", "表面処理"],
      minimumProductionDays: 7
    };
    
    // 最短製造期間とちょうど同じ7日後の納期を設定
    const requestedDeliveryDate = "2024-01-22";
    const currentProductionCapacity = 100;

    const result = validateProductSpecificationAndDelivery(
      orderId,
      productSpecification,
      requestedDeliveryDate,
      currentProductionCapacity
    );

    // 期待結果: 納期判定結果が「実現可能」と表示され、最短製造期間ちょうどの納期でも製造可能であることが確認できる
    expect(result.specificationValid).toBe(true);
    expect(result.deliveryFeasible).toBe(true);
    expect(result.validatedSpecification).toEqual(productSpecification);
    expect(result.confirmedDeliveryDate).toBe(requestedDeliveryDate);
    expect(result.validationErrors).toEqual([]);
  });
});