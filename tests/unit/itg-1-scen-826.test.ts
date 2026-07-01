import { describe, it, expect, beforeEach } from '@jest/globals';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  it('SCEN-826: 相談内容の優先度ベース自動ルーティング機能 - 相談内容に優先度が指定されていない場合、デフォルト優先度で処理される', async () => {
    // Arrange
    const default_priority = 'medium';
    const routing_department_for_medium = '営業支援部門';
    const expected_routing_log_priority = 'medium';
    
    const consultation_data = {
      consultation_id: 'CONS-20240115-001',
      customer_id: 'CUST-0001',
      title: '請求額に関する質問',
      content: '先月の請求内容について確認したい',
      priority: undefined
    };

    const mock_response = {
      consultation_id: 'CONS-20240115-001',
      assigned_priority: 'medium',
      assigned_department: '営業支援部門',
      routing_timestamp: '2024-01-15T11:00:00Z',
      routing_history_id: 'HIST-20240115-0001'
    };

    // Mock fetch for routing API
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mock_response)
      } as Response)
    );

    // Import the routing function
    const { executeConsultationAutoRouting } = await import(
      '../../src/logic/it-1781935279444-2-1-1'
    );

    // Act
    const result = await executeConsultationAutoRouting({
      consultation_id: consultation_data.consultation_id,
      customer_id: consultation_data.customer_id,
      title: consultation_data.title,
      content: consultation_data.content,
      priority: consultation_data.priority
    });

    // Assert - Priority assignment
    expect(result.assigned_priority).toBe(default_priority);

    // Assert - Correct department routing
    expect(result.assigned_department).toBe(routing_department_for_medium);

    // Assert - Routing timestamp recorded
    expect(result.routing_timestamp).toBe('2024-01-15T11:00:00Z');

    // Assert - Routing history ID generated
    expect(result.routing_history_id).toBe('HIST-20240115-0001');

    // Assert - Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/consultation/auto-routing'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: expect.stringContaining(consultation_data.consultation_id)
      })
    );

    // Assert - Verify the default priority is reflected in routing
    expect(result.assigned_priority).not.toBeNull();
    expect(result.assigned_priority).toEqual(expected_routing_log_priority);

    // Assert - Response structure validation
    expect(result).toHaveProperty('consultation_id');
    expect(result).toHaveProperty('assigned_priority');
    expect(result).toHaveProperty('assigned_department');
    expect(result).toHaveProperty('routing_timestamp');
    expect(result).toHaveProperty('routing_history_id');

    // Cleanup
    jest.restoreAllMocks();
  });
});