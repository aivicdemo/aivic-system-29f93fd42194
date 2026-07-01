import { calculateDeliveryDateDifference } from '../../src/logic/it-1781935279444-2-1-1';

describe('納期遅延・前倒し検出・通知機能', () => {
  test('SCEN-811: 実績納期と契約納期の差異が正確に計算される', () => {
    // ケース1: 遅延（実績 > 契約）
    const delayResult = calculateDeliveryDateDifference(
      new Date('2024-03-15'),
      new Date('2024-03-20')
    );
    expect(delayResult).toBe(5);

    // ケース2: 前倒し（実績 < 契約）
    const advanceResult = calculateDeliveryDateDifference(
      new Date('2024-03-15'),
      new Date('2024-03-10')
    );
    expect(advanceResult).toBe(-5);

    // ケース3: 差異なし（実績 = 契約）
    const noDifferenceResult = calculateDeliveryDateDifference(
      new Date('2024-03-15'),
      new Date('2024-03-15')
    );
    expect(noDifferenceResult).toBe(0);

    // ケース4: 契約納期がnull
    expect(() => {
      calculateDeliveryDateDifference(null, new Date('2024-03-20'));
    }).toThrow(/契約納期/);

    // ケース5: 実績納期がnull
    expect(() => {
      calculateDeliveryDateDifference(new Date('2024-03-15'), null);
    }).toThrow(/実績納期/);
  });
});