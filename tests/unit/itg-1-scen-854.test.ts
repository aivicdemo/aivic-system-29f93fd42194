import { compareContractHistory } from '../../src/logic/it-1781935279444-2-2-1';

describe('契約変更前後の比較・差分可視化機能', () => {
  // SCEN-854: [error] 契約変更前後の比較・差分可視化機能 - 契約変更前の歴史的データが存在しない場合、エラーハンドリングされる
  test('契約変更前の歴史的データが存在しない場合、エラーメッセージが表示される', () => {
    const contractId = 'contract-no-history-001';
    const historicalRecords = [];
    const currentContractData = {
      contractId: contractId,
      customerId: 'customer-001',
      serviceName: 'service-a',
      basePrice: 100000,
      discountRate: 0,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    };

    expect(() => {
      compareContractHistory({
        contractId: contractId,
        historicalRecords: historicalRecords,
        currentContractData: currentContractData,
      });
    }).toThrow(/歴史的データ/);
  });
});