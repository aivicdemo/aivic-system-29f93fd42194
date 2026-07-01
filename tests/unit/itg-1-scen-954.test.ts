import { describe, test, expect } from "@jest/globals";
import { getContractDiscountDetails } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  // SCEN-954: [normal] 契約別割引基準確認・統一機能 - 契約ごとに適用される割引種別・割引率・適用条件が明確に識別される
  test("複数契約の割引情報が契約ごとに正確に識別・管理される", () => {
    // 準備: テスト用の複数の契約データ
    const contractA = {
      contract_id: "CONTRACT_A_001",
      contract_name: "顧客A 基本契約",
      discount_rules: [
        {
          discount_type: "数量割引",
          discount_rate: 5,
          apply_condition: "月間購買額100万円以上",
          discount_id: "D_A_001",
        },
        {
          discount_type: "早期割引",
          discount_rate: 10,
          apply_condition: "納期30日以上前の発注",
          discount_id: "D_A_002",
        },
        {
          discount_type: "顧客ランク割引",
          discount_rate: 15,
          apply_condition: "プレミアム顧客ランク以上",
          discount_id: "D_A_003",
        },
      ],
    };

    const contractB = {
      contract_id: "CONTRACT_B_001",
      contract_name: "顧客B 基本契約",
      discount_rules: [
        {
          discount_type: "数量割引",
          discount_rate: 3,
          apply_condition: "月間購買額50万円以上",
          discount_id: "D_B_001",
        },
        {
          discount_type: "季節割引",
          discount_rate: 8,
          apply_condition: "オフシーズン期間中の発注",
          discount_id: "D_B_002",
        },
      ],
    };

    const contractC = {
      contract_id: "CONTRACT_C_001",
      contract_name: "顧客C 基本契約",
      discount_rules: [
        {
          discount_type: "固定割引",
          discount_rate: 12,
          apply_condition: "全発注対象（無条件）",
          discount_id: "D_C_001",
        },
      ],
    };

    // テスト対象: 各契約の割引情報詳細を取得
    const resultA = getContractDiscountDetails({
      contract_id: "CONTRACT_A_001",
      contracts: [contractA, contractB, contractC],
    });

    const resultB = getContractDiscountDetails({
      contract_id: "CONTRACT_B_001",
      contracts: [contractA, contractB, contractC],
    });

    const resultC = getContractDiscountDetails({
      contract_id: "CONTRACT_C_001",
      contracts: [contractA, contractB, contractC],
    });

    // 検証: 契約Aの割引情報が正確に取得される
    expect(resultA).toEqual({
      contract_id: "CONTRACT_A_001",
      contract_name: "顧客A 基本契約",
      discount_count: 3,
      discount_details: [
        {
          discount_id: "D_A_001",
          discount_type: "数量割引",
          discount_rate: 5,
          apply_condition: "月間購買額100万円以上",
        },
        {
          discount_id: "D_A_002",
          discount_type: "早期割引",
          discount_rate: 10,
          apply_condition: "納期30日以上前の発注",
        },
        {
          discount_id: "D_A_003",
          discount_type: "顧客ランク割引",
          discount_rate: 15,
          apply_condition: "プレミアム顧客ランク以上",
        },
      ],
    });

    // 検証: 契約Bの割引情報が正確に取得される
    expect(resultB).toEqual({
      contract_id: "CONTRACT_B_001",
      contract_name: "顧客B 基本契約",
      discount_count: 2,
      discount_details: [
        {
          discount_id: "D_B_001",
          discount_type: "数量割引",
          discount_rate: 3,
          apply_condition: "月間購買額50万円以上",
        },
        {
          discount_id: "D_B_002",
          discount_type: "季節割引",
          discount_rate: 8,
          apply_condition: "オフシーズン期間中の発注",
        },
      ],
    });

    // 検証: 契約Cの割引情報が正確に取得される
    expect(resultC).toEqual({
      contract_id: "CONTRACT_C_001",
      contract_name: "顧客C 基本契約",
      discount_count: 1,
      discount_details: [
        {
          discount_id: "D_C_001",
          discount_type: "固定割引",
          discount_rate: 12,
          apply_condition: "全発注対象（無条件）",
        },
      ],
    });

    // 検証: 各契約の割引内容が区別されていることを確認
    expect(resultA.discount_count).toBe(3);
    expect(resultB.discount_count).toBe(2);
    expect(resultC.discount_count).toBe(1);

    // 検証: 契約A と契約B の割引率が異なることを確認
    expect(resultA.discount_details[0].discount_rate).toBe(5);
    expect(resultB.discount_details[0].discount_rate).toBe(3);

    // 検証: 契約ごとの割引種別が正確に区別されていることを確認
    const typeNamesA = resultA.discount_details.map((d) => d.discount_type);
    const typeNamesB = resultB.discount_details.map((d) => d.discount_type);
    expect(typeNamesA).toContain("数量割引");
    expect(typeNamesA).toContain("早期割引");
    expect(typeNamesA).toContain("顧客ランク割引");
    expect(typeNamesB).toContain("数量割引");
    expect(typeNamesB).toContain("季節割引");
    expect(typeNamesB).not.toContain("早期割引");

    // 検証: 割引情報が契約ごとに独立して管理されていることを確認
    expect(resultA.contract_id).not.toBe(resultB.contract_id);
    expect(resultB.contract_id).not.toBe(resultC.contract_id);
    expect(resultA.discount_details).not.toEqual(resultB.discount_details);
  });

  test("存在しない契約IDで割引情報取得時にエラーが返される", () => {
    const contracts = [
      {
        contract_id: "CONTRACT_A_001",
        contract_name: "顧客A 基本契約",
        discount_rules: [
          {
            discount_type: "数量割引",
            discount_rate: 5,
            apply_condition: "月間購買額100万円以上",
            discount_id: "D_A_001",
          },
        ],
      },
    ];

    expect(() =>
      getContractDiscountDetails({
        contract_id: "CONTRACT_NOT_EXIST",
        contracts: contracts,
      })
    ).toThrow(/契約/);
  });

  test("割引ルールが空の契約でも正常に処理される", () => {
    const contractEmpty = {
      contract_id: "CONTRACT_EMPTY_001",
      contract_name: "割引なし契約",
      discount_rules: [],
    };

    const result = getContractDiscountDetails({
      contract_id: "CONTRACT_EMPTY_001",
      contracts: [contractEmpty],
    });

    expect(result).toEqual({
      contract_id: "CONTRACT_EMPTY_001",
      contract_name: "割引なし契約",
      discount_count: 0,
      discount_details: [],
    });
  });
});