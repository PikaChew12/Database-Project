import pg from "pg";
const { Pool } = pg;
import 'dotenv/config';


export const db = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
    //options: "-c search_path=exams",
});

