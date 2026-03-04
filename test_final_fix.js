
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docxPath = path.join(__dirname, 'PROCURACAO.docx');
const content = fs.readFileSync(docxPath);
const zip = new PizZip(content);

// Apply the sanitization fixes
Object.keys(zip.files).forEach((filename) => {
    if (filename.endsWith(".xml")) {
        let xmlContent = zip.file(filename).asText();
        xmlContent = xmlContent.replace(/\{{3,}/g, "{{").replace(/\}{3,}/g, "}}");
        xmlContent = xmlContent.replace(/\}\s+\}/g, "}}").replace(/\{\s+\{/g, "{{");
        zip.file(filename, xmlContent);
    }
});

try {
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
    });
    doc.render({
        dia_geracao: 1, mes_geracao: 'J', ano_geracao: 2026,
        nome_cliente: 'T', rg_cliente: '1', cpf_cliente: '1',
        rua_cliente: 'R', numero_cliente: '1', bairro_cliente: 'B',
        cidade_cliente: 'C', estado_cliente: 'S', cep_cliente: '1'
    });
    console.log("FINAL SUCCESS: Rendering worked with sanitization!");
} catch (error) {
    console.log("FINAL FAILURE: Rendering still failed!");
    console.error(error.message);
}
