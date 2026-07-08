import { describe, test, expect } from "@jest/globals";
import {
  defineToleranceDeviationByAmountBand,
} from "../../src/logic/it-6-2-1-1";

describe("金額帯別の許容乖離幅定義", () => {
  test("SCEN-893: 見積項目と金額帯の組み合わせに対して下限・上限が正確に定義される", () => {
    // Arrange: 複数の見積項目と金額帯の組み合わせを定義
    const input = {
      definitions: [
        {
          estimate_item_id: "E001",
          estimate_item_name: "部品代",
          amount_band_id: "B001",
          amount_band_name: "0-10万円",
          lower_limit: -5,
          upper_limit: 10,
        },
        {
          estimate_item_id: "E001",
          estimate_item_name: "部品代",
          amount_band_id: "B002",
          amount_band_name: "10-50万円",
          lower_limit: -8,
          upper_limit: 12,
        },
        {
          estimate_item_id: "E001",
          estimate_item_name: "部品代",
          amount_band_id: "B003",
          amount_band_name: "50万円以上",
          lower_limit: -10,
          upper_limit: 15,
        },
        {
          estimate_item_id: "E002",
          estimate_item_name: "工賃",
          amount_band_id: "B001",
          amount_band_name: "0-10万円",
          lower_limit: -3,
          upper_limit: 8,
        },
        {
          estimate_item_id: "E002",
          estimate_item_name: "工賃",
          amount_band_id: "B002",
          amount_band_name: "10-50万円",
          lower_limit: -5,
          upper_limit: 10,
        },
        {
          estimate_item_id: "E003",
          estimate_item_name: "塗装費",
          amount_band_id: "B001",
          amount_band_name: "0-10万円",
          lower_limit: -7,
          upper_limit: 14,
        },
      ],
    };

    // Act: 許容乖離幅定義を実行
    const result = defineToleranceDeviationByAmountBand(input);

    // Assert: 定義が正確に保存されたことを確認
    expect(result).toEqual({
      status: "success",
      saved_count: 6,
      definitions: [
        {
          estimate_item_id: "E001",
          estimate_item_name: "部品代",
          amount_band_id: "B001",
          amount_band_name: "0-10万円",
          lower_limit: -5,
          upper_limit: 10,
          is_valid: true,
        },
        {
          estimate_item_id: "E001",
          estimate_item_name: "部品代",
          amount_band_id: "B002",
          amount_band_name: "10-50万円",
          lower_limit: -8,
          upper_limit: 12,
          is_valid: true,
        },
        {
          estimate_item_id: "E001",
          estimate_item_name: "部品代",
          amount_band_id: "B003",
          amount_band_name: "50万円以上",
          lower_limit: -10,
          upper_limit: 15,
          is_valid: true,
        },
        {
          estimate_item_id: "E002",
          estimate_item_name: "工賃",
          amount_band_id: "B001",
          amount_band_name: "0-10万円",
          lower_limit: -3,
          upper_limit: 8,
          is_valid: true,
        },
        {
          estimate_item_id: "E002",
          estimate_item_name: "工賃",
          amount_band_id: "B002",
          amount_band_name: "10-50万円",
          lower_limit: -5,
          upper_limit: 10,
          is_valid: true,
        },
        {
          estimate_item_id: "E003",
          estimate_item_name: "塗装費",
          amount_band_id: "B001",
          amount_band_name: "0-10万円",
          lower_limit: -7,
          upper_limit: 14,
          is_valid: true,
        },
      ],
    });

    // Assert: すべての定義に対して下限値が上限値より小さいことを確認
    result.definitions.forEach((definition: any) => {
      expect(definition.lower_limit).toBeLessThan(definition.upper_limit);
      expect(definition.is_valid).toBe(true);
    });

    // Assert: 各見積項目と金額帯の組み合わせが一意であることを確認
    const combinations = result.definitions.map(
      (d: any) => `${d.estimate_item_id}-${d.amount_band_id}`
    );
    const unique_combinations = new Set(combinations);
    expect(unique_combinations.size).toBe(6);

    // Assert: 部品代の3つの金額帯すべてが定義されていることを確認
    const item_e001 = result.definitions.filter(
      (d: any) => d.estimate_item_id === "E001"
    );
    expect(item_e001).toHaveLength(3);
    expect(item_e001.map((d: any) => d.amount_band_id).sort()).toEqual([
      "B001",
      "B002",
      "B003",
    ]);

    // Assert: 工賃の2つの金額帯が定義されていることを確認
    const item_e002 = result.definitions.filter(
      (d: any) => d.estimate_item_id === "E002"
    );
    expect(item_e002).toHaveLength(2);

    // Assert: 塗装費の1つの金額帯が定義されていることを確認
    const item_e003 = result.definitions.filter(
      (d: any) => d.estimate_item_id === "E003"
    );
    expect(item_e003).toHaveLength(1);

    // Assert: 保存件数が正確に反映されたことを確認
    expect(result.saved_count).toBe(6);
  });
});