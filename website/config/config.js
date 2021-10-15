require("dotenv").config();
module.exports = {
    // production
    production: {
        // alterar apenas username, password, database e host
        username: "username",
        password: "password",
        database: "database",
        host: "host",
        dialect: "mssql",
        xuse_env_variable: "DATABASE_URL",
        dialectOptions: {
            options: {
                encrypt: true,
            },
        },
        pool: {
            max: 5,
            min: 1,
            acquire: 5000,
            connectTimeout: 5000,
        },
    },

    // dev / banco local
    dev: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: "localhost",
        dialect: "mysql",
        xuse_env_variable: "DATABASE_URL",
        dialectOptions: {
            options: {
                encrypt: true,
            },
        },
        pool: {
            max: 5,
            min: 1,
            acquire: 5000,
            idle: 30000,
            connectTimeout: 5000,
        },
    },
};