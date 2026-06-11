# @wesender/wesender-node

Officiële Node.js / TypeScript SDK voor de [WeSender](https://wesender.nl) e-mail API.

## Installatie

```bash
npm install @wesender/wesender-node
# of
bun add @wesender/wesender-node
```

> Zie [wesender.nl/docs/sdks/nodejs](https://wesender.nl/docs/sdks/nodejs) voor GitHub Packages setup.

## Snel aan de slag

```typescript
import { Wesender } from "@wesender/wesender-node"

const ws = new Wesender(process.env.WS_API_KEY!)

// E-mail versturen
const { id } = await ws.emails.send({
  from:    "noreply@joudomein.nl",
  to:      "klant@voorbeeld.nl",
  subject: "Welkom!",
  html:    "<h1>Hallo!</h1><p>Bedankt voor je aanmelding.</p>",
})
console.log("Verstuurd:", id)

// Batch versturen
const results = await ws.emails.sendBatch([
  { from: "noreply@joudomein.nl", to: "a@voorbeeld.nl", subject: "A", html: "<p>A</p>" },
  { from: "noreply@joudomein.nl", to: "b@voorbeeld.nl", subject: "B", html: "<p>B</p>" },
])

// Domeinen bekijken
const domains = await ws.domains.list()
console.log(domains.map(d => d.domain))

// Webhooks aanmaken
const webhook = await ws.webhooks.create(
  "https://jouwapp.nl/webhooks/email",
  ["email.delivered", "email.bounced"],
)
```

## Volledige API

### `ws.emails`

| Methode | Beschrijving |
|---------|-------------|
| `emails.send(opts)` | Verstuur één e-mail |
| `emails.sendBatch(emails[])` | Verstuur meerdere e-mails (max 100) |
| `emails.get(id)` | Haal een e-mail op |
| `emails.list({ limit? })` | Lijst van recente e-mails |

### `ws.domains`

| Methode | Beschrijving |
|---------|-------------|
| `domains.list()` | Alle domeinen |
| `domains.get(id)` | Domein ophalen |
| `domains.create(domain)` | Domein toevoegen + DNS-records |
| `domains.delete(id)` | Domein verwijderen |
| `domains.verify(id)` | DNS-verificatie starten |

### `ws.apiKeys`

| Methode | Beschrijving |
|---------|-------------|
| `apiKeys.list()` | Alle API-keys |
| `apiKeys.create(name)` | Nieuwe key aanmaken |
| `apiKeys.delete(id)` | Key verwijderen |

### `ws.webhooks`

| Methode | Beschrijving |
|---------|-------------|
| `webhooks.list()` | Alle webhooks |
| `webhooks.create(url, events[])` | Webhook aanmaken |
| `webhooks.delete(id)` | Webhook verwijderen |

## Foutafhandeling

```typescript
import { Wesender, WesenderError } from "@wesender/wesender-node"

try {
  await ws.emails.send({ ... })
} catch (err) {
  if (err instanceof WesenderError) {
    console.error(err.message, err.status, err.code)
  }
}
```

## Links

- [Documentatie](https://wesender.nl/docs)
- [API-referentie](https://wesender.nl/docs/api-reference/emails)
- [Changelog](https://wesender.nl/changelog)
- [Issues](https://github.com/wesender/wesender-node/issues)

## Licentie

MIT
