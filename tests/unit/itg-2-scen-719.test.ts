import { validateEstimateCompleteness } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-719: [error] 見積書必須項目完全性検証 - 工事種別が空白の場合、警告メッセージが表示され処理が中断する
  test('工事種別が空白の場合、完全性検証エラーを throw する', () => {
    const estimate_data = {
      construction_type: '',
      requester_name: '株式会社ABC',
      property_address: '東京都渋谷区1-2-3',
      amount: 1500000,
      quantity: 100,
      unit_price: 15000,
    };

    expect(() => validateEstimateCompleteness(estimate_data)).toThrow(/工事種別/);
  });

  test('工事種別が null の場合、完全性検証エラーを throw する', () => {
    const estimate_data = {
      construction_type: null as any,
      requester_name: '株式会社XYZ',
      property_address: '東京都千代田区5-6-7',
      amount: 2500000,
      quantity: 200,
      unit_price: 12500,
    };

    expect(() => validateEstimateCompleteness(estimate_data)).toThrow(/工事種別/);
  });

  test('工事種別が空白文字列のみの場合、完全性検証エラーを throw する', () => {
    const estimate_data = {
      construction_type: '   ',
      requester_name: '株式会社DEF',
      property_address: '東京都新宿区8-9-10',
      amount: 3000000,
      quantity: 150,
      unit_price: 20000,
    };

    expect(() => validateEstimateCompleteness(estimate_data)).toThrow(/工事種別/);
  });

  test('すべての必須項目が入力済みの場合、完全性検証を通過する', () => {
    const estimate_data = {
      construction_type: '新築工事',
      requester_name: '株式会社GHI',
      property_address: '東京都台東区11-12-13',
      amount: 4500000,
      quantity: 300,
      unit_price: 15000,
    };

    const result = validateEstimateCompleteness(estimate_data);

    expect(result).toEqual({
      is_valid: true,
      error_message: null,
      missing_fields: [],
    });
  });

  test('依頼者名が空白の場合、完全性検証エラーを throw する', () => {
    const estimate_data = {
      construction_type: '改修工事',
      requester_name: '',
      property_address: '東京都目黒区14-15-16',
      amount: 2000000,
      quantity: 80,
      unit_price: 25000,
    };

    expect(() => validateEstimateCompleteness(estimate_data)).toThrow(/依頼者名/);
  });

  test('物件住所が空白の場合、完全性検証エラーを throw する', () => {
    const estimate_data = {
      construction_type: '解体工事',
      requester_name: '株式会社JKL',
      property_address: '',
      amount: 1200000,
      quantity: 50,
      unit_price: 24000,
    };

    expect(() => validateEstimateCompleteness(estimate_data)).toThrow(/物件住所/);
  });

  test('金額が 0 の場合、完全性検証エラーを throw する', () => {
    const estimate_data = {
      construction_type: '塗装工事',
      requester_name: '株式会社MNO',
      property_address: '東京都品川区17-18-19',
      amount: 0,
      quantity: 120,
      unit_price: 15000,
    };

    expect(() => validateEstimateCompleteness(estimate_data)).toThrow(/金額/);
  });

  test('数量が未入力（undefined）の場合、完全性検証エラーを throw する', () => {
    const estimate_data = {
      construction_type: '電気工事',
      requester_name: '株式会社PQR',
      property_address: '東京都江東区20-21-22',
      amount: 1800000,
      quantity: undefined as any,
      unit_price: 18000,
    };

    expect(() => validateEstimateCompleteness(estimate_data)).toThrow(/数量/);
  });

  test('単価が負の値の場合、完全性検証エラーを throw する', () => {
    const estimate_data = {
      construction_type: '給排水工事',
      requester_name: '株式会社STU',
      property_address: '東京都中央区23-24-25',
      amount: 3200000,
      quantity: 200,
      unit_price: -16000,
    };

    expect(() => validateEstimateCompleteness(estimate_data)).toThrow(/単価/);
  });

  test('複数の必須項目が欠落している場合、最初の欠落項目に対するエラーを throw する', () => {
    const estimate_data = {
      construction_type: '',
      requester_name: '',
      property_address: '東京都港区26-27-28',
      amount: 2200000,
      quantity: 110,
      unit_price: 20000,
    };

    expect(() => validateEstimateCompleteness(estimate_data)).toThrow(/工事種別/);
  });

  test('工事種別に有効な値が設定されている場合、完全性検証を通過する', () => {
    const estimate_data = {
      construction_type: '防水工事',
      requester_name: '株式会社VWX',
      property_address: '東京都足立区29-30-31',
      amount: 5000000,
      quantity: 400,
      unit_price: 12500,
    };

    const result = validateEstimateCompleteness(estimate_data);

    expect(result.is_valid).toBe(true);
    expect(result.error_message).toBeNull();
    expect(result.missing_fields.length).toBe(0);
  });
});