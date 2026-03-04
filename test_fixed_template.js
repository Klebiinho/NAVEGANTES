
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docxPath = path.join(__dirname, 'public', 'PROCURACAO.docx');
const content = fs.readFileSync(docxPath);
const zip = new PizZip(content);

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
    console.log("FINAL SUCCESS: Fixed template parsed and rendered successfully!");
} catch (error) {
    console.log("FINAL FAILURE: Template still broken!");
    console.error(error.message);
    if (error.properties && error.properties.errors) {
        error.properties.errors.forEach(e => console.log(`  -- ${e.properties.explanation} in ${e.properties.file} at offset ${e.properties.offset}`));
    }
}
