# Wi-Fi por tempo

Sistema genérico para hotel, pousada ou qualquer rede: o hóspede conecta, escolhe quanto tempo quer, paga, a API de pagamento avisa, e a rede libera só aquele aparelho até o prazo acabar.

## Como funciona

```text
Aparelho entra no Wi-Fi
        ↓
MikroTik abre esta página (captive portal)
        ↓
Hóspede escolhe 1h / 3h / 6h / 24h
        ↓
Pagamento PIX (ou outro provedor)
        ↓
API avisa POST /api/payments/webhook  { "status": "paid" }
        ↓
App cria usuário no Hotspot com limit-uptime
        ↓
Aparelho autentica e navega até o prazo acabar
```

Há duas telas:

- `/` — interface do hóspede: rápida, só escolher tempo e pagar
- `/admin` — painel do hotel: quem está online, valores do dia, preços e liberação na recepção

Senha inicial do painel: `admin`

## Onde cada peça fica

Não precisa de servidor no hotel (nem mini PC, nem Raspberry Pi).

| Peça | Onde |
| --- | --- |
| Site do hóspede, painel e pagamento | Nuvem (VPS) |
| MikroTik **ou** OpenWrt | Só no hotel, como roteador Wi-Fi |
| Celular do hóspede | Entra no Wi-Fi, abre o site na nuvem, depois autentica no portal |

O app na nuvem precisa **falar com o roteador** para liberar/cortar o acesso. O caminho simples, sem abrir a API na internet, é **WireGuard** até o VPS (RouterOS 7 ou OpenWrt).

Não use só Vercel/Netlify para este passo: a API do roteador precisa de um VPS com IP estável (Hostinger, DigitalOcean, Railway, etc.).

## MikroTik

Recomendação de equipamento:

- Pousada pequena: **hAP ax2** (roteador + Wi-Fi)
- Hotel com vários APs: **hEX (RB750Gr3)** + access points
- RouterOS **7** (REST + WireGuard)

No MikroTik:

1. Crie o Hotspot no IP da rede de hóspedes.
2. Libere PAP em **IP → Hotspot → Server Profiles → Login**: `http-pap`.
3. Crie um usuário só para o app (`wifi-app`) com permissão de escrita.
4. Ative o serviço `www` (a REST usa ele).
5. Suba um túnel WireGuard até o VPS e use o IP do túnel como `MIKROTIK_HOST`.
6. No walled garden, deixe passar o domínio do app na nuvem e o do PIX.
   As regras prontas estão em `scripts/mikrotik-walled-garden.rsc` e no painel
   **Internet para pagar**. Sem isso o hóspede não consegue abrir o PIX.
7. No `login.html` do Hotspot, redirecione para o app:

```html
<meta http-equiv="refresh" content="0; url=https://SEU-DOMINIO/?mac=$(mac)&ip=$(ip)&link-login-only=$(link-login-only)">
```

No `.env` do VPS:

```env
NETWORK_PROVIDER=mikrotik
MIKROTIK_HOST=10.8.0.2
MIKROTIK_USER=wifi-app
MIKROTIK_PASSWORD=senha
MIKROTIK_LOGIN_URL=http://10.5.50.1/login
APP_URL=https://SEU-DOMINIO
```

Quando o pagamento confirma, o app cria `/ip/hotspot/user` com `limit-uptime` (o próprio MikroTik corta o tempo). Encerrar no painel remove o usuário e derruba a sessão ativa.

### Internet só para pagar

Até o PIX confirmar, o Hotspot bloqueia a navegação. A regra (walled garden) libera:

- o site deste app
- Mercado Pago / PIX no navegador
- os endereços que o celular usa para abrir a tela de login (Apple/Google)

O restante da internet continua fechado. Cole `scripts/mikrotik-walled-garden.rsc` no Terminal do MikroTik, ou no painel use **Aplicar no MikroTik**.

O app do banco no celular às vezes usa o 4G, não o Wi-Fi. Isso é normal e ajuda o PIX copiar-e-colar.

## OpenWrt

O MikroTik continua suportado. Para usar OpenWrt no lugar, o portal cativo é o **openNDS**.

1. Instale o openNDS no roteador (`scripts/openwrt-opennds.sh`).
2. Cole o walled garden (`scripts/openwrt-walled-garden.sh` ou o bloco do painel).
3. O openNDS abre o app com `clientmac` na URL.
4. No pagamento, o app chama `ndsctl auth <mac> <minutos>` via ubus.
5. No fim do tempo (ou Encerrar no painel), chama `ndsctl deauth`.

No `.env` da nuvem:

```env
NETWORK_PROVIDER=openwrt
OPENWRT_HOST=10.8.0.2
OPENWRT_USER=root
OPENWRT_PASSWORD=senha
APP_URL=https://SEU-DOMINIO
```

O usuário do ubus precisa poder executar arquivo (`file.exec`) para o `ndsctl`. WireGuard até o VPS, igual ao MikroTik.

Para desenvolver sem roteador, mantenha `NETWORK_PROVIDER=mock`.

## Pagamento

O fluxo não depende de um banco específico. Qualquer API que confirme o PIX deve chamar:

```http
POST /api/payments/webhook
Content-Type: application/json

{
  "orderId": "id-do-pedido",
  "status": "paid"
}
```

Em modo demo (`PAYMENT_PROVIDER=mock`) existe o botão **Simular pagamento**.

## Rodar

```bash
cp .env.example .env
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

- Hóspede: [http://localhost:3000](http://localhost:3000)
- Painel: [http://localhost:3000/admin](http://localhost:3000/admin)

Para simular o captive portal: `http://localhost:3000/?mac=AA:BB:CC:DD:EE:FF`

## Pasta do código

```text
src/app/                  telas do hóspede e do painel
src/app/api/payments/     webhook que confirma o pagamento
src/lib/access.ts         cria, expira e encerra sessões
src/lib/network/          MikroTik, OpenWrt/openNDS e modo demo
src/lib/payments/         gera a cobrança PIX
```
