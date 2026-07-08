import { generateExplanationMaterial } from '../../src/logic/it-1-br-2-2-2-1';

const fetchMock = require('jest-fetch-mock');

describe('査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード', () => {
  // SCEN-750: [error] 説明資料自動生成機能 - 相場乖離データが取得できないとき説明資料生成がエラーとなり代替メッセージが表示される
  test('相場乖離データ取得APIがエラーを返すとき、説明資料生成が失敗し代替メッセージを返す', async () => {
    fetchMock.resetMocks();

    const assessment_id = 'ASS-20240115-001';
    const product_code = 'PROD-12345';
    const assessment_date = new Date('2024-01-15T10:30:00Z');
    const divergence_rate = 12.5;
    const divergence_amount = 50000;
    const reference_count = 45;

    fetchMock.mockResponseOnce(
      JSON.stringify({ error: 'Not Found' }),
      { status: 404 }
    );

    const result = await generateExplanationMaterial({
      assessment_id,
      product_code,
      assessment_date,
      divergence_rate,
      divergence_amount,
      reference_count,
    });

    expect(result).toEqual({
      status: 'error',
      message: '相場データの取得に失敗しました。別の方法で説明資料を生成してください',
      material_id: null,
      content: null,
    });
  });
});