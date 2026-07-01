import { describe, test, expect } from '@jest/globals';
import { trackMetadataCalculationLogicChangeDependencies } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理機能', () => {
  test('SCEN-1377: [normal] 計算ロジック変更時に既存の依存関係が正しく追跡される', () => {
    // Arrange: 計算ロジック変更前の初期メタデータと依存関係定義
    const initial_data_item_id = 'DI_001';
    const initial_item_name = 'アポ数集計';
    const initial_unit = '件';
    const initial_data_type = 'INTEGER';
    const initial_calculation_logic = 'SUM(contact_count WHERE status = "confirmed")';

    // 初期状態での依存関係: このデータ項目に依存する他の項目
    const dependent_items_before = [
      {
        dependent_item_id: 'DI_002',
        dependent_item_name: '成約率計算',
        dependency_type: 'CALCULATION_INPUT',
        is_active: true,
      },
      {
        dependent_item_id: 'DI_003',
        dependent_item_name: '売上効率スコア',
        dependency_type: 'CALCULATION_INPUT',
        is_active: true,
      },
      {
        dependent_item_id: 'DI_004',
        dependent_item_name: '月次サマリー集計',
        dependency_type: 'REPORT_MAPPING',
        is_active: true,
      },
    ];

    // 新しい計算ロジック（変更後）
    const new_calculation_logic =
      'SUM(contact_count WHERE status = "confirmed" AND contact_date >= period_start)';

    // 新しい計算ロジックに伴う変更：新たに依存される項目が増える
    const dependent_items_after = [
      {
        dependent_item_id: 'DI_002',
        dependent_item_name: '成約率計算',
        dependency_type: 'CALCULATION_INPUT',
        is_active: true,
      },
      {
        dependent_item_id: 'DI_003',
        dependent_item_name: '売上効率スコア',
        dependency_type: 'CALCULATION_INPUT',
        is_active: true,
      },
      {
        dependent_item_id: 'DI_004',
        dependent_item_name: '月次サマリー集計',
        dependency_type: 'REPORT_MAPPING',
        is_active: true,
      },
      {
        dependent_item_id: 'DI_005',
        dependent_item_name: '期間別分析',
        dependency_type: 'CALCULATION_INPUT',
        is_active: true,
      },
    ];

    // 計算ロジック変更リクエスト
    const change_request = {
      data_item_id: initial_data_item_id,
      item_name: initial_item_name,
      unit: initial_unit,
      data_type: initial_data_type,
      previous_calculation_logic: initial_calculation_logic,
      new_calculation_logic: new_calculation_logic,
      change_reason: 'レポート精度向上のため期間フィルタを追加',
      change_timestamp: '2024-01-15T10:30:00Z',
      changed_by_user_id: 'USER_REP_001',
    };

    // Act: 依存関係追跡処理を実行
    const tracking_result = trackMetadataCalculationLogicChangeDependencies({
      data_item_id: change_request.data_item_id,
      previous_calculation_logic: change_request.previous_calculation_logic,
      new_calculation_logic: change_request.new_calculation_logic,
      dependent_items_before: dependent_items_before,
      dependent_items_after: dependent_items_after,
      change_timestamp: change_request.change_timestamp,
    });

    // Assert: 依存関係追跡結果の検証
    // 1. 追跡処理が成功したことを確認
    expect(tracking_result.status).toBe('SUCCESS');

    // 2. 影響を受けるデータ項目の総数
    expect(tracking_result.total_affected_items).toBe(4);

    // 3. 既存依存関係の継続: DI_002, DI_003, DI_004 は変更前後で存続
    expect(tracking_result.continued_dependencies).toHaveLength(3);
    expect(
      tracking_result.continued_dependencies.map(
        (d: any) => d.dependent_item_id
      )
    ).toEqual(['DI_002', 'DI_003', 'DI_004']);

    // 4. 新規追加された依存関係: DI_005
    expect(tracking_result.new_dependencies).toHaveLength(1);
    expect(tracking_result.new_dependencies[0].dependent_item_id).toBe(
      'DI_005'
    );
    expect(tracking_result.new_dependencies[0].dependency_type).toBe(
      'CALCULATION_INPUT'
    );

    // 5. 削除された依存関係がないことを確認
    expect(tracking_result.removed_dependencies).toHaveLength(0);

    // 6. 各依存データ項目の更新ステータス
    const status_map = tracking_result.affected_items_status.reduce(
      (acc: any, item: any) => {
        acc[item.dependent_item_id] = item;
        return acc;
      },
      {}
    );

    // DI_002: 影響あり（計算ロジック入力として使用）
    expect(status_map['DI_002'].is_affected).toBe(true);
    expect(status_map['DI_002'].affected_reason).toBe(
      '計算ロジック変更によるフィルタ条件追加'
    );
    expect(status_map['DI_002'].update_required).toBe(true);

    // DI_003: 影響あり（計算ロジック入力として使用）
    expect(status_map['DI_003'].is_affected).toBe(true);
    expect(status_map['DI_003'].update_required).toBe(true);

    // DI_004: 影響あり（レポートマッピング）
    expect(status_map['DI_004'].is_affected).toBe(true);
    expect(status_map['DI_004'].dependency_type).toBe('REPORT_MAPPING');

    // DI_005: 新規依存関係（影響あり）
    expect(status_map['DI_005'].is_affected).toBe(true);
    expect(status_map['DI_005'].is_newly_dependent).toBe(true);

    // 7. 依存関係マップの比較検証
    expect(tracking_result.dependency_map_comparison).toBeDefined();
    expect(
      tracking_result.dependency_map_comparison.total_before
    ).toBe(3);
    expect(
      tracking_result.dependency_map_comparison.total_after
    ).toBe(4);
    expect(
      tracking_result.dependency_map_comparison.total_changed
    ).toBe(1);

    // 8. 変更履歴と依存関係追跡ログの記録
    expect(tracking_result.change_log).toBeDefined();
    expect(tracking_result.change_log.data_item_id).toBe(initial_data_item_id);
    expect(tracking_result.change_log.calculation_logic_changed).toBe(true);
    expect(
      tracking_result.change_log.previous_calculation_logic
    ).toBe(initial_calculation_logic);
    expect(
      tracking_result.change_log.new_calculation_logic
    ).toBe(new_calculation_logic);
    expect(tracking_result.change_log.timestamp).toBe(
      '2024-01-15T10:30:00Z'
    );

    // 9. 依存関係追跡ログの詳細情報
    expect(tracking_result.dependency_tracking_log).toBeDefined();
    expect(
      tracking_result.dependency_tracking_log.items_analyzed
    ).toBe(4);
    expect(
      tracking_result.dependency_tracking_log.continued_count
    ).toBe(3);
    expect(
      tracking_result.dependency_tracking_log.new_dependencies_added
    ).toBe(1);
    expect(
      tracking_result.dependency_tracking_log.dependencies_removed
    ).toBe(0);

    // 10. 依存関係追跡ログのタイムスタンプと完全性
    expect(tracking_result.dependency_tracking_log.tracking_completed_at).toBe(
      '2024-01-15T10:30:00Z'
    );
    expect(
      tracking_result.dependency_tracking_log.tracking_complete
    ).toBe(true);

    // 11. 期待結果: 変更前後の依存関係マップが正確に比較されている
    const expected_dependency_map_before = {
      data_item_id: initial_data_item_id,
      item_name: initial_item_name,
      dependent_items: [
        { id: 'DI_002', name: '成約率計算', type: 'CALCULATION_INPUT' },
        { id: 'DI_003', name: '売上効率スコア', type: 'CALCULATION_INPUT' },
        { id: 'DI_004', name: '月次サマリー集計', type: 'REPORT_MAPPING' },
      ],
    };

    const expected_dependency_map_after = {
      data_item_id: initial_data_item_id,
      item_name: initial_item_name,
      dependent_items: [
        { id: 'DI_002', name: '成約率計算', type: 'CALCULATION_INPUT' },
        { id: 'DI_003', name: '売上効率スコア', type: 'CALCULATION_INPUT' },
        { id: 'DI_004', name: '月次サマリー集計', type: 'REPORT_MAPPING' },
        { id: 'DI_005', name: '期間別分析', type: 'CALCULATION_INPUT' },
      ],
    };

    expect(
      tracking_result.dependency_map_before.dependent_items
    ).toHaveLength(
      expected_dependency_map_before.dependent_items.length
    );
    expect(
      tracking_result.dependency_map_after.dependent_items
    ).toHaveLength(
      expected_dependency_map_after.dependent_items.length
    );

    // 12. 計算ロジック変更の妥当性判定
    expect(
      tracking_result.calculation_logic_change_is_valid
    ).toBe(true);
    expect(
      tracking_result.all_dependencies_tracked_successfully
    ).toBe(true);
  });
});