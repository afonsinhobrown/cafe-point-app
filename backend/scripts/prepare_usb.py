import hashlib
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import base64
import os
import json

KEY = hashlib.sha256(b'cafe-point-ultra-secure-key-2026').digest()

def encrypt_data(data_str):
    cipher = AES.new(KEY, AES.MODE_CBC)
    ct_bytes = cipher.encrypt(pad(data_str.encode(), AES.block_size))
    iv_hex = cipher.iv.hex()
    ct_hex = ct_bytes.hex()
    return f"{iv_hex}:{ct_hex}"

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

def create_usb_master_files(drive_path, installations_allowed=5):
    if not os.path.exists(drive_path):
        print(f"❌ Error: Drive {drive_path} not found")
        return

    # Data to protect
    data = {
        "limit": installations_allowed,
        "created_at": str(os.times())
    }
    
    encrypted = encrypt_data(json.dumps(data))
    
    # Create the 4 tracking files
    filenames = [".sys_vol", ".device_map", "kernel.dat", ".tracker_v1"]
    for f in filenames:
        with open(os.path.join(drive_path, f), "w") as file:
            file.write(encrypted)
            
    print(f"✅ Successfully created 4 tracking files on {drive_path} with {installations_allowed} slots.")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Usage: python prepare_usb.py <drive_letter> <limit>")
    else:
        create_usb_master_files(sys.argv[1], int(sys.argv[2]))
