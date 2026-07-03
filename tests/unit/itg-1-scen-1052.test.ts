import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { generateInvoiceProcessDocument } from "../../src/logic/it-1781935279444-1-1-1";

describe("請求書作成標準手順書生成機能", () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = require("jest-fetch-mock");
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  it("SCEN-1052: 請求書作成標準手順書が全ステップ・チェック項目・判定基準・テンプレートフォーマットを完全に含んで生成される", async () => {
    // ===== 前提条件 =====
    // システムにログイン済みで、請求書作成標準手順書生成機能にアクセス可能
    // 請求書テンプレートが選択可能な状態

    const templateId = "tmpl-invoice-2024-001";
    const invoiceTemplate = {
      id: templateId,
      name: "月次請求書テンプレート_2024年版",
      version: "2.1",
      fields: [
        {
          fieldId: "invoice-number",
          label: "請求書番号",
          type: "text",
          required: true,
          position: { x: 10, y: 20 },
        },
        {
          fieldId: "customer-name",
          label: "顧客名",
          type: "text",
          required: true,
          position: { x: 10, y: 40 },
        },
        {
          fieldId: "invoice-date",
          label: "請求日",
          type: "date",
          required: true,
          position: { x: 150, y: 20 },
        },
        {
          fieldId: "due-date",
          label: "支払期限",
          type: "date",
          required: true,
          position: { x: 150, y: 40 },
        },
        {
          fieldId: "total-amount",
          label: "請求金額",
          type: "currency",
          required: true,
          position: { x: 10, y: 250 },
        },
        {
          fieldId: "line-items",
          label: "明細行",
          type: "table",
          required: true,
          position: { x: 10, y: 80 },
        },
      ],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-15T09:30:00Z",
    };

    const processSteps = [
      {
        stepNumber: 1,
        stepName: "営業データ品質チェック",
        description: "営業システムから抽出された営業データの完全性と正確性を検証",
        checkItems: [
          {
            itemId: "check-1-1",
            itemName: "必須項目の完全性確認",
            criteria: {
              ok: "顧客名、アポ数、成約数、サービス種別のすべてが入力されている",
              ng: "必須項目のいずれかが空白または null である",
            },
          },
          {
            itemId: "check-1-2",
            itemName: "データ型の正確性確認",
            criteria: {
              ok: "各項目が指定データ型（数値、文字列、日付等）に一致している",
              ng: "データ型が不一致（例：数値フィールドに文字列が入力されている）",
            },
          },
          {
            itemId: "check-1-3",
            itemName: "金額異常値検出",
            criteria: {
              ok:
                "請求額が契約上の最小額以上、最大額以下の範囲内に収まっている",
              ng: "請求額が設定範囲外（負数、またはビジネスルール上の上限超過）",
            },
          },
        ],
        estimatedDurationMinutes: 15,
      },
      {
        stepNumber: 2,
        stepName: "契約内容・割引基準の確認",
        description:
          "月次請求対象の契約一覧と各契約に適用される割引基準を確認",
        checkItems: [
          {
            itemId: "check-2-1",
            itemName: "請求対象契約の有効期間確認",
            criteria: {
              ok: "契約の開始日が月初以前、終了日が月末以降である（または無期限）",
              ng: "契約の有効期間が当月と重複していない",
            },
          },
          {
            itemId: "check-2-2",
            itemName: "割引基準の適用可否判定",
            criteria: {
              ok:
                "営業成果が割引適用条件を満たしており、割引率が正確に計算される",
              ng: "割引条件の判定が不正確または割引率が手動入力で設定されている",
            },
          },
        ],
        estimatedDurationMinutes: 10,
      },
      {
        stepNumber: 3,
        stepName: "請求額計算・例外パターン判定",
        description:
          "顧客ごと・サービスごとの請求額を計算し、例外パターンを判定",
        checkItems: [
          {
            itemId: "check-3-1",
            itemName: "基本料金・成果報酬の計算確認",
            criteria: {
              ok: "基本料金＋成果報酬＝請求額が正確に計算されている",
              ng:
                "計算式が不正確または計算ロジックが手動修正されている（監査証跡がない）",
            },
          },
          {
            itemId: "check-3-2",
            itemName: "割引額の計算検証",
            criteria: {
              ok:
                "割引額＝請求額×割引率が正確に計算され、请求額から正確に差引かれている",
              ng: "割引計算が誤っている、または割引が二重計上されている",
            },
          },
          {
            itemId: "check-3-3",
            itemName: "最小請求額・上限超過判定",
            criteria: {
              ok:
                "計算済み請求額が契約で定義された最小額以上、上限以下である",
              ng: "最小額未満または上限超過の請求額が検出されている",
            },
          },
        ],
        estimatedDurationMinutes: 20,
      },
      {
        stepNumber: 4,
        stepName: "請求書フォーマット・必須項目確認",
        description:
          "請求書テンプレートのフィールド配置、必須項目、入力形式が正確に反映されているか確認",
        checkItems: [
          {
            itemId: "check-4-1",
            itemName: "テンプレートフィールドの完全性確認",
            criteria: {
              ok:
                "テンプレートに定義されたすべてのフィールド（請求書番号、顧客名、請求日、支払期限、請求金額、明細行）が請求書に正確に配置されている",
              ng: "テンプレートのフィールドの一部が欠落、または位置がずれている",
            },
          },
          {
            itemId: "check-4-2",
            itemName: "必須項目への値入力確認",
            criteria: {
              ok:
                "すべての必須フィールド（請求書番号、顧客名、請求日、支払期限、請求金額、明細行）に有効な値が入力されている",
              ng: "必須フィールドの一つ以上が空白、null、または無効な値である",
            },
          },
          {
            itemId: "check-4-3",
            itemName: "フィールド配置・レイアウト検証",
            criteria: {
              ok:
                "各フィールドが テンプレートで定義された座標（x, y）に正確に配置されている",
              ng: "フィールドがテンプレート定義と異なる位置に配置されている",
            },
          },
          {
            itemId: "check-4-4",
            itemName: "入力形式の整合性確認",
            criteria: {
              ok:
                "テキスト項目は文字列、数値項目は整数または小数、日付項目は ISO 8601 形式、通貨項目は 2 桁小数点の整数である",
              ng:
                "入力形式がフィールド定義と不一致（例：通貨フィールドに 3 桁小数、日付フィールドに不正な形式）",
            },
          },
        ],
        estimatedDurationMinutes: 15,
      },
      {
        stepNumber: 5,
        stepName: "請求書最終確認・承認",
        description: "生成済み請求書の全内容を確認し、最終承認を実施",
        checkItems: [
          {
            itemId: "check-5-1",
            itemName: "請求書全体の一貫性確認",
            criteria: {
              ok:
                "請求書内のすべての値（顧客名、請求金額、明細行合計）が一致しており、矛盾がない",
              ng: "数値の不一致（例：明細行の合計が請求金額と異なる）、または顧客情報が誤っている",
            },
          },
          {
            itemId: "check-5-2",
            itemName: "計算根拠の監査ログ確認",
            criteria: {
              ok:
                "請求額計算に使用された営業データ、契約条件、割引ルール、計算式が監査ログに記録されている",
              ng:
                "計算根拠が未記録、または記録不完全（どの営業データから計算されたか特定できない）",
            },
          },
          {
            itemId: "check-5-3",
            itemName: "前月請求額との差分検証",
            criteria: {
              ok:
                "今月請求額と前月請求額の差分が営業成果の変化と合理的に説明できる",
              ng:
                "差分が異常（例：成果実績に大幅な変動がないのに請求額が急変）",
            },
          },
        ],
        estimatedDurationMinutes: 20,
      },
    ];

    const documentMetadata = {
      documentTitle: "請求書作成業務 標準手順書",
      documentVersion: "1.2",
      createdDate: "2024-01-15T10:00:00Z",
      lastUpdatedDate: "2024-01-15T10:00:00Z",
      author: "営業オペレーション部",
      templateApplied: templateId,
      totalPages: 12,
      format: "PDF",
    };

    // API モック: 請求書テンプレート取得
    fetchMock.mockResponseOnce(JSON.stringify(invoiceTemplate), {
      status: 200,
    });

    // API モック: 請求書作成プロセスステップ取得
    fetchMock.mockResponseOnce(JSON.stringify(processSteps), {
      status: 200,
    });

    // API モック: 標準手順書生成実行
    fetchMock.mockResponseOnce(
      JSON.stringify({
        documentId: "doc-stdproc-invoice-20240115-001",
        status: "completed",
        metadata: documentMetadata,
        downloadUrl:
          "https://api.example.com/documents/doc-stdproc-invoice-20240115-001/download",
        generatedAt: "2024-01-15T10:05:30Z",
      }),
      { status: 200 }
    );

    // ===== 処理実行 =====
    const generatedDocument = await generateInvoiceProcessDocument({
      templateId: templateId,
      targetProcess: "invoice_creation",
      includeCheckItems: true,
      includeJudgmentCriteria: true,
      includeTemplateFormat: true,
      outputFormat: "PDF",
    });

    // ===== 期待値検証 =====

    // (1) 請求書作成の全ステップが漏れなく記載されていることを確認
    expect(generatedDocument.processSteps).toBeDefined();
    expect(generatedDocument.processSteps.length).toBe(5);

    expect(generatedDocument.processSteps[0].stepNumber).toBe(1);
    expect(generatedDocument.processSteps[0].stepName).toBe(
      "営業データ品質チェック"
    );

    expect(generatedDocument.processSteps[1].stepNumber).toBe(2);
    expect(generatedDocument.processSteps[1].stepName).toBe(
      "契約内容・割引基準の確認"
    );

    expect(generatedDocument.processSteps[2].stepNumber).toBe(3);
    expect(generatedDocument.processSteps[2].stepName).toBe(
      "請求額計算・例外パターン判定"
    );

    expect(generatedDocument.processSteps[3].stepNumber).toBe(4);
    expect(generatedDocument.processSteps[3].stepName).toBe(
      "請求書フォーマット・必須項目確認"
    );

    expect(generatedDocument.processSteps[4].stepNumber).toBe(5);
    expect(generatedDocument.processSteps[4].stepName).toBe(
      "請求書最終確認・承認"
    );

    // (2) 各ステップに対するチェック項目が適切に定義されていることを確認
    const step1CheckItems = generatedDocument.processSteps[0].checkItems;
    expect(step1CheckItems).toBeDefined();
    expect(step1CheckItems.length).toBe(3);
    expect(step1CheckItems[0].itemName).toBe("必須項目の完全性確認");
    expect(step1CheckItems[1].itemName).toBe("データ型の正確性確認");
    expect(step1CheckItems[2].itemName).toBe("金額異常値検出");

    const step3CheckItems = generatedDocument.processSteps[2].checkItems;
    expect(step3CheckItems.length).toBe(3);
    expect(step3CheckItems[0].itemName).toBe("基本料金・成果報酬の計算確認");
    expect(step3CheckItems[1].itemName).toBe("割引額の計算検証");
    expect(step3CheckItems[2].itemName).toBe("最小請求額・上限超過判定");

    // (3) 各チェック項目の判定基準（合格・不合格条件）が明確に示されていることを確認
    const checkItem1_1 = step1CheckItems[0];
    expect(checkItem1_1.criteria).toBeDefined();
    expect(checkItem1_1.criteria.ok).toBe(
      "顧客名、アポ数、成約数、サービス種別のすべてが入力されている"
    );
    expect(checkItem1_1.criteria.ng).toBe(
      "必須項目のいずれかが空白または null である"
    );

    const checkItem3_3 = step3CheckItems[2];
    expect(checkItem3_3.criteria.ok).toBe(
      "計算済み請求額が契約で定義された最小額以上、上限以下である"
    );
    expect(checkItem3_3.criteria.ng).toBe(
      "最小額未満または上限超過の請求額が検出されている"
    );

    // (4) 請求書テンプレートのフォーマット仕様が正確に反映されていることを確認
    const step4CheckItems = generatedDocument.processSteps[3].checkItems;
    expect(step4CheckItems.length).toBe(4);
    expect(step4CheckItems[0].itemName).toBe(
      "テンプレートフィールドの完全性確認"
    );

    // テンプレートの必須フィールド数を確認（請求書番号、顧客名、請求日、支払期限、請求金額、明細行 = 6）
    const requiredFieldsCount = invoiceTemplate.fields.filter(
      (f: any) => f.required
    ).length;
    expect(requiredFieldsCount).toBe(6);

    const templateCheckItem = step4CheckItems[0];
    expect(templateCheckItem.criteria.ok).toContain("請求書番号");
    expect(templateCheckItem.criteria.ok).toContain("顧客名");
    expect(templateCheckItem.criteria.ok).toContain("請求日");
    expect(templateCheckItem.criteria.ok).toContain("支払期限");
    expect(templateCheckItem.criteria.ok).toContain("請求金額");
    expect(templateCheckItem.criteria.ok).toContain("明細行");

    // フィールド配置の検証
    const fieldPositionCheckItem = step4CheckItems[2];
    expect(fieldPositionCheckItem.itemName).toBe(
      "フィールド配置・レイアウト検証"
    );
    expect(fieldPositionCheckItem.criteria.ok).toContain("座標（x, y）");

    // 入力形式の検証
    const inputFormatCheckItem = step4CheckItems[3];
    expect(inputFormatCheckItem.itemName).toBe("入力形式の整合性確認");
    expect(inputFormatCheckItem.criteria.ok).toContain("ISO 8601 形式");
    expect(inputFormatCheckItem.criteria.ok).toContain("2 桁小数点");

    // (5) 生成された文書が形式的エラーなく完全に表示・ダウンロード可能であることを確認
    expect(generatedDocument.documentMetadata).toBeDefined();
    expect(generatedDocument.documentMetadata.documentTitle).toBe(
      "請求書作成業務 標準手順書"
    );
    expect(generatedDocument.documentMetadata.documentVersion).toBe("1.2");
    expect(generatedDocument.documentMetadata.totalPages).toBe(12);
    expect(generatedDocument.documentMetadata.format).toBe("PDF");

    expect(generatedDocument.downloadUrl).toBeDefined();
    expect(generatedDocument.downloadUrl).toMatch(/\/download$/);

    expect(generatedDocument.generatedAt).toBe("2024-01-15T10:05:30Z");

    // 生成完了ステータスが正常終了として記録されていることを確認
    expect(generatedDocument.status).toBe("completed");
    expect(generatedDocument.errors).toEqual([]);

    // ドキュメント全体の構成完全性を確認
    expect(generatedDocument.processSteps).toHaveLength(5);
    expect(generatedDocument.processSteps.every((step: any) => step.stepNumber))
      .toBe(true);
    expect(generatedDocument.processSteps.every((step: any) => step.stepName))
      .toBe(true);
    expect(
      generatedDocument.processSteps.every((step: any) => step.checkItems)
    ).toBe(true);
    expect(
      generatedDocument.processSteps.every(
        (step: any) =>
          step.checkItems.every((item: any) => item.criteria && item.criteria.ok && item.criteria.ng)
      )
    ).toBe(true);

    // 総ページ数と実際のコンテンツ量が合致していることを確認（簡易チェック）
    const totalCheckItems = generatedDocument.processSteps.reduce(
      (sum: number, step: any) => sum + step.checkItems.length,
      0
    );
    expect(totalCheckItems).toBe(14); // 3 + 2 + 3 + 4 + 2 = 14
    expect(generatedDocument.documentMetadata.totalPages).toBeGreaterThanOrEqual(
      10
    );
  });
});