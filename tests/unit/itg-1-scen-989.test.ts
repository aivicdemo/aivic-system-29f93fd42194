import { validateAndApplyCorrection } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質検証と請求額計算 - 修正ルール参照エラー検出', () => {
  // SCEN-989: [error] 請求内容の再計算・修正判定 - 未定義の修正ルールが参照される場合、エラーとして検出される
  test('未定義の修正ルールIDを指定した場合、適切なエラーメッセージが表示され、修正処理が中断される', () => {
    const invalidCorrectionRuleId = 'undefined-rule-id-99999';
    const billingData = {
      customerId: 'CUST-001',
      serviceId: 'SERVICE-A',
      billingAmount: 50000,
      period: '2024-01',
      correctionRuleId: invalidCorrectionRuleId,
    };

    expect(() => validateAndApplyCorrection(billingData)).toThrow(/修正ルール/);
  });
});