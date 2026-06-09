export class WesenderError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message)
    this.name = "WesenderError"
  }
}

export interface SendEmailOptions {
  from:          string
  to:            string | string[]
  cc?:           string | string[]
  bcc?:          string | string[]
  reply_to?:     string | string[]
  subject:       string
  html?:         string
  text?:         string
  attachments?:  Attachment[]
  tags?:         Record<string, string>
  headers?:      Record<string, string>
  scheduled_at?: string
}

export interface Attachment {
  filename:     string
  content:      string   // base64
  content_type: string
  content_id?:  string   // voor inline afbeeldingen
}

export interface Email {
  id:           string
  from:         string
  to:           string[]
  subject:      string
  status:       "queued" | "sent" | "delivered" | "bounced" | "failed"
  createdAt:    string
  deliveredAt?: string
  bouncedAt?:   string
  openedAt?:    string
}

export interface Domain {
  id:          string
  domain:      string
  spfOk:      boolean
  dkimOk:     boolean
  dmarcOk:    boolean
  verifiedAt?: string
  createdAt:   string
}

export interface DomainCreated extends Domain {
  dnsRecords: {
    spf:   string
    dkim:  string
    dmarc: string
  }
}

export interface ApiKey {
  id:          string
  name:        string
  lastUsedAt?: string
  createdAt:   string
}

export interface ApiKeyCreated extends ApiKey {
  token: string
}

export interface Webhook {
  id:        string
  url:       string
  events:    string[]
  secret:    string
  createdAt: string
}

export type WebhookEvent =
  | "email.delivered"
  | "email.bounced"
  | "email.opened"
  | "email.clicked"
  | "email.failed"

class HttpClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
  ) {}

  private get headers() {
    return {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type":  "application/json",
      "User-Agent":    "wesender-node/1.0.0",
    }
  }

  async get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    const url = new URL(this.baseUrl + path)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
    const res = await fetch(url.toString(), { headers: this.headers })
    return this.parse<T>(res)
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(this.baseUrl + path, {
      method:  "POST",
      headers: this.headers,
      body:    JSON.stringify(body),
    })
    return this.parse<T>(res)
  }

  async delete<T>(path: string): Promise<T> {
    const res = await fetch(this.baseUrl + path, { method: "DELETE", headers: this.headers })
    return this.parse<T>(res)
  }

  private async parse<T>(res: Response): Promise<T> {
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      const b = body as Record<string, string>
      throw new WesenderError(
        b.error ?? b.message ?? `HTTP ${res.status}`,
        res.status,
        b.code ?? "unknown",
      )
    }
    return body as T
  }
}

export class Wesender {
  private readonly http: HttpClient

  constructor(
    apiKey: string,
    options: { baseUrl?: string } = {},
  ) {
    if (!apiKey) throw new Error("API key is verplicht")
    this.http = new HttpClient(apiKey, options.baseUrl ?? "https://api.wesender.nl")
  }

  readonly emails = {
    send: (opts: SendEmailOptions): Promise<{ id: string; status: string }> =>
      this.http.post("/emails", opts),

    sendBatch: (emails: SendEmailOptions[]): Promise<Array<{ id: string; status: string; to: string }>> =>
      this.http.post<{ data: Array<{ id: string; status: string; to: string }> }>("/emails/batch", { emails })
        .then(r => r.data),

    get: (id: string): Promise<Email> =>
      this.http.get<Email>(`/emails/${id}`),

    list: (opts?: { limit?: number }): Promise<Email[]> =>
      this.http.get<{ data: Email[] }>("/emails", opts as Record<string, number>)
        .then(r => r.data),
  }

  readonly domains = {
    list: (): Promise<Domain[]> =>
      this.http.get<{ data: Domain[] }>("/domains").then(r => r.data),

    get: (id: string): Promise<Domain> =>
      this.http.get<Domain>(`/domains/${id}`),

    create: (domain: string): Promise<DomainCreated> =>
      this.http.post("/domains", { domain }),

    delete: (id: string): Promise<{ deleted: boolean }> =>
      this.http.delete(`/domains/${id}`),

    verify: (id: string): Promise<Domain> =>
      this.http.post(`/domains/${id}/verify`, {}),
  }

  readonly apiKeys = {
    list: (): Promise<ApiKey[]> =>
      this.http.get<{ data: ApiKey[] }>("/api-keys").then(r => r.data),

    create: (name: string): Promise<ApiKeyCreated> =>
      this.http.post("/api-keys", { name }),

    delete: (id: string): Promise<{ deleted: boolean }> =>
      this.http.delete(`/api-keys/${id}`),
  }

  readonly webhooks = {
    list: (): Promise<Webhook[]> =>
      this.http.get<{ data: Webhook[] }>("/webhooks").then(r => r.data),

    create: (url: string, events: WebhookEvent[]): Promise<Webhook> =>
      this.http.post("/webhooks", { url, events }),

    delete: (id: string): Promise<{ deleted: boolean }> =>
      this.http.delete(`/webhooks/${id}`),
  }
}
