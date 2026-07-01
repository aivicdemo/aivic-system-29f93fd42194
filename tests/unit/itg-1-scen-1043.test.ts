import { classifyCustomerInquiry } from '../../src/logic/it-1-2-1';

describe('顧客質問内容の分類と優先度判定', () => {
  // SCEN-1043
  test('判定不可能なフォーマットの質問内容に対してエラーハンドリングが正常に機能する', () => {
    const invalidInputs = [
      '',
      null,
      undefined,
      '{"incomplete": json}',
      '123',
      '[]',
    ];

    invalidInputs.forEach((input) => {
      expect(() => classifyCustomerInquiry(input)).toThrow(/分類エラー|フォーマットエラー/);
    });
  });
});