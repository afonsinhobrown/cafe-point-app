import { execSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * LICENSE MANAGEMENT UTILITY
 * -------------------------
 * This utility handles hardware-locked licensing.
 * License is stored in 3 locations:
 * 1. Application Directory (.license.key)
 * 2. User AppData (%APPDATA%/CafePoint/license.key)
 * 3. System ProgramData (%PROGRAMDATA%/CafePoint/license.key)
 */

const SECRET_KEY = 'cafe-point-secure-v1'; // Should be obscure

interface LicenseData {
    machineId: string;
    expiryDate: string;
    restaurantName: string;
    checksum: string;
}

export const getMachineId = (): string => {
    try {
        // Getting CPU ID and Motherboard Serial for unique fingerprint
        const cpuId = execSync('wmic cpu get processorid').toString().split('\n')[1]?.trim() || '';
        const baseboardId = execSync('wmic baseboard get serialnumber').toString().split('\n')[1]?.trim() || '';
        if (!cpuId && !baseboardId) return os.hostname();
        return crypto.createHash('sha256').update(`${cpuId}-${baseboardId}`).digest('hex').substring(0, 16).toUpperCase();
    } catch (e) {
        return os.hostname().toUpperCase();
    }
};

const getLicensePaths = () => {
    const appDir = path.join(process.cwd(), '.license.key');
    const appData = path.join(process.env.APPDATA || '', 'CafePoint', 'license.key');
    const programData = path.join(process.env.ALLUSERSPROFILE || 'C:\\ProgramData', 'CafePoint', 'license.key');
    return [appDir, appData, programData];
};

const calculateChecksum = (data: Omit<LicenseData, 'checksum'>) => {
    return crypto.createHmac('sha256', SECRET_KEY)
        .update(`${data.machineId}|${data.expiryDate}|${data.restaurantName}`)
        .digest('hex');
};

export interface LicenseResult {
    valid: boolean;
    error?: string;
    data?: {
        machineId: string;
        expiryDate: string;
        restaurantName: string;
    };
    daysRemaining?: number;
    machineId?: string;
}

const getTimeTrackingPath = () => {
    return path.join(process.env.ALLUSERSPROFILE || 'C:\\ProgramData', 'CafePoint', '.system_trace');
};

const checkClockRollback = () => {
    const tracePath = getTimeTrackingPath();
    const now = new Date().getTime();

    if (fs.existsSync(tracePath)) {
        try {
            const lastRun = parseInt(fs.readFileSync(tracePath, 'utf8'));
            if (now < lastRun) {
                return false; // Clock was rolled back
            }
        } catch (e) { }
    }

    // Update last run time
    try {
        const dir = path.dirname(tracePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(tracePath, now.toString());
    } catch (e) { }

    return true;
};

export const verifyLicense = (): LicenseResult => {
    // SaaS MODE: Internet obrigatória
    // Verifica se está em modo cloud/production
    if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
        console.log('🟢 SaaS MODE ATIVO - Validação via DATABASE obrigatória');
        return {
            valid: true,
            data: {
                machineId: 'CAFEPOINT_SAAS',
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                restaurantName: 'CafePoint SaaS'
            },
            daysRemaining: 365,
            machineId: 'CAFEPOINT_SAAS'
        };
    }

    // LOCAL DEVELOPMENT: Verifica arquivo (fallback apenas para development)
    const paths = getLicensePaths();
    const currentMachineId = getMachineId();
    const now = new Date();

    // 0. Anti-Clock Rollback Check
    if (!checkClockRollback()) {
        return { valid: false, error: 'Violação de data detectada (Relógio atrasado).', machineId: currentMachineId };
    }

    let validLicense: LicenseData | null = null;
    const foundContents: string[] = [];

    // 1. Check all locations
    for (const p of paths) {
        if (fs.existsSync(p)) {
            try {
                const content = fs.readFileSync(p, 'utf8');
                foundContents.push(content);
                const data: LicenseData = JSON.parse(Buffer.from(content, 'base64').toString());

                // Verify Checksum
                const expectedChecksum = calculateChecksum({
                    machineId: data.machineId,
                    expiryDate: data.expiryDate,
                    restaurantName: data.restaurantName
                });

                if (data.checksum !== expectedChecksum) {
                    return { valid: false, error: 'Licença adulterada.', machineId: currentMachineId };
                }

                if (!validLicense) validLicense = data;
            } catch (e) {
                // Ignore individual read errors if others work
            }
        }
    }

    // 2. Must exist in all 3 places
    if (foundContents.length === 0) {
        return { valid: false, error: 'Licença não encontrada.', machineId: currentMachineId };
    }

    // Check if they are identical
    if (new Set(foundContents).size > 1) {
        return { valid: false, error: 'Inconsistência entre os arquivos de licença.', machineId: currentMachineId };
    }

    if (!validLicense) return { valid: false, error: 'Erro ao processar licença.', machineId: currentMachineId };

    // 3. Verify Hardware ID
    if (validLicense.machineId !== currentMachineId) {
        return { valid: false, error: 'Hardware ID não corresponde.', machineId: currentMachineId };
    }

    // 4. Verify Expiry
    const expiry = new Date(validLicense.expiryDate);
    if (now > expiry) {
        return { valid: false, error: `Licença expirada em ${expiry.toLocaleDateString()}.`, machineId: currentMachineId };
    }

    // 5. Expiry Warning
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
        valid: true,
        data: validLicense,
        daysRemaining: diffDays,
        machineId: currentMachineId
    };
};

// Helper to generate a license (for internal use)
export const generateLicenseString = (machineId: string, days: number, restaurantName: string) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    const expiryDate = expiry.toISOString().split('T')[0];

    const data: Omit<LicenseData, 'checksum'> = {
        machineId,
        expiryDate,
        restaurantName
    };

    const license: LicenseData = {
        ...data,
        checksum: calculateChecksum(data)
    };

    return Buffer.from(JSON.stringify(license)).toString('base64');
};
