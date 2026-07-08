import { describe, test, expect } from "@jest/globals";
import { calculatePriceRangeAndDeviation } from "../../src/logic/it-6-2-1-1";

describe("相場範囲と許容乖離幅の算出", () => {
  test("SCEN-892: サンプルサイズが不足している場合にエラーが返却される", () => {
    const insufficient_sample_dataset = {
      items: [
        { item_id: "ITEM001", price: 100000 },
        { item_id: "ITEM002", price: 105000 },
        { item_id: "ITEM003", price: 98000 },
        { item_id: "ITEM004", price: 102000 },
        { item_id: "ITEM005", price: 101000 },
        { item_id: "ITEM006", price: 99000 },
        { item_id: "ITEM007", price: 103000 },
        { item_id: "ITEM008", price: 100500 },
        { item_id: "ITEM009", price: 104000 },
        { item_id: "ITEM010", price: 97000 },
        { item_id: "ITEM011", price: 106000 },
        { item_id: "ITEM012", price: 95000 },
        { item_id: "ITEM013", price: 108000 },
        { item_id: "ITEM014", price: 101500 },
        { item_id: "ITEM015", price: 102500 },
        { item_id: "ITEM016", price: 99500 },
        { item_id: "ITEM017", price: 104500 },
        { item_id: "ITEM018", price: 96000 },
        { item_id: "ITEM019", price: 107000 },
        { item_id: "ITEM020", price: 103500 },
        { item_id: "ITEM021", price: 98500 },
        { item_id: "ITEM022", price: 105500 },
        { item_id: "ITEM023", price: 100000 },
        { item_id: "ITEM024", price: 102000 },
        { item_id: "ITEM025", price: 101000 },
        { item_id: "ITEM026", price: 99000 },
        { item_id: "ITEM027", price: 103000 },
        { item_id: "ITEM028", price: 100500 },
      ],
      min_sample_size: 30,
    };

    expect(() =>
      calculatePriceRangeAndDeviation(insufficient_sample_dataset)
    ).toThrow(/サンプルサイズ/);
  });
});