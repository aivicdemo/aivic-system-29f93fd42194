import { validateProductSpecificationAndDelivery } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("SCEN-339: 製品仕様データが不完全な場合に検証エラーが発生する", () => {
    // 必須項目の一部（製品名、仕様詳細、納期のうち1つ以上）を空白のまま残す
    const incompleteSpecification = {
      productName: "", // 必須項目を空白
      specificationDetails: "材質：アルミ合金、サイズ：100x50mm",
      deliveryDate: "", // 必須項目を空白
      optionalField1: "適当なデータ1",
      optionalField2: "適当なデータ2"
    };

    expect(() => validateProductSpecificationAndDelivery(
      "ORDER-001",
      incompleteSpecification,
      "", // 空の納期
      50
    )).toThrow(/製品仕様/);
  });
});