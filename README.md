# Wi-Fi por tempo

Sistema genérico para hotel, pousada ou qualquer rede: o hóspede conecta, escolhe quanto tempo quer, paga, a API de pagamento avisa, e a rede libera só aquele aparelho até o prazo acabar.

## Como funciona

```text
Aparelho entra no Wi-Fi
        ↓
Roteador abre esta página (captive portal)
        ↓
Hóspede escolhe 1h / 3h / 6h / 24h
        ↓
Pagamento PIX (ou outro provedor)
        ↓
API avisa POST /api/payments/webhook  { "status": "paid" }
        ↓
App cria uma sessão com hora de término
        ↓
Controlador da rede libera o aparelho
        ↓
Tempo acaba (ou a recepção encerra) → acesso cai
```

Há duas telas:

- `/` — interface do hóspede: rápida, só escolher tempo e pagar
- `/admin` — painel do hotel: quem está online, valores do dia, preços e liberação na recepção

Senha inicial do painel: `admin`

## Como controlamos o acesso

O app é a **fonte da verdade**. O roteador só executa.

1. Cada pagamento gera uma **sessão** (`Session`) com `deviceMac`, `startedAt` e `endsAt`.
2. Na hora do pagamento confirmado, o app chama um **adaptador de rede** (`grantAccess`).
3. O adaptador fala com o equipamento (MikroTik Hotspot, UniFi, pfSense, RADIUS…). No demo, o adaptador é `mock` e só registra o comando.
4. O próprio roteador corta o acesso quando o tempo acaba (`limit-uptime` no Hotspot). O app também marca a sessão como `EXPIRED` e pode chamar `revokeAccess`.
5. A recepção pode encerrar na hora. Isso chama `revokeAccess` e derruba o aparelho.

O cookie no celular só serve para a tela “Você está online”. **Quem libera a internet é o roteador**, identificando o aparelho pelo MAC (ou usuário do Hotspot).

No equipamento, o captive portal deve:

- redirecionar quem não pagou para esta aplicação
- deixar passar (walled garden) o domínio do app e o do PIX
- receber o usuário/MAC que o app criar com o tempo pago

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

Ou use `paymentRef` no lugar de `orderId`. Em modo demo (`PAYMENT_PROVIDER=mock`) existe o botão **Simular pagamento**.

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

Para simular o captive portal com MAC do aparelho: `http://localhost:3000/?mac=AA:BB:CC:DD:EE:FF`

## Pasta do código

```text
src/app/                  telas do hóspede e do painel
src/app/api/payments/     webhook que confirma o pagamento
src/lib/access.ts         cria, expira e encerra sessões
src/lib/network/          adaptador da rede (mock hoje, MikroTik depois)
src/lib/payments/         gera a cobrança PIX
```
