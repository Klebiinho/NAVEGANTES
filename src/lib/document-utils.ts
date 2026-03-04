import { supabase } from "@/integrations/supabase/client";

export interface DocumentData {
    nome: string;
    rg: string;
    cpf: string;
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    data_assinatura_completa: string;
}

export const generateDocument = async (data: DocumentData) => {
    try {
        const PizZipModule: any = await import("pizzip");
        const PizZip = PizZipModule.default || PizZipModule;

        const DocxtemplaterModule: any = await import("docxtemplater");
        const Docxtemplater = DocxtemplaterModule.default || DocxtemplaterModule;

        // Try to fetch from root or assets
        let templateResp = await fetch("/PROCURACAO.docx");
        if (!templateResp.ok) {
            templateResp = await fetch("/assets/PROCURACAO.docx");
        }

        if (!templateResp.ok) {
            throw new Error(`Não foi possível encontrar o arquivo de template (PROCURACAO.docx). Status: ${templateResp.status}`);
        }

        const templateArrayBuffer = await templateResp.arrayBuffer();

        const zip = new PizZip(templateArrayBuffer);

        // --- XML SANITIZATION ---
        // Some editors might create malformed tags like {{{{...}}}} or }} } 
        // We fix these in all internal XML files before rendering
        Object.keys(zip.files).forEach((filename) => {
            if (filename.endsWith(".xml")) {
                let xmlContent = zip.file(filename).asText();
                const originalXml = xmlContent;

                // Fix: Replace 2 or more braces with exactly 2 to clean up typos like {{{{ or }}}}
                xmlContent = xmlContent.replace(/\{{2,}/g, "{{").replace(/\}{2,}/g, "}}");
                // Fix: Also catch spaced braces that might not be caught by the above
                xmlContent = xmlContent.replace(/\}\s+\}/g, "}}").replace(/\{\s+\{/g, "{{");

                if (xmlContent !== originalXml) {
                    zip.file(filename, xmlContent);
                }
            }
        });

        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: '{{', end: '}}' }
        });

        // Current date parts
        const agora = new Date();
        const meses = [
            "janeiro", "fevereiro", "março", "abril", "maio", "junho",
            "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
        ];

        // Format data to match the exact tags found in the PROCURACAO.docx
        const renderData = {
            dia_geracao: agora.getDate(),
            mes_geracao: meses[agora.getMonth()],
            ano_geracao: agora.getFullYear(),
            nome_cliente: data.nome.toUpperCase(),
            rg_cliente: data.rg,
            cpf_cliente: data.cpf,
            rua_cliente: data.rua,
            numero_cliente: data.numero,
            bairro_cliente: data.bairro,
            cidade_cliente: data.cidade,
            estado_cliente: data.estado,
            cep_cliente: data.cep,
        };

        // Populate docx with the user data
        doc.render(renderData);

        // Export as Blob
        const out = doc.getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        return out;
    } catch (error: any) {
        console.error("Erro CRÍTICO ao gerar DOCX:", error);
        if (error.properties && error.properties.errors instanceof Array) {
            const errorMessages = error.properties.errors
                .map((err: any) => err.properties.explanation)
                .join("\n");
            console.error("Detalhes do erro Docxtemplater:", errorMessages);
        }
        return null;
    }
};

export const generatePDF = async (data: DocumentData) => {
    try {
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const textX = 17.5;
        const textW = 170;
        const rightX = 210 - 22.5;
        const NAVY = [0, 31, 95] as const;

        const getBase64 = async (url: string): Promise<string> => {
            try {
                const r = await fetch(url);
                const b = await r.blob();
                return new Promise((res, rej) => {
                    const fr = new FileReader();
                    fr.onloadend = () => res(fr.result as string);
                    fr.onerror = rej;
                    fr.readAsDataURL(b);
                });
            } catch { return ""; }
        };

        const fundo = await getBase64("/assets/procuracao/fundo.png");
        if (fundo) pdf.addImage(fundo, "PNG", 0, 0, 210, 297);

        pdf.setTextColor(...NAVY);
        const lineH = (pt: number) => pt * 0.352778 * 1.2;

        let y = 91;

        const addPara = (
            text: string,
            pt: number,
            align: "left" | "center" | "right" | "justify" = "justify",
            afterMm = 2
        ) => {
            pdf.setFont("times", "normal");
            pdf.setFontSize(pt);
            const lines: string[] = pdf.splitTextToSize(text, textW);
            if (align === "center") {
                lines.forEach((line: string) => {
                    pdf.text(line, 105, y, { align: "center" });
                    y += lineH(pt);
                });
            } else if (align === "right") {
                lines.forEach((line: string) => {
                    pdf.text(line, rightX, y, { align: "right" });
                    y += lineH(pt);
                });
            } else if (align === "justify") {
                pdf.text(lines, textX, y, { align: "justify", maxWidth: textW });
                y += lines.length * lineH(pt);
            } else {
                pdf.text(lines, textX, y, { align: "left" });
                y += lines.length * lineH(pt);
            }
            y += afterMm;
        };

        addPara("OUTORGANTE:", 13, "left", 0);
        addPara(
            `Nome: ${data.nome}, portador do RG nº: ${data.rg} e CPF nº: ${data.cpf}, residente e domiciliado à ${data.rua}, nº ${data.numero}, Bairro: ${data.bairro}, Cidade: ${data.cidade} – Estado: ${data.estado}, CEP ${data.cep}.`,
            13, "justify", 3
        );

        addPara(
            "HIGOR MONTEIRO NAVEGANTE, brasileiro, portador do RG nº 9234721 e CPF nº 012.318.595-55, residente e domiciliado na Rua L (das Palmeiras), s/n, Bairro Jardim das Palmeiras, Cidade de São João da Barra – RJ, CEP 28.200-000.",
            13, "justify", 2
        );

        addPara(
            "LAURA ALCANTARA NAVEGANTE, brasileira, portadora do RG nº 1.379.319.137 e CPF nº 043.182.195-00, residente e domiciliada na Rua L (das Palmeiras), s/n, Bairro Atafona, Cidade de São João da Barra – RJ, CEP 28.200-000.",
            13, "justify", 3
        );

        addPara("PODERES:", 13, "left", 0);
        addPara(
            "O outorgante confere aos outorgados, em conjunto ou separadamente, poderes especiais para requerer, protocolar, retirar e assinar todos os documentos junto à Agência da Capitania dos Portos em São João da Barra – RJ, bem como para praticar todos os atos necessários ao fiel e integral cumprimento do presente mandato.",
            13, "justify", 8
        );

        addPara(data.data_assinatura_completa, 13, "right", 6);
        y += 4;
        addPara(data.nome, 13, "center", 0);

        return pdf.output("blob");
    } catch (error) {
        console.error("Erro ao gerar documento PDF:", error);
        return null;
    }
};
