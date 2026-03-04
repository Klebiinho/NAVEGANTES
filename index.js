import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Tratamento de Dados (Regras: MAIÚSCULAS, CPF Pontuado, Datas)
function prepararDados(dados) {
    const agora = new Date();
    const meses = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];

    const apenasNumeros = (val) => val.toString().replace(/\D/g, '');

    return {
        ...dados,
        nome: dados.nome.toUpperCase(), // NOME: TUDO MAIUSCULO
        rg: apenasNumeros(dados.rg),    // RG: SO NUMEROS
        // CPF: PONTUADO 000.000.000-00
        cpf: apenasNumeros(dados.cpf).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
        // CEP: 00.000-000
        cep: apenasNumeros(dados.cep).replace(/(\d{2})(\d{3})(\d{3})/, "$1.$2-$3"),

        // Data para o rodapé (Sincronizado com o seu Word)
        dia_geracao: agora.getDate(),
        mes_geracao: meses[agora.getMonth()],
        ano_geracao: agora.getFullYear()
    };
}

function gerarProcuracao(dadosEntrada) {
    try {
        const dados = prepararDados(dadosEntrada);

        // Carrega o modelo
        const content = fs.readFileSync(path.resolve(__dirname, "PROCURACAO.docx"), "binary");
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: "{{", end: "}}" },
            nullGetter: () => ""
        });

        // Preenchimento
        doc.render({
            nome_cliente: dados.nome,
            rg_cliente: dados.rg,
            cpf_cliente: dados.cpf,
            rua_cliente: dados.rua,
            numero_cliente: dados.numero,
            bairro_cliente: dados.bairro,
            cidade_cliente: dados.cidade,
            estado_cliente: dados.estado,
            cep_cliente: dados.cep,
            cidade_assinatura: dados.cidade,
            estado_assinatura: dados.estado,
            dia_geracao: dados.dia_geracao,
            mes_geracao: dados.mes_geracao,
            ano_geracao: dados.ano_geracao
        });

        const buf = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });

        // Guarda na pasta
        fs.writeFileSync(path.resolve(__dirname, `PROCURACAO_${dados.nome}.docx`), buf);
        console.log(`✅ Sucesso! Ficheiro gerado: PROCURACAO_${dados.nome}.docx`);

    } catch (error) {
        console.error("❌ ERRO COMPLETO DO DOCXTEMPLATER:");
        console.log("--- PROPRIEDADES DO ERRO ---");
        console.log(JSON.stringify(error.properties, null, 2));
        console.log("--- STACK TRACE ---");
        console.error(error.stack);

        if (error.properties && error.properties.errors) {
            console.log("--- ERROS DETALHADOS ---");
            error.properties.errors.forEach((err, index) => {
                console.log(`Erro #${index + 1}:`);
                console.log(JSON.stringify(err, null, 2));
                console.log("---");
            });
        }
    }
}

// TESTE: Pode alterar estes dados para testar
gerarProcuracao({
    nome: "Kleber Venancio",
    rg: "12345678",
    cpf: "12345678901",
    rua: "Das Palmeiras",
    numero: "s/n",
    bairro: "Jardim das Palmeiras",
    cidade: "São João da Barra",
    estado: "RJ",
    cep: "28200000"
});
