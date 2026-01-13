"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLocation = exports.updateLocation = exports.createLocation = exports.getLocations = void 0;
const database_1 = __importDefault(require("../config/database"));
const getLocations = async (req, res) => {
    try {
        const locations = await database_1.default.location.findMany({
            orderBy: { name: 'asc' }
        });
        res.json({
            success: true,
            data: locations
        });
    }
    catch (error) {
        console.error('Erro ao buscar localizações:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
exports.getLocations = getLocations;
const createLocation = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Nome da localização é obrigatório'
            });
        }
        const existing = await database_1.default.location.findUnique({
            where: { name }
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Já existe uma localização com este nome'
            });
        }
        const location = await database_1.default.location.create({
            data: { name, description }
        });
        res.status(201).json({
            success: true,
            data: location,
            message: 'Localização criada com sucesso'
        });
    }
    catch (error) {
        console.error('Erro ao criar localização:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
exports.createLocation = createLocation;
const updateLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const location = await database_1.default.location.update({
            where: { id: parseInt(id) },
            data: { name, description }
        });
        res.json({
            success: true,
            data: location,
            message: 'Localização atualizada com sucesso'
        });
    }
    catch (error) {
        console.error('Erro ao atualizar localização:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
exports.updateLocation = updateLocation;
const deleteLocation = async (req, res) => {
    try {
        const { id } = req.params;
        // Verificar se existem mesas nesta localização
        const tablesCount = await database_1.default.table.count({
            where: { locationId: parseInt(id) }
        });
        if (tablesCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Não é possível deletar uma localização que possui mesas'
            });
        }
        await database_1.default.location.delete({
            where: { id: parseInt(id) }
        });
        res.json({
            success: true,
            message: 'Localização deletada com sucesso'
        });
    }
    catch (error) {
        console.error('Erro ao deletar localização:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
exports.deleteLocation = deleteLocation;
