import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Setup de Planos Default (Caso banco esteja vazio)
// Setup de Planos Default (Caso banco esteja vazio)
const ensurePlansExist = async () => {
    const trialPlan = await prisma.plan.findUnique({ where: { name: 'TRIAL' } });
    if (!trialPlan) {
        await prisma.plan.create({
            data: {
                name: 'TRIAL',
                maxUsers: 5,
                maxTables: 10,
                maxItems: 50,
                monthlyPrice: 0
            }
        });
    }
};

export const registerRestaurant = async (req: Request, res: Response) => {
    try {
        await ensurePlansExist();
        let {
            restaurantName,
            ownerName,
            email,
            phone,
            password,
            slug,
            adminUsername // Novo campo
        } = req.body;

        // Se não vier username, tenta usar o email. Se não tiver email, erro.
        const finalUsername = adminUsername ? adminUsername.trim() : email;

        if (!finalUsername) {
            return res.status(400).json({ success: false, message: 'É necessário definir um Nome de Usuário ou Email.' });
        }

        // Se email não for fornecido, gerar um dummy único para satisfazer a constraint do DB
        if (!email || email.trim() === '') {
            const randomId = Math.random().toString(36).substring(7);
            email = `no-email-${finalUsername}-${randomId}@system.local`;
        }

        // Validar duplicidade de Username (Global para Login Simples)
        const existingUser = await prisma.user.findFirst({ where: { username: finalUsername } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Este nome de usuário já está em uso.' });
        }

        // Validar duplicidade de Email do Restaurante
        const existingRestEmail = await prisma.restaurant.findUnique({ where: { email } });
        if (existingRestEmail) {
            return res.status(400).json({ success: false, message: 'Este email já está registrado.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const trialPlan = await prisma.plan.findUnique({ where: { name: 'TRIAL' } });

        // Transaction para criar tudo junto
        const result = await prisma.$transaction(async (tx) => {
            // 1. Criar Restaurante
            const restaurant = await tx.restaurant.create({
                data: {
                    name: restaurantName,
                    slug: slug || restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000),
                    ownerName,
                    email,
                    phone,
                    status: 'ACTIVE'
                }
            });

            // 2. Criar Usuário Admin
            const user = await tx.user.create({
                data: {
                    name: ownerName,
                    username: finalUsername, // Usa o username escolhido
                    password: hashedPassword,
                    role: 'ADMIN',
                    restaurantId: restaurant.id
                }
            });

            // 3. Criar Licença
            if (trialPlan) {
                await tx.license.create({
                    data: {
                        restaurantId: restaurant.id,
                        planId: trialPlan.id,
                        startDate: new Date(),
                        endDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 dias de trial
                        status: 'ACTIVE'
                    }
                });
            }

            return { restaurant, user };
        });

        res.status(201).json({
            success: true,
            message: 'Restaurante criado com sucesso!',
            data: {
                restaurantId: result.restaurant.id,
                username: result.user.username
            }
        });

    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ success: false, message: 'Erro ao registrar restaurante.' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password, deviceId, deviceName, restaurantSlug } = req.body;

        console.log(`[AUTH DEBUG] Login attempt for username: '${username}' | Slug: '${restaurantSlug}'`);

        let user;

        if (restaurantSlug) {
            // Busca Específica por Restaurante (Slug)
            const restaurant = await prisma.restaurant.findUnique({ where: { slug: restaurantSlug } });
            if (!restaurant) {
                console.log(`[AUTH DEBUG] Restaurant slug not found: ${restaurantSlug}`);
                return res.status(404).json({ success: false, message: 'Restaurante não encontrado com este código.' });
            }

            user = await prisma.user.findFirst({
                where: { username, restaurantId: restaurant.id },
                include: { restaurant: true }
            });
        } else {
            // Busca Genérica (Pode haver duplicatas)
            const users = await prisma.user.findMany({
                where: { username },
                include: { restaurant: true }
            });

            console.log(`[AUTH DEBUG] Users found finding '${username}': ${users.length}`);

            if (users.length === 0) {
                // Fallback: Tentar buscar por EMAIL se o input parecer um email
                const usersByEmail = await prisma.user.findMany({
                    where: { restaurant: { email: username } }, // Ops, email está no Restaurant, não no User (idealmente). User não tem email?
                    // User não tem campo email no schema atual. O email fica no Restaurant.
                    // Mas o adminUsername pode ter sido setado como email.
                    // Então a busca por 'username' já cobre isso.
                });
                // Se não achou, erro.
                console.log(`[AUTH DEBUG] No user found.`);
                return res.status(401).json({ success: false, message: 'Usuário não encontrado.' });
            }

            if (users.length > 1) {
                console.log(`[AUTH DEBUG] Multiple users found (${users.length}). Requiring slug.`);
                return res.status(400).json({
                    success: false,
                    message: 'Existem múltiplos usuários com este nome. Informe o Código do Restaurante.',
                    requireSlug: true
                });
            }

            user = users[0];
        }

        if (!user) {
            console.log(`[AUTH DEBUG] User not found after slug check.`);
            return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
        }

        // Verificar status do Restaurante (Se aplicável)
        if (user.restaurant && user.restaurant.status !== 'ACTIVE') {
            return res.status(403).json({ success: false, message: 'Conta do restaurante suspensa ou inativa.' });
        }

        // 🔴 VERIFICAÇÃO DE LICENÇA - SaaS Mode (OBRIGATÓRIA NO LOGIN)
        // ⚠️ NÃO verificar para SUPER_ADMIN (precisa acessar para aplicar licenças)
        if (user.role !== 'SUPER_ADMIN' && user.restaurantId) {
            const license = await prisma.license.findUnique({
                where: { restaurantId: user.restaurantId },
                include: { plan: true }
            });

            if (!license) {
                return res.status(403).json({
                    success: false,
                    message: 'Sem licença ativa. Contacte o administrador para ativar a sua conta.',
                    licenseError: true
                });
            }

            // Verificar expiração da licença
            const now = new Date();
            let endDate = license.endDate ? new Date(license.endDate) : null;

            // Compatibilidade com licenças antigas: endDate nulo.
            if (!endDate && license.startDate && license.plan?.duration) {
                endDate = new Date(license.startDate);
                endDate.setDate(endDate.getDate() + license.plan.duration);
            }

            if (!endDate || now > endDate) {
                return res.status(403).json({
                    success: false,
                    message: `Licença expirada em ${endDate ? endDate.toLocaleDateString() : 'data desconhecida'}. Contacte o administrador.`,
                    licenseError: true,
                    expired: true
                });
            }
        }

        // --- GESTÃO DE DISPOSITIVO (NOVO) ---
        if (deviceId && user.restaurantId) {
            const existingDevice = await prisma.device.findFirst({
                where: {
                    restaurantId: user.restaurantId,
                    fingerprint: deviceId
                }
            });

            if (!existingDevice) {
                // Auto-registrar novo dispositivo
                await prisma.device.create({
                    data: {
                        name: deviceName && deviceName.length > 50
                            ? (deviceName.includes('Windows') ? 'PC Windows' : deviceName.includes('Android') ? 'Android Device' : deviceName.includes('iPhone') ? 'iPhone' : 'Dispositivo Web')
                            : (deviceName || `Terminal ${Math.floor(Math.random() * 1000)}`),
                        fingerprint: deviceId,
                        type: 'POS', // Default
                        status: 'PENDING_APPROVAL', // Requer aprovação do Admin
                        restaurantId: user.restaurantId
                    }
                });
                console.log(`[Auto-Device] ${deviceId} registered as PENDING for Restaurant ${user.restaurantId}`);
            } else {
                // Atualizar lastActive
                await prisma.device.update({
                    where: { id: existingDevice.id },
                    data: { lastActiveAt: new Date() }
                });

                // Opcional: Bloquear login se dispositivo estiver Bloqueado/Pendente
                // if (existingDevice.status !== 'AUTHORIZED') {
                //    return res.status(403).json({ success: false, message: 'Dispositivo ainda não autorizado pelo Admin.' });
                // }
            }
        }
        // ------------------------------------

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role,
                restaurantId: user.restaurantId, // ESSENCIAL PARA O SAAS
                name: user.name
            },
            process.env.JWT_SECRET || 'cafe-point-offline-secret-key-2026',
            { expiresIn: '12h' }
        );

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    role: user.role,
                    restaurantId: user.restaurantId,
                    restaurantName: user.restaurant?.name
                }
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user?.id },
            include: { restaurant: true }
        });

        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno' });
    }
};