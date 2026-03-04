import { createClient } from '@supabase/supabase-js';

const magnavitaUrl = 'https://rqzdorhfdjvsmuwtcbbe.supabase.co';
const magnavitaKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxemRvcmhmZGp2c211d3RjYmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3Mjk2NjksImV4cCI6MjA4NzMwNTY2OX0.tJEp2JeuTFyG6jyGEhI6ERW1GvxyjLE7pnsy11Z3k1Q';

const navUrl = 'https://yqtridrndbpryjgelbir.supabase.co';
const navKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdHJpZHJuZGJwcnlqZ2VsYmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTM3OTYsImV4cCI6MjA4ODE2OTc5Nn0.vLrCQ7pyVO0i0bSxTfIaerzWpKEUpiKbwiI9QrFEFDg';

const magnavita = createClient(magnavitaUrl, magnavitaKey);
const navegantes = createClient(navUrl, navKey);

async function replicate() {
    const tables = ['registros', 'reviews', 'push_subscriptions', 'financeiro'];

    for (const table of tables) {
        console.log(`Replicating table ${table}...`);

        // Fetch all records from magnavita
        let count = 0;
        let keepGoing = true;
        let page = 0;

        while (keepGoing) {
            const { data, error } = await magnavita
                .from(table)
                .select('*')
                .range(page * 1000, (page + 1) * 1000 - 1);

            if (error) {
                console.error(`Error fetching ${table}:`, error);
                break;
            }

            if (data.length === 0) {
                keepGoing = false;
                break;
            }

            const { error: insertError } = await navegantes.from(table).insert(data);
            if (insertError) {
                console.error(`Error inserting ${table}:`, insertError);
                // Sometimes it fails on duplicate ID, ignore or handle
            } else {
                count += data.length;
                console.log(`Inserted ${data.length} rows into ${table} (Total: ${count})`);
            }

            page++;
        }
    }
    console.log('Replication complete!');
}

replicate().catch(console.error);
