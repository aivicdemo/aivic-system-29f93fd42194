import { applyJudgmentLogicWithAlternateRoutes } from '../../src/logic/it-6-2-2-1';

describe('他部署フォーマット判定ロジック適用試験機能', () => {
  test('SCEN-1364: 複数の項目構造不一致パターンに対して全パターンの代替処理ルートを出力', () => {
    // 準備: 複数の項目構造不一致パターンを含むテストデータ
    const testData = {
      otherDepartmentFormat: {
        estimateItems: [
          {
            itemId: 'OTHER_ITEM_001',
            itemName: '型枠工',
            quantity: 120,
            unit: 'm2',
            unitPrice: 1500,
          },
          {
            itemId: 'OTHER_ITEM_002',
            itemName: '鉄筋工',
            quantity: 85,
            unit: 't',
            unitPrice: 95000,
          },
          {
            itemId: 'OTHER_ITEM_003',
            itemName: 'コンクリート工',
            quantity: 200,
            unit: 'm3',
            unitPrice: 8500,
          },
        ],
        departmentCode: 'DEPT_B',
        structureClass: 'RC',
      },
      standardDepartmentFormat: {
        estimateItems: [
          {
            itemCode: 'STD_001',
            workDescription: '型枠工',
            qty: 120,
            uom: 'm2',
            price: 1500,
            region: 'TOKYO',
          },
          {
            itemCode: 'STD_002',
            workDescription: '鉄筋工',
            qty: 85,
            uom: 't',
            price: 95000,
            region: 'TOKYO',
          },
          {
            itemCode: 'STD_003',
            workDescription: 'コンクリート工',
            qty: 200,
            uom: 'm3',
            price: 8500,
            region: 'TOKYO',
          },
          {
            itemCode: 'STD_004',
            workDescription: '足場工',
            qty: 50,
            uom: 'm2',
            price: 800,
            region: 'TOKYO',
          },
        ],
      },
    };

    // 実行: 判定ロジック適用処理
    const result = applyJudgmentLogicWithAlternateRoutes(testData);

    // 検証: 代替処理ルート出力の完全性と正確性
    expect(result).toBeDefined();
    expect(result.mismatchPatterns).toBeDefined();
    expect(Array.isArray(result.mismatchPatterns)).toBe(true);
    expect(result.mismatchPatterns.length).toBeGreaterThanOrEqual(3);

    // 検証: 不一致パターン 1 - 項目フィールド名の相違（itemId vs itemCode）
    const pattern1 = result.mismatchPatterns.find(
      (p) => p.patternId === 'MISMATCH_FIELD_NAMES_001'
    );
    expect(pattern1).toBeDefined();
    expect(pattern1?.patternType).toBe('FIELD_NAME_MISMATCH');
    expect(pattern1?.affectedFields).toEqual(['itemId', 'itemCode']);
    expect(pattern1?.alternateRoutes).toBeDefined();
    expect(Array.isArray(pattern1?.alternateRoutes)).toBe(true);
    expect(pattern1?.alternateRoutes.length).toBeGreaterThanOrEqual(2);

    // 代替処理ルート 1-1: フィールドマッピング
    const route1_1 = pattern1?.alternateRoutes.find(
      (r) => r.routeId === 'ROUTE_FIELD_MAPPING_001'
    );
    expect(route1_1).toBeDefined();
    expect(route1_1?.routeName).toBe('フィールドマッピング適用');
    expect(route1_1?.processingContent).toBe(
      'otherDepartmentFormat.itemId → standardFormat.itemCode に自動マッピング'
    );
    expect(route1_1?.priority).toBe(1);
    expect(route1_1?.isApplicable).toBe(true);

    // 代替処理ルート 1-2: 手動確認フロー
    const route1_2 = pattern1?.alternateRoutes.find(
      (r) => r.routeId === 'ROUTE_MANUAL_REVIEW_001'
    );
    expect(route1_2).toBeDefined();
    expect(route1_2?.routeName).toBe('手動確認フロー');
    expect(route1_2?.processingContent).toBe(
      '査定員による項目対応確認と確認後のマッピング'
    );
    expect(route1_2?.priority).toBe(2);
    expect(route1_2?.isApplicable).toBe(true);

    // 検証: 不一致パターン 2 - 単位の相違（unit vs uom）
    const pattern2 = result.mismatchPatterns.find(
      (p) => p.patternId === 'MISMATCH_UNIT_NAME_001'
    );
    expect(pattern2).toBeDefined();
    expect(pattern2?.patternType).toBe('UNIT_FIELD_MISMATCH');
    expect(pattern2?.affectedFields).toEqual(['unit', 'uom']);
    expect(pattern2?.alternateRoutes).toBeDefined();
    expect(Array.isArray(pattern2?.alternateRoutes)).toBe(true);
    expect(pattern2?.alternateRoutes.length).toBeGreaterThanOrEqual(2);

    // 代替処理ルート 2-1: 単位変換辞書適用
    const route2_1 = pattern2?.alternateRoutes.find(
      (r) => r.routeId === 'ROUTE_UNIT_DICT_001'
    );
    expect(route2_1).toBeDefined();
    expect(route2_1?.routeName).toBe('単位変換辞書適用');
    expect(route2_1?.processingContent).toBe(
      'm2, t, m3 の単位コード自動変換'
    );
    expect(route2_1?.priority).toBe(1);
    expect(route2_1?.isApplicable).toBe(true);

    // 代替処理ルート 2-2: 単位確認フロー
    const route2_2 = pattern2?.alternateRoutes.find(
      (r) => r.routeId === 'ROUTE_UNIT_CONFIRM_001'
    );
    expect(route2_2).toBeDefined();
    expect(route2_2?.routeName).toBe('単位確認フロー');
    expect(route2_2?.processingContent).toBe('査定員による単位の確認と修正');
    expect(route2_2?.priority).toBe(2);
    expect(route2_2?.isApplicable).toBe(true);

    // 検証: 不一致パターン 3 - 項目数の相違（3 vs 4 項目）
    const pattern3 = result.mismatchPatterns.find(
      (p) => p.patternId === 'MISMATCH_ITEM_COUNT_001'
    );
    expect(pattern3).toBeDefined();
    expect(pattern3?.patternType).toBe('ITEM_COUNT_MISMATCH');
    expect(pattern3?.sourceCount).toBe(3);
    expect(pattern3?.targetCount).toBe(4);
    expect(pattern3?.countDifference).toBe(-1);
    expect(pattern3?.alternateRoutes).toBeDefined();
    expect(Array.isArray(pattern3?.alternateRoutes)).toBe(true);
    expect(pattern3?.alternateRoutes.length).toBeGreaterThanOrEqual(2);

    // 代替処理ルート 3-1: 部分マッピング
    const route3_1 = pattern3?.alternateRoutes.find(
      (r) => r.routeId === 'ROUTE_PARTIAL_MAPPING_001'
    );
    expect(route3_1).toBeDefined();
    expect(route3_1?.routeName).toBe('部分マッピング');
    expect(route3_1?.processingContent).toBe(
      '対応する項目のみマッピング、未対応項目は後続処理に委譲'
    );
    expect(route3_1?.priority).toBe(1);
    expect(route3_1?.isApplicable).toBe(true);

    // 代替処理ルート 3-2: 項目補完フロー
    const route3_2 = pattern3?.alternateRoutes.find(
      (r) => r.routeId === 'ROUTE_ITEM_SUPPLEMENT_001'
    );
    expect(route3_2).toBeDefined();
    expect(route3_2?.routeName).toBe('項目補完フロー');
    expect(route3_2?.processingContent).toBe(
      '標準フォーマットの不足項目を査定員が手動追加'
    );
    expect(route3_2?.priority).toBe(2);
    expect(route3_2?.isApplicable).toBe(true);

    // 検証: 不一致パターン 4 - 地域フィールドの有無相違
    const pattern4 = result.mismatchPatterns.find(
      (p) => p.patternId === 'MISMATCH_REGION_FIELD_001'
    );
    expect(pattern4).toBeDefined();
    expect(pattern4?.patternType).toBe('MISSING_FIELD_MISMATCH');
    expect(pattern4?.missingField).toBe('region');
    expect(pattern4?.alternateRoutes).toBeDefined();
    expect(Array.isArray(pattern4?.alternateRoutes)).toBe(true);

    // 代替処理ルート 4-1: デフォルト値設定
    const route4_1 = pattern4?.alternateRoutes.find(
      (r) => r.routeId === 'ROUTE_DEFAULT_REGION_001'
    );
    expect(route4_1).toBeDefined();
    expect(route4_1?.routeName).toBe('デフォルト値設定');
    expect(route4_1?.processingContent).toBe('地域を「TOKYO」でデフォルト設定');
    expect(route4_1?.priority).toBe(1);
    expect(route4_1?.isApplicable).toBe(true);

    // 代替処理ルート 4-2: 地域確認フロー
    const route4_2 = pattern4?.alternateRoutes.find(
      (r) => r.routeId === 'ROUTE_REGION_CONFIRM_001'
    );
    expect(route4_2).toBeDefined();
    expect(route4_2?.routeName).toBe('地域確認フロー');
    expect(route4_2?.processingContent).toBe('査定員による地域の確認と入力');
    expect(route4_2?.priority).toBe(2);
    expect(route4_2?.isApplicable).toBe(true);

    // 検証: 全体的な出力フォーマット準拠性
    expect(result.processStatus).toBe('COMPLETED');
    expect(result.totalPatternsDetected).toBe(4);
    expect(result.totalAlternateRoutes).toBeGreaterThanOrEqual(8);
    expect(result.allRoutesListed).toBe(true);
    expect(result.duplicateRoutes).toBe(0);
    expect(result.outputCompliance).toBe('COMPLIANT');

    // 検証: 出力順序（優先度順）の正確性
    const allRoutes = result.mismatchPatterns.flatMap(
      (p) => p.alternateRoutes
    );
    const prioritySequence = allRoutes.map((r) => r.priority);
    for (let i = 0; i < prioritySequence.length - 1; i++) {
      expect(prioritySequence[i]).toBeLessThanOrEqual(prioritySequence[i + 1]);
    }

    // 検証: 各ルートの必須フィールド完全性
    allRoutes.forEach((route) => {
      expect(route.routeId).toBeDefined();
      expect(typeof route.routeId).toBe('string');
      expect(route.routeName).toBeDefined();
      expect(typeof route.routeName).toBe('string');
      expect(route.processingContent).toBeDefined();
      expect(typeof route.processingContent).toBe('string');
      expect(route.priority).toBeDefined();
      expect(typeof route.priority).toBe('number');
      expect(route.isApplicable).toBeDefined();
      expect(typeof route.isApplicable).toBe('boolean');
    });

    // 検証: エラーがないこと
    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.length).toBe(0);
  });
});