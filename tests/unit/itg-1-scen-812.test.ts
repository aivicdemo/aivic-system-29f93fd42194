import { detectDeliveryDelays } from '../../src/logic/it-1781935279444-2-1-1';

describe('納期遅延・前倒し検出・通知機能', () => {
  test('SCEN-812: 納期が遅延している場合に検出・フラグが立てられる', () => {
    // 固定の現在日時を基準として設定
    const currentDateTime = new Date('2024-02-15T10:00:00Z');

    // テストデータ: 複数の受注レコード
    const orders = [
      {
        orderId: 'ORD-001',
        plannedDeliveryDate: new Date('2024-02-10T00:00:00Z'), // 過去日時 → 遅延
        status: 'pending',
        delayFlag: false,
      },
      {
        orderId: 'ORD-002',
        plannedDeliveryDate: new Date('2024-02-08T00:00:00Z'), // 過去日時 → 遅延
        status: 'pending',
        delayFlag: false,
      },
      {
        orderId: 'ORD-003',
        plannedDeliveryDate: new Date('2024-02-20T00:00:00Z'), // 未来日時 → 遅延なし
        status: 'pending',
        delayFlag: false,
      },
      {
        orderId: 'ORD-004',
        plannedDeliveryDate: new Date('2024-02-15T15:00:00Z'), // 現在日時以降 → 遅延なし
        status: 'pending',
        delayFlag: false,
      },
    ];

    // 納期遅延検出ロジックを実行
    const result = detectDeliveryDelays(orders, currentDateTime);

    // 検出されたレコードの検証: 遅延フラグが正しく立つ
    expect(result).toHaveLength(4);

    // ORD-001: 過去日時 → 遅延フラグ立つ
    const delayedOrder1 = result.find((o) => o.orderId === 'ORD-001');
    expect(delayedOrder1?.delayFlag).toBe(true);
    expect(delayedOrder1?.status).toBe('delayed');

    // ORD-002: 過去日時 → 遅延フラグ立つ
    const delayedOrder2 = result.find((o) => o.orderId === 'ORD-002');
    expect(delayedOrder2?.delayFlag).toBe(true);
    expect(delayedOrder2?.status).toBe('delayed');

    // ORD-003: 未来日時 → 遅延フラグ立たない
    const onTimeOrder1 = result.find((o) => o.orderId === 'ORD-003');
    expect(onTimeOrder1?.delayFlag).toBe(false);
    expect(onTimeOrder1?.status).toBe('pending');

    // ORD-004: 現在日時以降 → 遅延フラグ立たない
    const onTimeOrder2 = result.find((o) => o.orderId === 'ORD-004');
    expect(onTimeOrder2?.delayFlag).toBe(false);
    expect(onTimeOrder2?.status).toBe('pending');

    // 複数の遅延受注レコードが正しく検出されたことを確認
    const delayedOrders = result.filter((o) => o.delayFlag === true);
    expect(delayedOrders).toHaveLength(2);

    // 遅延受注のすべてがステータス更新されていることを確認
    delayedOrders.forEach((order) => {
      expect(order.status).toBe('delayed');
    });

    // 非遅延受注のステータスが変更されていないことを確認
    const onTimeOrders = result.filter((o) => o.delayFlag === false);
    expect(onTimeOrders).toHaveLength(2);
    onTimeOrders.forEach((order) => {
      expect(order.status).toBe('pending');
    });
  });
});