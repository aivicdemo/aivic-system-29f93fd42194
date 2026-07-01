import { describe, it, expect } from '@jest/globals';
import { extractAndAggregateChargeItems } from '../../src/logic/it-1-2-1';

describe('請求対象項目の自動抽出と請求額集計', () => {
  it('SCEN-750: 小数点以下の端数が定義済みの丸め方式に基づいて適切に処理される', () => {
    // ========== ハッピーパス: 四捨五入での端数処理 ==========
    const input_round_half_up = {
      chargeItems: [
        {
          itemId: 'ITEM_001',
          customerId: 'CUST_A',
          serviceId: 'SVC_STANDARD',
          unitPrice: 123.456,
          quantity: 3,
          roundingMethod: 'ROUND_HALF_UP' as const,
        },
        {
          itemId: 'ITEM_002',
          customerId: 'CUST_A',
          serviceId: 'SVC_STANDARD',
          unitPrice: 45.789,
          quantity: 2,
          roundingMethod: 'ROUND_HALF_UP' as const,
        },
      ],
    };

    const result_round_half_up = extractAndAggregateChargeItems(input_round_half_up);

    // 第1項目: 123.456 * 3 = 370.368 → 四捨五入で 370.37
    // 第2項目: 45.789 * 2 = 91.578 → 四捨五入で 91.58
    // 合計: 370.37 + 91.58 = 461.95
    expect(result_round_half_up.items).toHaveLength(2);
    expect(result_round_half_up.items[0]).toEqual({
      itemId: 'ITEM_001',
      customerId: 'CUST_A',
      serviceId: 'SVC_STANDARD',
      originalAmount: 370.368,
      roundedAmount: 370.37,
      roundingMethod: 'ROUND_HALF_UP',
    });
    expect(result_round_half_up.items[1]).toEqual({
      itemId: 'ITEM_002',
      customerId: 'CUST_A',
      serviceId: 'SVC_STANDARD',
      originalAmount: 91.578,
      roundedAmount: 91.58,
      roundingMethod: 'ROUND_HALF_UP',
    });
    expect(result_round_half_up.totalAmount).toBe(461.95);

    // ========== ハッピーパス: 切り上げでの端数処理 ==========
    const input_round_up = {
      chargeItems: [
        {
          itemId: 'ITEM_003',
          customerId: 'CUST_B',
          serviceId: 'SVC_PREMIUM',
          unitPrice: 123.456,
          quantity: 3,
          roundingMethod: 'ROUND_UP' as const,
        },
        {
          itemId: 'ITEM_004',
          customerId: 'CUST_B',
          serviceId: 'SVC_PREMIUM',
          unitPrice: 45.789,
          quantity: 2,
          roundingMethod: 'ROUND_UP' as const,
        },
      ],
    };

    const result_round_up = extractAndAggregateChargeItems(input_round_up);

    // 第1項目: 123.456 * 3 = 370.368 → 切り上げで 370.37
    // 第2項目: 45.789 * 2 = 91.578 → 切り上げで 91.58
    // 合計: 370.37 + 91.58 = 461.95
    expect(result_round_up.items).toHaveLength(2);
    expect(result_round_up.items[0]).toEqual({
      itemId: 'ITEM_003',
      customerId: 'CUST_B',
      serviceId: 'SVC_PREMIUM',
      originalAmount: 370.368,
      roundedAmount: 370.37,
      roundingMethod: 'ROUND_UP',
    });
    expect(result_round_up.items[1]).toEqual({
      itemId: 'ITEM_004',
      customerId: 'CUST_B',
      serviceId: 'SVC_PREMIUM',
      originalAmount: 91.578,
      roundedAmount: 91.58,
      roundingMethod: 'ROUND_UP',
    });
    expect(result_round_up.totalAmount).toBe(461.95);

    // ========== ハッピーパス: 切り下げでの端数処理 ==========
    const input_round_down = {
      chargeItems: [
        {
          itemId: 'ITEM_005',
          customerId: 'CUST_C',
          serviceId: 'SVC_BASIC',
          unitPrice: 123.456,
          quantity: 3,
          roundingMethod: 'ROUND_DOWN' as const,
        },
        {
          itemId: 'ITEM_006',
          customerId: 'CUST_C',
          serviceId: 'SVC_BASIC',
          unitPrice: 45.789,
          quantity: 2,
          roundingMethod: 'ROUND_DOWN' as const,
        },
      ],
    };

    const result_round_down = extractAndAggregateChargeItems(input_round_down);

    // 第1項目: 123.456 * 3 = 370.368 → 切り下げで 370.36
    // 第2項目: 45.789 * 2 = 91.578 → 切り下げで 91.57
    // 合計: 370.36 + 91.57 = 461.93
    expect(result_round_down.items).toHaveLength(2);
    expect(result_round_down.items[0]).toEqual({
      itemId: 'ITEM_005',
      customerId: 'CUST_C',
      serviceId: 'SVC_BASIC',
      originalAmount: 370.368,
      roundedAmount: 370.36,
      roundingMethod: 'ROUND_DOWN',
    });
    expect(result_round_down.items[1]).toEqual({
      itemId: 'ITEM_006',
      customerId: 'CUST_C',
      serviceId: 'SVC_BASIC',
      originalAmount: 91.578,
      roundedAmount: 91.57,
      roundingMethod: 'ROUND_DOWN',
    });
    expect(result_round_down.totalAmount).toBe(461.93);

    // ========== エラーケース: 丸め方式の不正値 ==========
    const input_invalid_method = {
      chargeItems: [
        {
          itemId: 'ITEM_007',
          customerId: 'CUST_D',
          serviceId: 'SVC_STANDARD',
          unitPrice: 100.5,
          quantity: 1,
          roundingMethod: 'INVALID_METHOD' as any,
        },
      ],
    };

    expect(() => {
      extractAndAggregateChargeItems(input_invalid_method);
    }).toThrow(/丸め方式/);

    // ========== エラーケース: 負の数量 ==========
    const input_negative_quantity = {
      chargeItems: [
        {
          itemId: 'ITEM_008',
          customerId: 'CUST_E',
          serviceId: 'SVC_STANDARD',
          unitPrice: 100.0,
          quantity: -1,
          roundingMethod: 'ROUND_HALF_UP' as const,
        },
      ],
    };

    expect(() => {
      extractAndAggregateChargeItems(input_negative_quantity);
    }).toThrow(/数量/);

    // ========== エラーケース: 空の請求項目リスト ==========
    const input_empty_items = {
      chargeItems: [],
    };

    expect(() => {
      extractAndAggregateChargeItems(input_empty_items);
    }).toThrow(/請求項目/);

    // ========== ハッピーパス: 複数顧客・複数サービスの集計 ==========
    const input_multiple_customers = {
      chargeItems: [
        {
          itemId: 'ITEM_009',
          customerId: 'CUST_A',
          serviceId: 'SVC_STANDARD',
          unitPrice: 200.123,
          quantity: 1,
          roundingMethod: 'ROUND_HALF_UP' as const,
        },
        {
          itemId: 'ITEM_010',
          customerId: 'CUST_A',
          serviceId: 'SVC_PREMIUM',
          unitPrice: 300.456,
          quantity: 1,
          roundingMethod: 'ROUND_HALF_UP' as const,
        },
        {
          itemId: 'ITEM_011',
          customerId: 'CUST_B',
          serviceId: 'SVC_STANDARD',
          unitPrice: 150.789,
          quantity: 2,
          roundingMethod: 'ROUND_HALF_UP' as const,
        },
      ],
    };

    const result_multiple = extractAndAggregateChargeItems(input_multiple_customers);

    // 第1項目: 200.123 * 1 = 200.123 → 四捨五入で 200.12
    // 第2項目: 300.456 * 1 = 300.456 → 四捨五入で 300.46
    // 第3項目: 150.789 * 2 = 301.578 → 四捨五入で 301.58
    // 合計: 200.12 + 300.46 + 301.58 = 802.16
    expect(result_multiple.items).toHaveLength(3);
    expect(result_multiple.items[0].roundedAmount).toBe(200.12);
    expect(result_multiple.items[1].roundedAmount).toBe(300.46);
    expect(result_multiple.items[2].roundedAmount).toBe(301.58);
    expect(result_multiple.totalAmount).toBe(802.16);

    // ========== ハッピーパス: 丸め方式の動的な切り替え ==========
    const input_switch_method = {
      chargeItems: [
        {
          itemId: 'ITEM_012',
          customerId: 'CUST_F',
          serviceId: 'SVC_STANDARD',
          unitPrice: 99.999,
          quantity: 1,
          roundingMethod: 'ROUND_HALF_UP' as const,
        },
      ],
    };

    const result_switch_half_up = extractAndAggregateChargeItems(input_switch_method);
    // 99.999 → 四捨五入で 100.00
    expect(result_switch_half_up.items[0].roundedAmount).toBe(100.0);

    const input_switch_to_down = {
      chargeItems: [
        {
          itemId: 'ITEM_013',
          customerId: 'CUST_F',
          serviceId: 'SVC_STANDARD',
          unitPrice: 99.999,
          quantity: 1,
          roundingMethod: 'ROUND_DOWN' as const,
        },
      ],
    };

    const result_switch_down = extractAndAggregateChargeItems(input_switch_to_down);
    // 99.999 → 切り下げで 99.99
    expect(result_switch_down.items[0].roundedAmount).toBe(99.99);
  });
});