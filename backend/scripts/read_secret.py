import hashlib
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import base64
import os
import sys

# MESMA CHAVE USADA PELOS OUTROS SCRIPTS
KEY = hashlib.sha256(b'cafe-point-ultra-secure-key-2026').digest()

def decrypt_data(encrypted_str):
    try:
        iv_b64, ct_b64 = encrypted_str.split(':')
        iv = base64.b64decode(iv_b64)
        ct = base64.b64decode(ct_b64)
        cipher = AES.new(KEY, AES.MODE_CBC, iv)
        pt = unpad(cipher.decrypt(ct), AES.block_size)
        return pt.decode('utf-8')
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python read_secret.py <file_path>")
    else:
        file_path = sys.argv[1]
        if os.path.exists(file_path):
            with open(file_path, "r") as f:
                content = f.read()
                print("--- Conteúdo Decifrado ---")
                print(decrypt_data(content))
                print("--------------------------")
        else:
            print("Ficheiro não encontrado.")
