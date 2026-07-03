import { determineContractVersionByCustomer } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 契約書バージョン自動判定', () => {
  test('SCEN-1059: 該当顧客に対する有効な契約書が存在しない場合、エラーが適切に返却される', () => {
    const nonExistentCustomerId = 'CUST_NONEXISTENT_99999';

    expect(() => {
      determineContractVersionByCustomer({
        customer_id: nonExistentCustomerId,
        reference_date: new Date('2024-01-15T11:00:00Z'),
      });
    }).toThrow(/契約書/);

    try {
      determineContractVersionByCustomer({
        customer_id: nonExistentCustomerId,
        reference_date: new Date('2024-01-15T11:00:00Z'),
      });
    } catch (error: unknown) {
      const err = error as { message: string; code: string; status_code: number };

      expect(err.message).toMatch(/見つかりません/);
      expect(err.code).toBe('CONTRACT_NOT_FOUND');
      expect([400, 404, 500]).toContain(err.status_code);
    }
  });
});