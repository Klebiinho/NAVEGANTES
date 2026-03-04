
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docxPath = path.join(__dirname, 'PROCURACAO.docx');
const content = fs.readFileSync(docxPath);

try {
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
    });

    const renderData = {
        dia_geracao: 1,
        mes_geracao: 'Janeiro',
        ano_geracao: 2026,
        nome_cliente: 'TESTE',
        rg_cliente: '123',
        cpf_cliente: '123',
        rua_cliente: 'RUA',
        numero_cliente: '123',
        bairro_cliente: 'BAIRRO',
        cidade_cliente: 'CIDADE',
        estado_cliente: 'ESTADO',
        cep_cliente: '123',
    };

    doc.render(renderData);
    console.log("Rendering SUCCESSFUL in Node!");
} catch (error) {
    console.log("Rendering FAILED in Node!");
    console.error(error);
    if (error.properties && error.properties.errors instanceof Array) {
        error.properties.errors.forEach(err => {
            console.log(`-- ERROR: ${err.properties.explanation}`);
            console.log(JSON.stringify(err.properties, null, 2));
        });
    }
}
