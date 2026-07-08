import { assignVerificationPriority } from '../../src/logic/it-6-2-2-1';

describe('乖離根拠の検証優先度自動付与', () => {
  // SCEN-832
  test('許容範囲を超過した乖離に検証優先度「高」が自動的に付与される', () => {
    // 前提: 見積査定員がシステムの自動判定結果を確認し、相場乖離の根拠データを検証する画面を開いた
    // トリガー: 見積項目ごとに乖離が許容範囲内か超過かを判定し、超過時は警告を表示して査定員の確認を促す
    // 期待結果: 相場乖離率・乖離額が許容範囲内か超過かを自動判定し、検証優先度（高・中・低）を自動付与

    // テストデータ: 許容範囲を超過した乖離データ
    const deviation_data = {
      item_id: 'ITEM-001',
      item_name: '鉄筋工事',
      estimate_price: 1500000,
      market_price: 1000000,
      deviation_amount: 500000,
      deviation_rate: 50.0,
      tolerance_rate: 20.0,
      reference_count: 15,
      price_book_source: '物価本2024年版',
      correction_factor: 1.05
    };

    // 乖離根拠の検証優先度自動付与機能を実行
    const result = assignVerificationPriority(deviation_data);

    // 期待値:
    // - 乖離率 50.0% が許容率 20.0% を超過しているため、検証優先度は「高」
    // - 乖離額 500000 が基準額を超過しているため、検証優先度は「高」
    // - 参照データ件数 15 件は十分であるため、信頼度は「高」
    expect(result.verification_priority).toBe('高');
    expect(result.deviation_exceeds_tolerance).toBe(true);
    expect(result.warning_level).toBe('高');
    expect(result.requires_review).toBe(true);

    // 乖離データの詳細情報が正しく記録されていることを検証
    expect(result.item_id).toBe('ITEM-001');
    expect(result.item_name).toBe('鉄筋工事');
    expect(result.deviation_rate).toBe(50.0);
    expect(result.tolerance_rate).toBe(20.0);
    expect(result.deviation_amount).toBe(500000);
    expect(result.reference_count).toBe(15);

    // 検証優先度が画面表示フォーマットで正しく形成されていることを確認
    expect(result.display_label).toBe('検証優先度: 高');
    expect(result.display_color).toBe('red');
    expect(result.display_icon).toBe('⚠️');

    // 追加検証: 許容範囲内の乖離データに対しては検証優先度が「低」になることを確認
    const within_tolerance_data = {
      item_id: 'ITEM-002',
      item_name: '塗装工事',
      estimate_price: 500000,
      market_price: 480000,
      deviation_amount: 20000,
      deviation_rate: 4.2,
      tolerance_rate: 20.0,
      reference_count: 12,
      price_book_source: '物価本2024年版',
      correction_factor: 1.02
    };

    const result_within = assignVerificationPriority(within_tolerance_data);
    expect(result_within.verification_priority).toBe('低');
    expect(result_within.deviation_exceeds_tolerance).toBe(false);
    expect(result_within.warning_level).toBe('正常');
    expect(result_within.requires_review).toBe(false);

    // 追加検証: 許容範囲と乖離率の境界値 (ちょうど許容率と同じ値) をテスト
    const boundary_data = {
      item_id: 'ITEM-003',
      item_name: '足場工事',
      estimate_price: 1200000,
      market_price: 1000000,
      deviation_amount: 200000,
      deviation_rate: 20.0,
      tolerance_rate: 20.0,
      reference_count: 18,
      price_book_source: '物価本2024年版',
      correction_factor: 1.00
    };

    const result_boundary = assignVerificationPriority(boundary_data);
    expect(result_boundary.verification_priority).toBe('中');
    expect(result_boundary.deviation_exceeds_tolerance).toBe(false);
    expect(result_boundary.warning_level).toBe('要注意');
  });
});