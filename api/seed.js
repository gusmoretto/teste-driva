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

                const randomPercent = Math.random() * 100; // Gera número entre 0 e 100
                let status;

                if (randomPercent < 60) {
                    status = 'COMPLETED'; // 60% de chance (0 a 59.99)
                } else if (randomPercent < 75) {
                    status = 'PROCESSING'; // 15% de chance (60 a 74.99)
                } else if (randomPercent < 90) {
                    status = 'FAILED';     // 15% de chance (75 a 89.99)
                } else {
                    status = 'CANCELED';   // 10% de chance (resto)
                }

               const createdAt = faker.date.recent({ days: 60 }); // Data nos últimos 60 dias

                 const randomMinutes = Math.floor(Math.random() * 120) + 1; 
                const updatedAt = new Date(createdAt.getTime() + randomMinutes * 60000);

                values.push(`('${id}', '${id_workspace}', '${workspace_name}', ${total_contacts}, '${contact_type}', '${status}', '${createdAt.toISOString()}', '${updatedAt.toISOString()}')`);
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