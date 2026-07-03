import { calculateVendorImplementationPriority } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - CRMベンダー実装可能性判定", () => {
  test("SCEN-1338: 実装要件が多数である場合、優先度スコアが正確に算出され、ロードマップに反映される", () => {
    // テストデータ: 20件以上の複雑な実装要件
    const vendorRequirements = [
      {
        requirement_id: "REQ-001",
        requirement_name: "営業データ項目定義機能",
        priority_level: "high",
        complexity_score: 8,
        dependencies: [],
      },
      {
        requirement_id: "REQ-002",
        requirement_name: "データ型バリデーション",
        priority_level: "high",
        complexity_score: 6,
        dependencies: ["REQ-001"],
      },
      {
        requirement_id: "REQ-003",
        requirement_name: "計算ロジック定義",
        priority_level: "high",
        complexity_score: 9,
        dependencies: ["REQ-001"],
      },
      {
        requirement_id: "REQ-004",
        requirement_name: "レポートマッピング",
        priority_level: "high",
        complexity_score: 7,
        dependencies: ["REQ-001", "REQ-003"],
      },
      {
        requirement_id: "REQ-005",
        requirement_name: "品質検証ルール自動実行",
        priority_level: "high",
        complexity_score: 8,
        dependencies: ["REQ-002"],
      },
      {
        requirement_id: "REQ-006",
        requirement_name: "異常値検出アルゴリズム",
        priority_level: "medium",
        complexity_score: 7,
        dependencies: ["REQ-005"],
      },
      {
        requirement_id: "REQ-007",
        requirement_name: "データ欠落検出",
        priority_level: "medium",
        complexity_score: 5,
        dependencies: ["REQ-005"],
      },
      {
        requirement_id: "REQ-008",
        requirement_name: "不整合検出ロジック",
        priority_level: "medium",
        complexity_score: 6,
        dependencies: ["REQ-005"],
      },
      {
        requirement_id: "REQ-009",
        requirement_name: "自動修正ロジック",
        priority_level: "medium",
        complexity_score: 8,
        dependencies: ["REQ-006", "REQ-007", "REQ-008"],
      },
      {
        requirement_id: "REQ-010",
        requirement_name: "月次集計ロジック",
        priority_level: "high",
        complexity_score: 7,
        dependencies: ["REQ-004"],
      },
      {
        requirement_id: "REQ-011",
        requirement_name: "請求額自動計算",
        priority_level: "high",
        complexity_score: 9,
        dependencies: ["REQ-010"],
      },
      {
        requirement_id: "REQ-012",
        requirement_name: "割引ルール適用",
        priority_level: "medium",
        complexity_score: 6,
        dependencies: ["REQ-011"],
      },
      {
        requirement_id: "REQ-013",
        requirement_name: "API連携フレームワーク",
        priority_level: "high",
        complexity_score: 8,
        dependencies: [],
      },
      {
        requirement_id: "REQ-014",
        requirement_name: "会計システム連携",
        priority_level: "high",
        complexity_score: 7,
        dependencies: ["REQ-013", "REQ-011"],
      },
      {
        requirement_id: "REQ-015",
        requirement_name: "レポート自動生成",
        priority_level: "medium",
        complexity_score: 7,
        dependencies: ["REQ-004", "REQ-010"],
      },
      {
        requirement_id: "REQ-016",
        requirement_name: "配信スケジュール管理",
        priority_level: "medium",
        complexity_score: 5,
        dependencies: ["REQ-015"],
      },
      {
        requirement_id: "REQ-017",
        requirement_name: "ポータル画面開発",
        priority_level: "low",
        complexity_score: 6,
        dependencies: ["REQ-004"],
      },
      {
        requirement_id: "REQ-018",
        requirement_name: "ユーザー権限管理",
        priority_level: "low",
        complexity_score: 5,
        dependencies: [],
      },
      {
        requirement_id: "REQ-019",
        requirement_name: "監査ログ記録",
        priority_level: "low",
        complexity_score: 4,
        dependencies: [],
      },
      {
        requirement_id: "REQ-020",
        requirement_name: "エラーハンドリング",
        priority_level: "medium",
        complexity_score: 6,
        dependencies: [],
      },
      {
        requirement_id: "REQ-021",
        requirement_name: "パフォーマンス最適化",
        priority_level: "low",
        complexity_score: 7,
        dependencies: ["REQ-014"],
      },
    ];

    // 優先度スコア計算ロジック実行
    const result = calculateVendorImplementationPriority({
      requirements: vendorRequirements,
    });

    // ============================================================
    // 1. すべての要件に対してスコアが計算されたか確認
    // ============================================================
    expect(result.scored_requirements.length).toBe(21);
    expect(result.scored_requirements.every((r) => r.priority_score !== null)).toBe(
      true
    );

    // ============================================================
    // 2. 優先度スコア計算式の正確性を検証
    // ============================================================
    // 優先度レベルの重み付け: high=3, medium=2, low=1
    // 計算式: base_score = priority_weight * complexity_score
    // 依存関係の重み付け: 依存関係なし=1.0, 依存関係あり=1.0 + (依存数 * 0.1)
    // 最終スコア = base_score * dependency_weight

    const req001 = result.scored_requirements.find(
      (r) => r.requirement_id === "REQ-001"
    );
    expect(req001).toBeDefined();
    // REQ-001: high(3) × 8 × 1.0 = 24
    expect(req001!.priority_score).toBe(24);

    const req002 = result.scored_requirements.find(
      (r) => r.requirement_id === "REQ-002"
    );
    expect(req002).toBeDefined();
    // REQ-002: high(3) × 6 × 1.1 (依存1件) = 19.8
    expect(req002!.priority_score).toBe(19.8);

    const req003 = result.scored_requirements.find(
      (r) => r.requirement_id === "REQ-003"
    );
    expect(req003).toBeDefined();
    // REQ-003: high(3) × 9 × 1.1 (依存1件) = 29.7
    expect(req003!.priority_score).toBe(29.7);

    const req004 = result.scored_requirements.find(
      (r) => r.requirement_id === "REQ-004"
    );
    expect(req004).toBeDefined();
    // REQ-004: high(3) × 7 × 1.2 (依存2件) = 25.2
    expect(req004!.priority_score).toBe(25.2);

    const req006 = result.scored_requirements.find(
      (r) => r.requirement_id === "REQ-006"
    );
    expect(req006).toBeDefined();
    // REQ-006: medium(2) × 7 × 1.1 (依存1件) = 15.4
    expect(req006!.priority_score).toBe(15.4);

    const req009 = result.scored_requirements.find(
      (r) => r.requirement_id === "REQ-009"
    );
    expect(req009).toBeDefined();
    // REQ-009: medium(2) × 8 × 1.3 (依存3件) = 20.8
    expect(req009!.priority_score).toBe(20.8);

    const req018 = result.scored_requirements.find(
      (r) => r.requirement_id === "REQ-018"
    );
    expect(req018).toBeDefined();
    // REQ-018: low(1) × 5 × 1.0 = 5
    expect(req018!.priority_score).toBe(5);

    // ============================================================
    // 3. スコアが0またはマイナス値になっていないか確認
    // ============================================================
    expect(
      result.scored_requirements.every((r) => r.priority_score > 0)
    ).toBe(true);

    // ============================================================
    // 4. ロードマップが自動生成されているか確認
    // ============================================================
    expect(result.roadmap).toBeDefined();
    expect(result.roadmap.phases).toBeDefined();
    expect(result.roadmap.phases.length).toBeGreaterThan(0);

    // ============================================================
    // 5. ロードマップ内の要件の並び順が優先度スコアの高い順か確認
    // ============================================================
    const allRoadmapItems = result.roadmap.phases.flatMap((p) => p.requirements);
    expect(allRoadmapItems.length).toBe(21);

    for (let i = 0; i < allRoadmapItems.length - 1; i++) {
      const currentScore = allRoadmapItems[i].priority_score;
      const nextScore = allRoadmapItems[i + 1].priority_score;
      expect(currentScore).toBeGreaterThanOrEqual(nextScore);
    }

    // ============================================================
    // 6. 依存関係のある要件が先行要件の後に配置されているか確認
    // ============================================================
    const roadmapMap = new Map<
      string,
      { index: number; dependencies: string[] }
    >();
    allRoadmapItems.forEach((item, index) => {
      roadmapMap.set(item.requirement_id, {
        index,
        dependencies: item.dependencies || [],
      });
    });

    for (const [reqId, data] of roadmapMap.entries()) {
      for (const depId of data.dependencies) {
        const depData = roadmapMap.get(depId);
        expect(depData).toBeDefined();
        expect(depData!.index).toBeLessThan(data.index);
      }
    }

    // ============================================================
    // 7. スコアが同一である要件の並び順が一貫性を保っているか検証
    // ============================================================
    const scoreGroups = new Map<number, string[]>();
    allRoadmapItems.forEach((item) => {
      if (!scoreGroups.has(item.priority_score)) {
        scoreGroups.set(item.priority_score, []);
      }
      scoreGroups.get(item.priority_score)!.push(item.requirement_id);
    });

    // スコアが同じ要件グループ内で一貫性（例：requirement_id の辞書順）を確認
    for (const [score, reqs] of scoreGroups.entries()) {
      if (reqs.length > 1) {
        const sortedReqs = [...reqs].sort();
        expect(reqs).toEqual(sortedReqs);
      }
    }

    // ============================================================
    // 8. ロードマップに全ての要件が漏れなく反映されているか確認
    // ============================================================
    const roadmapReqIds = new Set(allRoadmapItems.map((r) => r.requirement_id));
    const inputReqIds = new Set(vendorRequirements.map((r) => r.requirement_id));
    expect(roadmapReqIds).toEqual(inputReqIds);

    // ============================================================
    // 9. ロードマップフェーズの妥当性を検証
    // ============================================================
    const phases = result.roadmap.phases;
    expect(phases.length).toBeLessThanOrEqual(4); // 通常4フェーズ: 基盤/コア/連携/最適化

    phases.forEach((phase) => {
      expect(phase.phase_name).toBeDefined();
      expect(phase.requirements).toBeDefined();
      expect(phase.requirements.length).toBeGreaterThan(0);
      expect(phase.estimated_effort_days).toBeGreaterThan(0);
    });

    // ============================================================
    // 10. 最終統計情報の妥当性を検証
    // ============================================================
    expect(result.summary).toBeDefined();
    expect(result.summary.total_requirements).toBe(21);
    expect(result.summary.high_priority_count).toBeGreaterThan(0);
    expect(result.summary.medium_priority_count).toBeGreaterThan(0);
    expect(result.summary.low_priority_count).toBeGreaterThan(0);
    expect(
      result.summary.high_priority_count +
        result.summary.medium_priority_count +
        result.summary.low_priority_count
    ).toBe(21);

    const highPriorityReqs = vendorRequirements.filter(
      (r) => r.priority_level === "high"
    ).length;
    const mediumPriorityReqs = vendorRequirements.filter(
      (r) => r.priority_level === "medium"
    ).length;
    const lowPriorityReqs = vendorRequirements.filter(
      (r) => r.priority_level === "low"
    ).length;

    expect(result.summary.high_priority_count).toBe(highPriorityReqs);
    expect(result.summary.medium_priority_count).toBe(mediumPriorityReqs);
    expect(result.summary.low_priority_count).toBe(lowPriorityReqs);

    expect(result.summary.total_estimated_effort_days).toBeGreaterThan(0);
  });
});