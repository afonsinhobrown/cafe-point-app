import hashlib
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad
import base64
import os
import json
import sys

# MESMA CHAVE USADA PELO BACKEND (Ultra Secure)
KEY = hashlib.sha256(b'cafe-point-ultra-secure-key-2026').digest()

def encrypt_data_hex(data_str):
    cipher = AES.new(KEY, AES.MODE_CBC)
    ct_bytes = cipher.encrypt(pad(data_str.encode(), AES.block_size))
    iv_hex = cipher.iv.hex()
    ct_hex = ct_bytes.hex()
    return f"{iv_hex}:{ct_hex}"

from datetime import datetime, timedelta

def create_license_params(days, client_name, output_path):
    # Data de validade do INSTALADOR (USB) = Hoje + 5 Dias
    installer_limit = datetime.now() + timedelta(days=5)
    
    data = {
        "client": client_name,
        "days_limit": days,
        "features": ["all"],
        "max_users": 999,
        "installer_expires": installer_limit.strftime("%Y-%m-%d")
    }
    encrypted = encrypt_data_hex(json.dumps(data))
    
    file_path = os.path.join(output_path, "license_params.dat")
    with open(file_path, "w") as f:
        f.write(encrypted)
    
    print(f"✅ [LICENÇA] Validade Cliente: {days} dias")
    print(f"⏳ [SEGURANÇA] Este instalador USB vai expirar em: {installer_limit.strftime('%Y-%m-%d')}")

def create_tracking_files(output_path, slots):
    current_data = {
        "limit": slots,
        "used": 0,
        "id": base64.b64encode(os.urandom(6)).decode('utf-8')
    }
    
    encrypted_content = encrypt_data_hex(json.dumps(current_data))
    
    files = [".sys_vol", ".device_map", "kernel.dat", ".tracker_v1"]
    
    count = 0
    for filename in files:
        full_path = os.path.join(output_path, filename)
        with open(full_path, "w") as f:
            f.write(encrypted_content)
        
        # Ficheiro gravado com sucesso (Encriptado e Visível)
        pass
        count += 1
            
    print(f"✅ [PROTEÇÃO] Limite de {slots} instalações definido (4 ficheiros criados).")

if __name__ == "__main__":
    days = 0
    install_limit = 0
    output_path = ""
    
    print("==========================================")
    print("   CONFIGURADOR MESTRE CAFEPOINT USB")
    print("==========================================")
    
    # Se receber argumentos, usa-os (para automação se necessário)
    if len(sys.argv) >= 4:
        days = int(sys.argv[1])
        install_limit = int(sys.argv[2])
        output_path = sys.argv[3]
    else:
        # Modo Interativo
        try:
            print("\nPASSO 1: LICENÇA")
            dias_input = input(">> Validade em Dias? (Ex: 365): ")
            days = int(dias_input)
            
            print("\nPASSO 2: HARDWARE")
            limit_input = input(">> Maxima Instalações permitidas? (Ex: 5): ")
            install_limit = int(limit_input)
            
            print("\nPASSO 3: DESTINO")
            output_path = input(">> Letra da Pen Drive? (Ex: E): ").strip()
            
            if len(output_path) == 1 and output_path.isalpha():
                output_path = f"{output_path}:\\"
            elif len(output_path) == 2 and output_path[1] == ":":
                output_path = f"{output_path}\\"
                
        except ValueError:
            print("❌ Erro: Por favor insira números válidos.")
            sys.exit(1)
            
    if not os.path.exists(output_path):
        print(f"⚠️ Aviso: O caminho '{output_path}' não existe.")
        confirm = input("Deseja continuar? (S/N): ")
        if confirm.lower() != 's':
            sys.exit(1)
        try:
            os.makedirs(output_path, exist_ok=True)
        except:
            pass
        
    print(f"\n📝 A configurar Pen Drive em: {output_path}")
    print("------------------------------------------")
    
    try:
        create_license_params(days, "Cliente Final", output_path)
        create_tracking_files(output_path, install_limit)
        print("\n🎉 PEN DRIVE PRONTA PARA VENDA!")
    except Exception as e:
        print(f"❌ Erro ao gravar: {e}")
        
    if len(sys.argv) < 4:
        input("\nPressione ENTER para sair...")
