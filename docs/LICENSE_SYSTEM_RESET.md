# Reset Total do Sistema de Licenças Ed25519

Este documento descreve o sistema de licenças resetado e padronizado.

## Formato do Token

O token final tem o formato:
```
LOCIONE1.<payload_base64url>.<signature_base64url>
```

## Assinatura

A mensagem assinada é **EXATAMENTE** os bytes do JSON do payload (string JSON), **não** o base64url e **não** "LOCIONE1...".

A serialização do JSON no servidor (PHP) deve ser:
```php
json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
```

No JavaScript/TypeScript, `JSON.stringify()` já faz isso automaticamente.

## Estrutura do Payload

```typescript
{
  product: "locione-desk",
  plan: "annual" | "lifetime",
  issued_at: string, // ISO 8601 date string
  expires_at: string | null, // ISO 8601 date string ou null (null = sem expiração)
  max_devices: number, // >= 1
  license_id?: string // Opcional
}
```

## Validações

- `product` deve ser `"locione-desk"`
- `max_devices` deve ser >= 1
- `expires_at` null = sem expiração
- `issued_at` deve existir
- Se `expires_at` não for null, deve ser uma data no futuro

## Mensagens de Erro

- "Assinatura inválida"
- "Produto incompatível"
- "Licença expirada"

## Scripts de Referência para Admin_Site (PHP)

Ver os scripts em `docs/Admin_Site_scripts/`:
- `generate-keys.mjs` - Gera par de chaves Ed25519
- `verify-locione.mjs` - Verifica token LOCIONE1
