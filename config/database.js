const sql = require('mssql');
const dotenv = require('dotenv');

dotenv.config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

let poolPromise;

async function connectToDB() {
    if (!poolPromise) {
        poolPromise = sql.connect(config)
            .then(pool => {
                console.log('Conexión establecida correctamente.');
                return pool;
            })
            .catch(err => {
                poolPromise = null;
                console.error('Error al conectar a la base de datos:', err);
                throw err;
            });
    }
    return poolPromise;
}

module.exports = { connectToDB, sql };
