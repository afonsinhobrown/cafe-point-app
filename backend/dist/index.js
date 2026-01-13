"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const PORT = process.env.PORT || 5000;
// Conectar à base de dados e iniciar servidor
(0, database_1.connectDatabase)()
    .then(() => {
    app_1.default.listen(PORT, () => {
        console.log(`🚀 Servidor CaféPoint rodando na porta ${PORT}`);
        console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
    });
})
    .catch((error) => {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
});
