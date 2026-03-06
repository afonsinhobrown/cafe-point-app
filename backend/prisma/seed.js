"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcrypt = __importStar(require("bcryptjs"));
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var plans, _i, plans_1, p, trialPlan, restaurantName, restaurant, rId, passwordHash, superAdminPass, existingSuper, adminUserId, existingAdmin, newUser, existingTrial, locations, _a, locations_1, l, locInterna, locEsplanada, tablesData, _b, tablesData_1, t;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log('🌱 Populando a base de dados (SaaS Mode)...');
                    plans = [
                        { name: 'TRIAL', maxUsers: 5, maxTables: 10, maxItems: 50, monthlyPrice: 0 },
                        { name: 'BASIC', maxUsers: 10, maxTables: 50, maxItems: 200, monthlyPrice: 29.90 },
                        { name: 'PRO', maxUsers: 50, maxTables: 200, maxItems: 1000, monthlyPrice: 59.90 }
                    ];
                    _i = 0, plans_1 = plans;
                    _c.label = 1;
                case 1:
                    if (!(_i < plans_1.length)) return [3 /*break*/, 4];
                    p = plans_1[_i];
                    return [4 /*yield*/, prisma.plan.upsert({
                            where: { name: p.name },
                            update: __assign({}, p),
                            create: __assign({}, p)
                        })];
                case 2:
                    _c.sent();
                    _c.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log('✅ Planos SaaS criados.');
                    return [4 /*yield*/, prisma.plan.findUnique({ where: { name: 'TRIAL' } })];
                case 5:
                    trialPlan = _c.sent();
                    restaurantName = 'Café Point Matriz';
                    return [4 /*yield*/, prisma.restaurant.findUnique({
                            where: { slug: 'cafe-point-matriz' }
                        })];
                case 6:
                    restaurant = _c.sent();
                    if (!!restaurant) return [3 /*break*/, 9];
                    return [4 /*yield*/, prisma.restaurant.create({
                            data: {
                                name: restaurantName,
                                slug: 'cafe-point-matriz',
                                ownerName: 'Admin Seed',
                                email: 'admin@cafepoint.com',
                                status: 'ACTIVE'
                            }
                        })];
                case 7:
                    restaurant = _c.sent();
                    if (!trialPlan) return [3 /*break*/, 9];
                    return [4 /*yield*/, prisma.license.create({
                            data: {
                                restaurantId: restaurant.id,
                                planId: trialPlan.id,
                                status: 'ACTIVE'
                            }
                        })];
                case 8:
                    _c.sent();
                    _c.label = 9;
                case 9:
                    rId = restaurant.id;
                    console.log("\u2705 Restaurante '".concat(restaurantName, "' (ID: ").concat(rId, ") garantido."));
                    return [4 /*yield*/, bcrypt.hash('admin123', 10)];
                case 10:
                    passwordHash = _c.sent();
                    return [4 /*yield*/, bcrypt.hash('admin123', 10)];
                case 11:
                    superAdminPass = _c.sent();
                    return [4 /*yield*/, prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } })];
                case 12:
                    existingSuper = _c.sent();
                    if (!!existingSuper) return [3 /*break*/, 14];
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                username: 'superadmin',
                                password: superAdminPass,
                                name: 'Super Administrador',
                                role: 'SUPER_ADMIN',
                                // restaurantId: null opcional
                            }
                        })];
                case 13:
                    _c.sent();
                    console.log('✅ Super Admin (Global) criado: superadmin/admin123');
                    _c.label = 14;
                case 14: return [4 /*yield*/, prisma.user.findFirst({
                        where: {
                            restaurantId: rId,
                            role: 'ADMIN'
                        }
                    })];
                case 15:
                    existingAdmin = _c.sent();
                    if (!!existingAdmin) return [3 /*break*/, 17];
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                username: 'admin',
                                password: passwordHash,
                                name: 'Administrador',
                                role: 'ADMIN',
                                restaurantId: rId
                            }
                        })];
                case 16:
                    newUser = _c.sent();
                    adminUserId = newUser.id;
                    return [3 /*break*/, 18];
                case 17:
                    adminUserId = existingAdmin.id;
                    _c.label = 18;
                case 18: return [4 /*yield*/, prisma.user.findFirst({
                        where: {
                            restaurantId: rId,
                            role: 'WAITER'
                        }
                    })];
                case 19:
                    existingTrial = _c.sent();
                    if (!!existingTrial) return [3 /*break*/, 21];
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                username: 'trial',
                                password: passwordHash,
                                name: 'Usuário Demo',
                                role: 'WAITER',
                                restaurantId: rId
                            }
                        })];
                case 20:
                    _c.sent();
                    _c.label = 21;
                case 21:
                    console.log('✅ Usuários vinculados ao restaurante.');
                    locations = [
                        { name: 'Salão Principal', description: 'Área interna com ar condicionado' },
                        { name: 'Esplanada', description: 'Área externa para fumantes' }
                    ];
                    _a = 0, locations_1 = locations;
                    _c.label = 22;
                case 22:
                    if (!(_a < locations_1.length)) return [3 /*break*/, 25];
                    l = locations_1[_a];
                    return [4 /*yield*/, prisma.location.upsert({
                            where: { name_restaurantId: { name: l.name, restaurantId: rId } },
                            update: { description: l.description },
                            create: {
                                name: l.name,
                                description: l.description,
                                restaurantId: rId
                            }
                        })];
                case 23:
                    _c.sent();
                    _c.label = 24;
                case 24:
                    _a++;
                    return [3 /*break*/, 22];
                case 25: return [4 /*yield*/, prisma.location.findUnique({ where: { name_restaurantId: { name: 'Salão Principal', restaurantId: rId } } })];
                case 26:
                    locInterna = _c.sent();
                    return [4 /*yield*/, prisma.location.findUnique({ where: { name_restaurantId: { name: 'Esplanada', restaurantId: rId } } })];
                case 27:
                    locEsplanada = _c.sent();
                    tablesData = [
                        { number: 1, capacity: 2, locationId: locInterna === null || locInterna === void 0 ? void 0 : locInterna.id, type: 'BAR_COUNTER' },
                        { number: 2, capacity: 4, locationId: locInterna === null || locInterna === void 0 ? void 0 : locInterna.id, type: 'TABLE_4' },
                        { number: 3, capacity: 4, locationId: locInterna === null || locInterna === void 0 ? void 0 : locInterna.id, type: 'TABLE_4' },
                        { number: 4, capacity: 6, locationId: locEsplanada === null || locEsplanada === void 0 ? void 0 : locEsplanada.id, type: 'TABLE_6' },
                        { number: 5, capacity: 2, locationId: locEsplanada === null || locEsplanada === void 0 ? void 0 : locEsplanada.id, type: 'TABLE_2' }
                    ];
                    _b = 0, tablesData_1 = tablesData;
                    _c.label = 28;
                case 28:
                    if (!(_b < tablesData_1.length)) return [3 /*break*/, 31];
                    t = tablesData_1[_b];
                    if (!t.locationId)
                        return [3 /*break*/, 30];
                    return [4 /*yield*/, prisma.table.upsert({
                            where: { number_restaurantId: { number: t.number, restaurantId: rId } },
                            update: {},
                            create: {
                                number: t.number,
                                capacity: t.capacity,
                                locationId: t.locationId,
                                type: t.type,
                                status: 'AVAILABLE',
                                restaurantId: rId
                            }
                        })];
                case 29:
                    _c.sent();
                    _c.label = 30;
                case 30:
                    _b++;
                    return [3 /*break*/, 28];
                case 31:
                    console.log('✅ Mesas criadas.');
                    /*
                    // 6. Criar Itens do Menu (Temporariamente Desativado para garantir estabilidade do Seed Crítico)
                    // ... código comentado ...
                    */
                    console.log('✅ Itens do menu (Pular)');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return prisma.$disconnect(); });
