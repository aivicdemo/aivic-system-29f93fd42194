import { validateQuestionMessage } from '../../src/logic/it-1-br-2-2-2-1';

describe('ゼネコン質問対応自動判定機能', () => {
  // SCEN-1030
  test('質問メッセージが空文字列の場合、判定処理はエラーを返す', () => {
    const emptyMessage = '';

    expect(() => validateQuestionMessage(emptyMessage)).toThrow(/質問メッセージ/);
  });
});