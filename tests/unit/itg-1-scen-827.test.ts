import { describe, test, expect } from '@jest/globals';
import { routeConsultationByPriority } from '../../src/logic/it-1781935279444-2-2-1';

describe('相談内容の優先度ベース自動ルーティング機能 - エラーハンドリング', () => {
  test('SCEN-827: 相談内容が空文字列またはnullの場合、エラーが返却される', () => {
    // 相談内容が空文字列の場合
    expect(() => {
      routeConsultationByPriority({
        consultationContent: '',
        consultantId: 'consultant-001',
        customerId: 'customer-001'
      });
    }).toThrow(/相談内容/);

    // 相談内容がnullの場合
    expect(() => {
      routeConsultationByPriority({
        consultationContent: null as any,
        consultantId: 'consultant-001',
        customerId: 'customer-001'
      });
    }).toThrow(/相談内容/);

    // 相談内容が正常に入力された場合は処理が実行される
    const result = routeConsultationByPriority({
      consultationContent: '契約変更に関する質問です',
      consultantId: 'consultant-001',
      customerId: 'customer-001',
      priority: 'high'
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty('routingId');
    expect(result).toHaveProperty('routingPath');
    expect(result.routingId).toMatch(/^routing-/);
  });
});