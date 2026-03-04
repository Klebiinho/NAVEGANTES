const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

try {
    const content = fs.readFileSync('public/PROCURACAO.docx');
    const zip = new PizZip(content);
    Object.keys(zip.files).forEach(f => {
        if (f.endsWith('.xml')) {
            let c = zip.file(f).asText();
            c = c.replace(/\{{2,}/g, '{{').replace(/\}{2,}/g, '}}').replace(/\}\s+\}/g, '}}').replace(/\{\s+\{/g, '{{');
            zip.file(f, c);
        }
    });
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    console.log('Parsed successfully! Variables expected:', doc.getFullText().match(/\{\{.+?\}\}/g));
} catch (e) {
    if (e.properties && e.properties.errors) {
        e.properties.errors.forEach(err => {
            console.error('Docxtemplater Error:', err.message, err.properties.explanation);
        });
    } else {
        console.error('Error:', e.message);
    }
}
