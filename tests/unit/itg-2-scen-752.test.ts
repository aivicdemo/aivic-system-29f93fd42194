import {
  generateExplanationMaterial,
} from "../../src/logic/it-1-br-2-2-2-1";

describe("説明資料自動生成機能 - 相場乖離率0%のグラフレンダリング", () => {
  test("SCEN-752: 相場乖離率が0%のとき説明資料のグラフが適切にレンダリングされる", () => {
    // テストデータ準備：相場乖離率が0%の査定品
    const assessment_item = {
      item_id: "ITEM-001",
      item_name: "型枠工事",
      quantity: 100,
      unit: "m²",
      unit_price: 5000,
      total_amount: 500000,
      market_price: 500000, // 相場金額
      deviation_rate: 0, // 相場乖離率0%
      deviation_amount: 0, // 乖離額0円
      reference_data_count: 25, // 参照過去案件件数
      correction_factor: 1.0, // 補正係数
      assessment_date: "2024-01-15",
    };

    const input_params = {
      assessment_result: {
        assessment_id: "ASSESS-2024-001",
        items: [assessment_item],
        assessment_date: "2024-01-15",
        assessor_name: "山田太郎",
        division: "査定1部",
      },
      reference_market_data: {
        market_source: "物価本2024年1月版",
        region: "関東",
        work_type: "建築工事",
        season: "通常期",
      },
      format_type: "pdf",
    };

    // 説明資料自動生成機能の初期化とモック設定
    const mock_graph_renderer = {
      set_y_axis_range: jest.fn(),
      add_reference_line: jest.fn(),
      set_data_points: jest.fn(),
      add_labels: jest.fn(),
      render: jest.fn(() => ({
        dom_element: document.createElement("div"),
        snapshot_html: "<svg></svg>",
      })),
    };

    // 相場乖離率0%のデータを入力パラメータとして説明資料生成関数に渡す
    const result = generateExplanationMaterial(input_params);

    // グラフレンダリング処理が実行されることを確認
    expect(result).toBeDefined();
    expect(result.material_id).toMatch(/^MATERIAL-\d{4}-/);

    // 生成されたグラフコンポーネントの検証
    expect(result.graphs).toBeDefined();
    expect(result.graphs.length).toBeGreaterThan(0);

    const graph = result.graphs[0];

    // グラフのY軸範囲が適切に設定されていることを検証
    // 相場乖離率0%の場合、Y軸は標準的な範囲（-10%～+10%）に設定される
    expect(graph.y_axis_range).toEqual({
      min: -10,
      max: 10,
      unit: "%",
    });

    // グラフの中央線（基準値）が正しく表示されていることを確認
    expect(graph.reference_line).toEqual({
      position: 0,
      label: "相場金額",
      style: "solid",
    });

    // データポイントがグラフ上に正しく配置されていることを検証
    // 相場乖離率0%なので、データポイントは0の位置に配置される
    expect(graph.data_points).toEqual([
      {
        x_position: "型枠工事",
        y_position: 0,
        value: 500000,
        label: "相場乖離率0%",
      },
    ]);

    // グラフのラベルとタイトルが正しくレンダリングされていることを確認
    expect(graph.title).toBe("項目別相場乖離分析");
    expect(graph.x_axis_label).toBe("見積項目");
    expect(graph.y_axis_label).toBe("相場乖離率（%）");
    expect(graph.legend).toEqual([
      {
        label: "相場金額",
        color: "#0066cc",
      },
      {
        label: "見積金額",
        color: "#ff6600",
      },
    ]);

    // 説明資料全体の構造を検証
    expect(result).toEqual({
      material_id: expect.stringMatching(/^MATERIAL-\d{4}-/),
      assessment_id: "ASSESS-2024-001",
      assessment_date: "2024-01-15",
      assessor_name: "山田太郎",
      division: "査定1部",
      title: "見積査定結果説明資料",
      summary_section: {
        total_amount: 500000,
        market_amount: 500000,
        deviation_amount: 0,
        deviation_rate: 0,
        status: "適正",
      },
      detail_section: {
        items: [
          {
            item_name: "型枠工事",
            quantity: 100,
            unit: "m²",
            unit_price: 5000,
            total_amount: 500000,
            market_price: 500000,
            deviation_rate: 0,
            reference_data_count: 25,
            assessment_judgment: "承認",
          },
        ],
      },
      graphs: [
        {
          graph_id: expect.stringMatching(/^GRAPH-\d{4}-/),
          title: "項目別相場乖離分析",
          x_axis_label: "見積項目",
          y_axis_label: "相場乖離率（%）",
          y_axis_range: {
            min: -10,
            max: 10,
            unit: "%",
          },
          reference_line: {
            position: 0,
            label: "相場金額",
            style: "solid",
          },
          data_points: [
            {
              x_position: "型枠工事",
              y_position: 0,
              value: 500000,
              label: "相場乖離率0%",
            },
          ],
          legend: [
            {
              label: "相場金額",
              color: "#0066cc",
            },
            {
              label: "見積金額",
              color: "#ff6600",
            },
          ],
          render_status: "success",
        },
      ],
      basis_section: {
        market_data_source: "物価本2024年1月版",
        region: "関東",
        work_type: "建築工事",
        season: "通常期",
        reference_count: 25,
      },
      format: "pdf",
      generated_at: "2024-01-15T11:00:00Z",
      snapshot_verified: true,
    });

    // レンダリング後のスナップショット比較
    expect(result.graphs[0].render_status).toBe("success");
    expect(result.snapshot_verified).toBe(true);

    // 相場乖離率0%の場合、グラフの視覚的表現が正しいことを確認
    // グラフの中央線がY軸の0の位置にあることを確認
    expect(result.graphs[0].reference_line.position).toBe(0);

    // データポイントが中央線と一致していることを確認
    expect(
      result.graphs[0].data_points.every((point) => point.y_position === 0)
    ).toBe(true);

    // グラフのステータスが成功であることを確認
    expect(result.graphs[0].render_status).toBe("success");

    // 説明資料の判定結果が「適正」であることを確認
    expect(result.summary_section.status).toBe("適正");

    // 全体スナップショットがエラーなく生成されたことを確認
    expect(result.generated_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
  });
});