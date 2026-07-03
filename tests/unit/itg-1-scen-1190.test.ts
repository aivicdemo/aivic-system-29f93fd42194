import { classifyInquiryMismatchType } from '../../src/logic/it-1781935279444-2-2-1';

describe('月次レポート配信後の顧客問い合わせ対応と検証 - データ不一致の自動判定', () => {
  // SCEN-1190
  test('3種類すべての問い合わせが正確に分類される', () => {
    // データ入力誤り: 顧客名の誤字、金額の桁数違い等
    const dataInputErrorInquiry = {
      inquiry_id: 'INQ001',
      inquiry_content: '請求書に記載されている顧客名が「株式会社テスト」になっていますが、正しくは「株式会社テスト・グループ」です。金額も1000000円のはずが100000円になっています。',
      report_value: 100000,
      source_value: 1000000,
      contract_terms: {
        customer_name: '株式会社テスト',
        billing_amount: 100000,
      },
    };

    const dataInputErrorResult = classifyInquiryMismatchType(dataInputErrorInquiry);
    expect(dataInputErrorResult.classification).toBe('データ入力誤り');
    expect(dataInputErrorResult.error_type).toMatch(/顧客名|金額|桁数/);
    expect(dataInputErrorResult.confidence_score).toBeGreaterThanOrEqual(0.8);

    // 計算ロジック誤り: 割引率の計算ミス、税金計算の誤り等
    const calculationErrorInquiry = {
      inquiry_id: 'INQ002',
      inquiry_content: '割引率が10%で計算されるはずですが、請求額が割引なしで計算されているように見えます。基本料金が100000円の場合、10%割引後は90000円になるはずが、100000円のままになっています。',
      report_value: 100000,
      source_value: 90000,
      contract_terms: {
        base_amount: 100000,
        discount_rate: 0.1,
        expected_amount: 90000,
      },
    };

    const calculationErrorResult = classifyInquiryMismatchType(calculationErrorInquiry);
    expect(calculationErrorResult.classification).toBe('計算ロジック誤り');
    expect(calculationErrorResult.error_type).toMatch(/割引|計算|ロジック/);
    expect(calculationErrorResult.confidence_score).toBeGreaterThanOrEqual(0.8);

    // 契約条件の誤解釈: 請求期間の認識違い、割引適用条件の相違等
    const contractMisinterpretationInquiry = {
      inquiry_id: 'INQ003',
      inquiry_content: '請求期間が1月1日から1月31日と記載されていますが、契約上は1月15日から2月14日までの月次請求ではないのですか？また、新規顧客割引が適用されると思っていたのですが、適用されていないようです。',
      report_value: 100000,
      source_value: 80000,
      contract_terms: {
        billing_period_start: '2024-01-01',
        billing_period_end: '2024-01-31',
        contract_period_start: '2024-01-15',
        contract_period_end: '2024-02-14',
        new_customer_discount_applicable: true,
      },
    };

    const contractMisinterpretationResult = classifyInquiryMismatchType(contractMisinterpretationInquiry);
    expect(contractMisinterpretationResult.classification).toBe('契約条件の誤解釈');
    expect(contractMisinterpretationResult.error_type).toMatch(/請求期間|割引条件|契約条件/);
    expect(contractMisinterpretationResult.confidence_score).toBeGreaterThanOrEqual(0.8);

    // 総合検証: 3種類すべてが正確に分類されることを確認
    expect(dataInputErrorResult.classification).not.toBe(calculationErrorResult.classification);
    expect(calculationErrorResult.classification).not.toBe(contractMisinterpretationResult.classification);
    expect(dataInputErrorResult.classification).not.toBe(contractMisinterpretationResult.classification);

    // 各結果に必須フィールドが存在することを確認
    [dataInputErrorResult, calculationErrorResult, contractMisinterpretationResult].forEach(
      (result) => {
        expect(result).toHaveProperty('classification');
        expect(result).toHaveProperty('error_type');
        expect(result).toHaveProperty('confidence_score');
        expect(typeof result.classification).toBe('string');
        expect(typeof result.error_type).toBe('string');
        expect(typeof result.confidence_score).toBe('number');
        expect(result.confidence_score).toBeGreaterThan(0);
        expect(result.confidence_score).toBeLessThanOrEqual(1);
      }
    );
  });
});