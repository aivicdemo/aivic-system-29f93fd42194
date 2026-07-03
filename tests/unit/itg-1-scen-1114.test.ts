import { validateMetadataFormula } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データメタデータ管理 - 計算式矛盾検証", () => {
  // SCEN-1114
  test("メタデータの計算式に矛盾がある場合にエラーが返される", () => {
    // 矛盾するメタデータ: 合計 = 単価 × 数量 + 割引、但し割引 > 合計となるケース
    const contradictoryMetadata = {
      items: [
        {
          item_id: "item_001",
          item_name: "成約件数",
          unit: "件",
          data_type: "integer",
          formula: "sum(contract_count)",
          formula_components: [
            {
              component_name: "contract_count",
              operator: "sum",
              value_range: { min: 0, max: 1000 },
            },
          ],
        },
        {
          item_id: "item_002",
          item_name: "請求額",
          unit: "円",
          data_type: "decimal",
          formula: "contract_count * unit_price + discount",
          formula_components: [
            {
              component_name: "contract_count",
              operator: "multiply",
              reference: "item_001",
            },
            {
              component_name: "unit_price",
              operator: "multiply",
              value_range: { min: 0, max: 100000 },
            },
            {
              component_name: "discount",
              operator: "add",
              value_range: { min: 0, max: 500000 },
              validation_rule: "discount must be less than total_amount",
            },
          ],
          expected_range: { min: 0, max: 100000 },
        },
      ],
      validation_rules: [
        {
          rule_id: "rule_001",
          condition: "discount > (contract_count * unit_price + discount)",
          conflict_reason: "割引が合計金額を超過する矛盾",
        },
      ],
    };

    expect(() => {
      validateMetadataFormula(contradictoryMetadata);
    }).toThrow(/計算式矛盾/);
  });

  test("メタデータ矛盾エラーに詳細なエラーメッセージが含まれる", () => {
    const contradictoryMetadata = {
      items: [
        {
          item_id: "item_001",
          item_name: "成約件数",
          unit: "件",
          data_type: "integer",
          formula: "sum(contract_count)",
          formula_components: [
            {
              component_name: "contract_count",
              operator: "sum",
              value_range: { min: 0, max: 1000 },
            },
          ],
        },
        {
          item_id: "item_002",
          item_name: "請求額",
          unit: "円",
          data_type: "decimal",
          formula: "contract_count * unit_price + discount",
          formula_components: [
            {
              component_name: "contract_count",
              operator: "multiply",
              reference: "item_001",
            },
            {
              component_name: "unit_price",
              operator: "multiply",
              value_range: { min: 0, max: 100000 },
            },
            {
              component_name: "discount",
              operator: "add",
              value_range: { min: 0, max: 500000 },
            },
          ],
          expected_range: { min: 0, max: 100000 },
        },
      ],
      validation_rules: [
        {
          rule_id: "rule_001",
          condition: "discount > (contract_count * unit_price + discount)",
          conflict_reason: "割引が合計金額を超過する矛盾",
        },
      ],
    };

    try {
      validateMetadataFormula(contradictoryMetadata);
      fail("エラーが発生すべき");
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toMatch(/割引/);
        expect(error.message).toMatch(/合計金額/);
        expect(error.message).toMatch(/item_002/);
      } else {
        fail("Error インスタンスの形式ではない");
      }
    }
  });

  test("メタデータ矛盾検証でエラーコードが返される", () => {
    const contradictoryMetadata = {
      items: [
        {
          item_id: "item_001",
          item_name: "成約件数",
          unit: "件",
          data_type: "integer",
          formula: "sum(contract_count)",
          formula_components: [
            {
              component_name: "contract_count",
              operator: "sum",
              value_range: { min: 0, max: 1000 },
            },
          ],
        },
        {
          item_id: "item_002",
          item_name: "請求額",
          unit: "円",
          data_type: "decimal",
          formula: "contract_count * unit_price + discount",
          formula_components: [
            {
              component_name: "contract_count",
              operator: "multiply",
              reference: "item_001",
            },
            {
              component_name: "unit_price",
              operator: "multiply",
              value_range: { min: 0, max: 100000 },
            },
            {
              component_name: "discount",
              operator: "add",
              value_range: { min: 0, max: 500000 },
            },
          ],
          expected_range: { min: 0, max: 100000 },
        },
      ],
      validation_rules: [
        {
          rule_id: "rule_001",
          condition: "discount > (contract_count * unit_price + discount)",
          conflict_reason: "割引が合計金額を超過する矛盾",
        },
      ],
    };

    try {
      validateMetadataFormula(contradictoryMetadata);
      fail("エラーが発生すべき");
    } catch (error: unknown) {
      if (error instanceof Error && "code" in error) {
        const errorWithCode = error as Error & { code: string };
        expect(errorWithCode.code).toBe("META_FORMULA_CONFLICT");
      } else {
        fail("エラーコードが含まれていない");
      }
    }
  });

  test("正常なメタデータは検証を通過する", () => {
    const validMetadata = {
      items: [
        {
          item_id: "item_001",
          item_name: "成約件数",
          unit: "件",
          data_type: "integer",
          formula: "sum(contract_count)",
          formula_components: [
            {
              component_name: "contract_count",
              operator: "sum",
              value_range: { min: 0, max: 1000 },
            },
          ],
        },
        {
          item_id: "item_002",
          item_name: "請求額",
          unit: "円",
          data_type: "decimal",
          formula: "contract_count * unit_price - discount",
          formula_components: [
            {
              component_name: "contract_count",
              operator: "multiply",
              reference: "item_001",
            },
            {
              component_name: "unit_price",
              operator: "multiply",
              value_range: { min: 0, max: 100000 },
            },
            {
              component_name: "discount",
              operator: "subtract",
              value_range: { min: 0, max: 50000 },
            },
          ],
          expected_range: { min: 0, max: 100000 },
        },
      ],
      validation_rules: [
        {
          rule_id: "rule_001",
          condition: "discount <= (contract_count * unit_price)",
          conflict_reason: "no conflict",
        },
      ],
    };

    const result = validateMetadataFormula(validMetadata);
    expect(result).toEqual({
      is_valid: true,
      error_count: 0,
      conflicts: [],
    });
  });
});