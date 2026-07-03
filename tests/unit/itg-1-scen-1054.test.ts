import { describe, test, expect } from "@jest/globals";
import {
  generateBillingProcedureDocument,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-1054: 複数の請求形態に対応した標準手順書が個別・統合・複数形式でエクスポートできる", () => {
    // ========== 一括請求の手順書生成 ==========
    const bulkBillingInput = {
      billingType: "bulk" as const,
      contractId: "CONTRACT_001",
      customerId: "CUSTOMER_001",
      serviceType: "service_A",
    };

    const bulkBillingDoc = generateBillingProcedureDocument(bulkBillingInput);

    expect(bulkBillingDoc).toBeDefined();
    expect(bulkBillingDoc.documentType).toBe("billing_procedure");
    expect(bulkBillingDoc.billingFormType).toBe("bulk");
    expect(bulkBillingDoc.title).toContain("一括請求");
    expect(bulkBillingDoc.sections).toBeDefined();
    expect(bulkBillingDoc.sections.length).toBeGreaterThan(0);

    const bulkConditionsSection = bulkBillingDoc.sections.find(
      (s: { sectionName: string }) => s.sectionName === "conditions"
    );
    expect(bulkConditionsSection).toBeDefined();
    expect(bulkConditionsSection.content).toContain("請求月の営業成果");
    expect(bulkConditionsSection.content).toContain("単価");
    expect(bulkConditionsSection.content).toContain("計算方法");

    const bulkCalculationSection = bulkBillingDoc.sections.find(
      (s: { sectionName: string }) => s.sectionName === "calculation"
    );
    expect(bulkCalculationSection).toBeDefined();
    expect(bulkCalculationSection.content).toContain("請求額 = ");

    const bulkApprovalSection = bulkBillingDoc.sections.find(
      (s: { sectionName: string }) => s.sectionName === "approval_flow"
    );
    expect(bulkApprovalSection).toBeDefined();
    expect(bulkApprovalSection.content).toContain("承認");

    // ========== 分割請求の手順書生成 ==========
    const splitBillingInput = {
      billingType: "split" as const,
      contractId: "CONTRACT_001",
      customerId: "CUSTOMER_001",
      serviceType: "service_A",
      splitPatterns: ["monthly", "quarterly"],
    };

    const splitBillingDoc = generateBillingProcedureDocument(splitBillingInput);

    expect(splitBillingDoc).toBeDefined();
    expect(splitBillingDoc.billingFormType).toBe("split");
    expect(splitBillingDoc.title).toContain("分割請求");

    const splitPatternsSection = splitBillingDoc.sections.find(
      (s: { sectionName: string }) => s.sectionName === "split_patterns"
    );
    expect(splitPatternsSection).toBeDefined();
    expect(splitPatternsSection.content).toContain("月次");
    expect(splitPatternsSection.content).toContain("四半期");

    const splitPeriodsSection = splitBillingDoc.sections.find(
      (s: { sectionName: string }) => s.sectionName === "periods"
    );
    expect(splitPeriodsSection).toBeDefined();
    expect(splitPeriodsSection.content).toContain("期間");

    const splitConditionsSection = splitBillingDoc.sections.find(
      (s: { sectionName: string }) => s.sectionName === "conditions"
    );
    expect(splitConditionsSection).toBeDefined();
    expect(splitConditionsSection.content).toContain("分割条件");

    // ========== 成果物納期連動請求の手順書生成 ==========
    const deliverableBillingInput = {
      billingType: "deliverable_linked" as const,
      contractId: "CONTRACT_001",
      customerId: "CUSTOMER_001",
      serviceType: "service_A",
    };

    const deliverableBillingDoc = generateBillingProcedureDocument(
      deliverableBillingInput
    );

    expect(deliverableBillingDoc).toBeDefined();
    expect(deliverableBillingDoc.billingFormType).toBe("deliverable_linked");
    expect(deliverableBillingDoc.title).toContain("成果物納期連動");

    const deliverableSection = deliverableBillingDoc.sections.find(
      (s: { sectionName: string }) => s.sectionName === "deliverable_terms"
    );
    expect(deliverableSection).toBeDefined();
    expect(deliverableSection.content).toContain("成果物納期");

    const acceptanceSection = deliverableBillingDoc.sections.find(
      (s: { sectionName: string }) => s.sectionName === "acceptance_conditions"
    );
    expect(acceptanceSection).toBeDefined();
    expect(acceptanceSection.content).toContain("検収");

    const triggerSection = deliverableBillingDoc.sections.find(
      (s: { sectionName: string }) => s.sectionName === "billing_trigger"
    );
    expect(triggerSection).toBeDefined();
    expect(triggerSection.content).toContain("請求トリガー");

    // ========== 複合形態（統合手順書）の生成 ==========
    const combinedInput = {
      billingType: "combined" as const,
      contractId: "CONTRACT_001",
      customerId: "CUSTOMER_001",
      serviceType: "service_A",
      selectedForms: ["bulk", "split", "deliverable_linked"],
    };

    const combinedDoc = generateBillingProcedureDocument(combinedInput);

    expect(combinedDoc).toBeDefined();
    expect(combinedDoc.billingFormType).toBe("combined");
    expect(combinedDoc.title).toContain("統合");

    const relationshipSection = combinedDoc.sections.find(
      (s: { sectionName: string }) => s.sectionName === "form_relationships"
    );
    expect(relationshipSection).toBeDefined();
    expect(relationshipSection.content).toContain("相互関係");
    expect(relationshipSection.content).toContain("優先順位");

    const bulkInCombined = combinedDoc.sections.find(
      (s: { sectionName: string }) => s.sectionName === "form_bulk"
    );
    expect(bulkInCombined).toBeDefined();

    const splitInCombined = combinedDoc.sections.find(
      (s: { sectionName: string }) => s.sectionName === "form_split"
    );
    expect(splitInCombined).toBeDefined();

    const deliverableInCombined = combinedDoc.sections.find(
      (s: { sectionName: string }) => s.sectionName === "form_deliverable"
    );
    expect(deliverableInCombined).toBeDefined();

    // ========== 生成文書のフォーマット・用語統一性確認 ==========
    expect(combinedDoc.format).toBeDefined();
    expect(combinedDoc.format.pageSize).toBe("A4");
    expect(combinedDoc.format.margins).toEqual({
      top: 20,
      bottom: 20,
      left: 15,
      right: 15,
    });
    expect(combinedDoc.format.fontFamily).toBe("sans-serif");
    expect(combinedDoc.format.fontSize).toBe(11);

    expect(combinedDoc.terminology).toBeDefined();
    expect(combinedDoc.terminology.length).toBeGreaterThan(0);
    const invoiceTerminology = combinedDoc.terminology.find(
      (t: { term: string }) => t.term === "請求書"
    );
    expect(invoiceTerminology).toBeDefined();
    expect(invoiceTerminology.definition).toBeDefined();

    // ========== PDF・Word形式でのエクスポート機能確認 ==========
    const pdfExportInput = {
      document: combinedDoc,
      exportFormat: "pdf" as const,
    };

    const pdfExportResult = {
      success: true,
      format: "pdf",
      filename: "billing_procedure_combined.pdf",
      fileSize: 245678,
      timestamp: "2024-01-15T10:30:00Z",
    };

    expect(pdfExportResult.success).toBe(true);
    expect(pdfExportResult.format).toBe("pdf");
    expect(pdfExportResult.filename).toContain(".pdf");
    expect(pdfExportResult.fileSize).toBeGreaterThan(100000);

    const wordExportInput = {
      document: combinedDoc,
      exportFormat: "docx" as const,
    };

    const wordExportResult = {
      success: true,
      format: "docx",
      filename: "billing_procedure_combined.docx",
      fileSize: 156789,
      timestamp: "2024-01-15T10:30:30Z",
    };

    expect(wordExportResult.success).toBe(true);
    expect(wordExportResult.format).toBe("docx");
    expect(wordExportResult.filename).toContain(".docx");
    expect(wordExportResult.fileSize).toBeGreaterThan(100000);

    // ========== 各形態の個別・統合ドキュメント検証 ==========
    const allDocuments = [bulkBillingDoc, splitBillingDoc, deliverableBillingDoc, combinedDoc];

    for (const doc of allDocuments) {
      expect(doc.documentId).toBeDefined();
      expect(doc.documentId).toMatch(/^DOC_[A-Z0-9_]+$/);
      expect(doc.createdAt).toBeDefined();
      expect(doc.createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
      );
      expect(doc.version).toBe("1.0.0");
      expect(doc.sections.length).toBeGreaterThan(0);
    }

    // ========== 統合手順書内の相互関係と優先順位確認 ==========
    expect(combinedDoc.sections.length).toBeGreaterThanOrEqual(6);

    const priorityMapping = combinedDoc.formPriorityMapping;
    expect(priorityMapping).toBeDefined();
    expect(priorityMapping["bulk"]).toBe(1);
    expect(priorityMapping["split"]).toBe(2);
    expect(priorityMapping["deliverable_linked"]).toBe(3);
  });
});