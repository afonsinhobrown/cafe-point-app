# 🔐 Manual de Produção & Venda - CaféPoint

Este documento reflete o fluxo de trabalho profissional para distribuição via USB.

---

## 🏭 FASE 1 - Fábrica (Preparar Stock)
*Faça isto sempre que quiser criar novas Pen Drives "Virgens" com o sistema.*

1.  **Gerar o Instalador Base (Se ainda não tiver):**
    ```bash
    npx ts-node backend/scripts/build_usb_installer.ts
    ```
    *Isto cria a pasta `cafepoint-installer` no seu PC com o limite de 5 instalações.*

2.  **Duplicar para USBs:**
    *   Formate a Pen Drive.
    *   Copie **todo o conteúdo** da pasta `cafepoint-installer` para a Pen Drive.
    *   *Repita para quantas Pen Drives quiser ter em stock.*

---

## 🤝 FASE 2 - A Venda (Configurar Cliente)
*Faça isto **na hora de entregar** a Pen Drive ao cliente.*

1.  Insira uma das Pen Drives de stock no seu computador (Ex: Letra **E:**).
2.  Defina o tempo de licença para este cliente específico:

    **Comando:** `python backend/scripts/gen_license_encrypted.py <DIAS> <LetraPen>:\`

    **Exemplo (1 Ano):**
    ```bash
    python backend/scripts/gen_license_encrypted.py 365 E:\
    ```

    **Exemplo (Mensal):**
    ```bash
    python backend/scripts/gen_license_encrypted.py 30 E:\
    ```

3.  Ejete a Pen Drive e entregue ao Cliente. 💰

---

## 🤵 FASE 3 - O Cliente (Instalação)
1.  Cliente insere a Pen.
2.  Executa: **`INSTALAR_SISTEMA.bat`**
3.  O sistema instala-se, ativa-se com os dias que definiu, e desconta 1 vida à Pen.
