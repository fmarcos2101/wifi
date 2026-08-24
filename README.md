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

## MikroTik

Este projeto usa **MikroTik RouterOS 7** (API REST). O app precisa alcançar o roteador na LAN — o servidor deve ficar no hotel (mini PC, Raspberry Pi, etc.).

Recomendação de equipamento:

- Pousada pequena: **hAP ax2** (roteador + Wi-Fi)
- Hotel com vários APs: **hEX (RB750Gr3)** + access points

No MikroTik:

1. Crie o Hotspot no IP da rede de hóspedes.
2. Libere PAP em **IP → Hotspot → Server Profiles → Login**: `http-pap`.
3. Crie um usuário só para o app (`wifi-app`) com permissão de escrita.
4. Ative o serviço `www` (a REST usa ele).
5. No walled garden, deixe passar o endereço deste app e o do PIX.
6. No `login.html` do Hotspot, redirecione para o app:

```html
<meta http-equiv="refresh" content="0; url=http://IP-DO-APP:3000/?mac=$(mac)&ip=$(ip)&link-login-only=$(link-login-only)">
```

No `.env` do servidor:

```env
NETWORK_PROVIDER=mikrotik
MIKROTIK_HOST=192.168.88.1
MIKROTIK_USER=wifi-app
MIKROTIK_PASSWORD=senha
MIKROTIK_LOGIN_URL=http://10.5.50.1/login
APP_URL=http://IP-DO-APP:3000
```

Quando o pagamento confirma, o app cria `/ip/hotspot/user` com `limit-uptime` (o próprio MikroTik corta o tempo). Encerrar no painel remove o usuário e derruba a sessão ativa.

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
src/lib/network/          MikroTik REST + modo demo
src/lib/payments/         gera a cobrança PIX
```
