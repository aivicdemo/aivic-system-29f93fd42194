import { getContractDiscountTerms } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-940: [normal] 契約別割引基準の確認機能 - 各契約に適用される割引種別・割引率・適用条件が正確に返却される', () => {
    // テストデータ: 複数の異なる割引パターンを持つ契約
    const contracts = [
      {
        contractId: 'C001',
        contractType: 'standard',
        contractAmount: 100000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      },
      {
        contractId: 'C002',
        contractType: 'volume',
        contractAmount: 500000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      },
      {
        contractId: 'C003',
        contractType: 'continuation',
        contractAmount: 200000,
        startDate: '2024-03-01',
        endDate: '2024-08-31',
      },
      {
        contractId: 'C004',
        contractType: 'campaign',
        contractAmount: 150000,
        startDate: '2024-06-01',
        endDate: '2024-06-30',
      },
      {
        contractId: 'C005',
        contractType: 'no_discount',
        contractAmount: 50000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      },
    ];

    // 各契約に対する割引基準照会を実行
    const result_c001 = getContractDiscountTerms({
      contractId: contracts[0].contractId,
      contractType: contracts[0].contractType,
      contractAmount: contracts[0].contractAmount,
      startDate: contracts[0].startDate,
      endDate: contracts[0].endDate,
    });

    // C001: 標準契約 - 割引率なし
    expect(result_c001).toEqual({
      contractId: 'C001',
      discountType: null,
      discountRate: 0,
      applicableStartDate: null,
      applicableEndDate: null,
      applicableConditions: null,
    });

    // C002: 数量割引 - 契約金額50万円以上で15%割引
    const result_c002 = getContractDiscountTerms({
      contractId: contracts[1].contractId,
      contractType: contracts[1].contractType,
      contractAmount: contracts[1].contractAmount,
      startDate: contracts[1].startDate,
      endDate: contracts[1].endDate,
    });

    expect(result_c002).toEqual({
      contractId: 'C002',
      discountType: '数量割引',
      discountRate: 0.15,
      applicableStartDate: '2024-01-01',
      applicableEndDate: '2024-12-31',
      applicableConditions: {
        minAmount: 500000,
        description: '契約金額50万円以上で適用',
      },
    });

    // C003: 継続割引 - 期間3ヶ月以上で10%割引
    const result_c003 = getContractDiscountTerms({
      contractId: contracts[2].contractId,
      contractType: contracts[2].contractType,
      contractAmount: contracts[2].contractAmount,
      startDate: contracts[2].startDate,
      endDate: contracts[2].endDate,
    });

    expect(result_c003).toEqual({
      contractId: 'C003',
      discountType: '継続割引',
      discountRate: 0.1,
      applicableStartDate: '2024-03-01',
      applicableEndDate: '2024-08-31',
      applicableConditions: {
        minDurationMonths: 3,
        description: '3ヶ月以上の継続契約で適用',
      },
    });

    // C004: キャンペーン割引 - 期間限定で20%割引
    const result_c004 = getContractDiscountTerms({
      contractId: contracts[3].contractId,
      contractType: contracts[3].contractType,
      contractAmount: contracts[3].contractAmount,
      startDate: contracts[3].startDate,
      endDate: contracts[3].endDate,
    });

    expect(result_c004).toEqual({
      contractId: 'C004',
      discountType: 'キャンペーン割引',
      discountRate: 0.2,
      applicableStartDate: '2024-06-01',
      applicableEndDate: '2024-06-30',
      applicableConditions: {
        campaignId: 'CAMP-2024-06',
        description: '6月限定キャンペーン',
      },
    });

    // C005: 割引なし契約
    const result_c005 = getContractDiscountTerms({
      contractId: contracts[4].contractId,
      contractType: contracts[4].contractType,
      contractAmount: contracts[4].contractAmount,
      startDate: contracts[4].startDate,
      endDate: contracts[4].endDate,
    });

    expect(result_c005).toEqual({
      contractId: 'C005',
      discountType: null,
      discountRate: 0,
      applicableStartDate: null,
      applicableEndDate: null,
      applicableConditions: null,
    });

    // エラーテスト: 無効な契約IDが指定された場合
    expect(() =>
      getContractDiscountTerms({
        contractId: '',
        contractType: 'standard',
        contractAmount: 100000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      })
    ).toThrow(/契約ID/);

    // エラーテスト: 契約金額が負の値
    expect(() =>
      getContractDiscountTerms({
        contractId: 'C006',
        contractType: 'standard',
        contractAmount: -100000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      })
    ).toThrow(/契約金額/);

    // エラーテスト: 開始日が終了日より後
    expect(() =>
      getContractDiscountTerms({
        contractId: 'C007',
        contractType: 'standard',
        contractAmount: 100000,
        startDate: '2024-12-31',
        endDate: '2024-01-01',
      })
    ).toThrow(/日付/);
  });
});