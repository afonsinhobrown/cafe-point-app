import hashlib
import json
import base64
import os
import sys
from datetime import datetime, timedelta

def get_hwid():
    # Simplificado para o exemplo, mas usa o mesmo princípio do JS
    import subprocess
    try:
        cpu = subprocess.check_output('wmic cpu get processorid', shell=True).decode().split('\n')[1].strip()
        return hashlib.sha256(cpu.encode()).hexdigest()[:16].upper()
    except:
        return "GENERIC-HWID"

def create_license_config(days, restaurant_name="Cliente"):
    hwid = get_hwid()
    activation_date = datetime.now().strftime("%Y-%m-%d")
    expiry_date = (datetime.now() + timedelta(days=days)).strftime("%Y-%m-%d")
    
    config_data = {
        "hwid": hwid,
        "activated_at": activation_date,
        "days_limit": days,
        "expiry": expiry_date,
        "client": restaurant_name
    }

    # Gerar os 3 ficheiros de formatos diferentes
    
    # 1. JSON (Configuração Pura)
    with open("license_config.json", "w") as f:
        json.dump(config_data, f, indent=4)
    
    # 2. DAT (Binário/Encodado para o Sistema ler)
    encoded = base64.b64encode(json.dumps(config_data).encode()).decode()
    with open("license_params.dat", "w") as f:
        f.write(encoded)
        
    # 3. SYS (Hidden/Verification file)
    with open(".sys_id", "w") as f:
        f.write(f"ID:{hwid}|EXP:{expiry_date}|SIG:{hashlib.md5(hwid.encode()).hexdigest()}")

    print(f"✅ Ficheiros de definição criados para {days} dias.")
    print(f"HWID: {hwid}")
    print(f"Validade: {expiry_date}")

if __name__ == "__main__":
    dias = int(sys.argv[1]) if len(sys.argv) > 1 else 30
    create_license_config(dias)
