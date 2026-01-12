const pool = require('./db');

const {faker} = require('@faker-js/faker');

const NUM_RECORDS = 5000;
const BATCH_SIZE = 1000;


async function seedDatabase() {
    const client = await pool.connect();

    try{
        await client.query('Truncate table api_enrichments_seed');
        console.log('Table truncated');
        for (let i = 0; i < NUM_RECORDS; i += BATCH_SIZE) {
            const values = [];
            for(let j=0; j<BATCH_SIZE; j++) {
                const id = faker.string.uuid();
                const id_workspace = faker.string.uuid();
                const workspace_name = faker.company.name().replace(/'/g, "''"); //evitar erro de SQL com apostrofo erro de query por exemplo
                const total_contacts = faker.number.int({min: 5, max: 5000});
                const contact_type = faker.helpers.arrayElement(['PERSON', 'COMPANY']);

                const status = faker.helpers.arrayElement([
                    {weight: 80, item: 'COMPLETED'},
                    {weight: 10, item: 'PROCESSING'},
                    {weight: 10, item: 'FAILED'},
                    {weight: 5, item: 'CANCELED'}                
                ]);

                const created_at = faker.date.past().toISOString();
                const updated_at = faker.date.recent().toISOString();

                values.push(`('${id}', '${id_workspace}', '${workspace_name}', ${total_contacts}, '${contact_type}', '${status.item}', '${created_at}', '${updated_at}')`);
            }
            const query = `INSERT INTO api_enrichments_seed (id, id_workspace, workspace_name,  total_contacts, contact_type, status, created_at, updated_at) VALUES ${values.join(', ')};`;
            await client.query(query);
            console.log(`Inserted records: ${i + BATCH_SIZE}`);
    }
    }
    catch (err) {
        console.error('Error seeding database:', err);
    } finally {
        client.release();
        await pool.end();
    }
}
seedDatabase(); 