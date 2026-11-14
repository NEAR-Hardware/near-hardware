> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near-intents.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Reusable deposit addresses

> Permanent deposit addresses for a user, created and read through the 1Click Swap API.

Give a user a set of deposit addresses they can keep. They save the addresses in a wallet or on an exchange and send to them whenever they want. Each deposit is its own row in their history, and they receive the coin they sent.

Ethereum, Arbitrum, Base, and the other EVM chains share one address. Solana, Bitcoin, and every other chain have an address in that chain's format. When an entry includes `memo`, the sender has to include that memo.

One user has one set of addresses for now. Several sets per user are planned. Anyone can send to the addresses. Reading them requires that user's session.

Funds can settle to a confidential balance. The request for that is in [Confidential balance](#confidential-balance).

## Authenticate

Send both headers on `GET /v0/quotes` and `POST /v0/quote`.

```bash theme={null}
Authorization: Bearer <user session JWT>
X-API-Key: <partner API key>
```

| Header | Required for | If you leave it off |
| - | - | - |
| `X-API-Key` | Your app. The key comes from the [Partner Dashboard](https://partners.near-intents.org/). | `POST /v0/quote` is rejected. |
| `Authorization` | The user who owns the address. The session comes from [`POST /v0/auth/authenticate`](https://docs.near-intents.org/api-reference/user-auth/authenticate-user-with-signed-data). | The call can still succeed. The new address has no owner, and `GET /v0/quotes` with that user's session does not return it. |

Send the user session on the create. That is what makes the next list, for the same user, return these addresses.

## Find an address

`GET /v0/quotes` is provisional. The response shape can change.

```bash theme={null}
curl "https://1click.chaindefuser.com/v0/quotes?filter[swapType]=ANY_INPUT" \
  -H "Authorization: Bearer USER_SESSION_JWT" \
  -H "X-API-Key: PARTNER_API_KEY"
```

Use the item whose `attributes.originAsset` is `1cs_v1:any` and whose `attributes.destinationAsset` is `1cs_v1:original`. If it is not on this page, request `links.next` until `links.next` is `null`.

Show the user `attributes.chainDepositAddresses`, one address per chain. `depositAddress` on this quote is the internal 1Click account. The same address list comes back on create, under `quote.chainDepositAddresses`. An example is below.

## Create an address

Create only when the list above has no matching item.

`slippageTolerance` is in basis points (`50` = 0.5%). Set `deadline` to `2038-01-01T00:00:00.000Z` exactly. A deadline taken from the current time expires the address.

```bash theme={null}
curl -X POST https://1click.chaindefuser.com/v0/quote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_SESSION_JWT" \
  -H "X-API-Key: PARTNER_API_KEY" \
  -d '{
    "dry": false,
    "swapType": "ANY_INPUT",
    "originAsset": "1cs_v1:any",
    "depositType": "INTENTS",
    "destinationAsset": "1cs_v1:original",
    "amount": "0",
    "slippageTolerance": 50,
    "recipient": "<user account>",
    "recipientType": "INTENTS",
    "refundTo": "<user account>",
    "refundType": "INTENTS",
    "deadline": "2038-01-01T00:00:00.000Z"
  }'
```

Read the addresses from `quote.chainDepositAddresses`. A create response looks like this. Other quote fields are left out. The addresses are examples.

```json theme={null}
{
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "quote": {
    "depositAddress": "internal-account.near",
    "chainDepositAddresses": [
      {
        "blockchain": "eth",
        "address": "0x76b4c56085ED136a8744D52bE956396624a730E8"
      },
      {
        "blockchain": "base",
        "address": "0x76b4c56085ED136a8744D52bE956396624a730E8"
      },
      {
        "blockchain": "sol",
        "address": "SoLanaExampleDepositAddress1111111111111111111"
      },
      {
        "blockchain": "stellar",
        "address": "GEXAMPLESTELLARDEPOSITADDRESS",
        "memo": "1111111"
      }
    ]
  }
}
```

`eth` and `base` share one address because both are EVM. Show each chain's `address`. When `memo` is present, the sender includes it. Leave `depositAddress` off the screen you show the user.

The list response puts that same array on each matching item. The array below is shortened to the envelope.

```json theme={null}
{
  "data": [
    {
      "type": "quotes",
      "attributes": {
        "originAsset": "1cs_v1:any",
        "destinationAsset": "1cs_v1:original",
        "depositAddress": "internal-account.near",
        "chainDepositAddresses": [
          {
            "blockchain": "eth",
            "address": "0x76b4c56085ED136a8744D52bE956396624a730E8"
          }
        ]
      }
    }
  ],
  "links": {
    "next": null
  }
}
```

If two creates for the same user overlap, one succeeds and the other returns HTTP 400. The 400 body is a `message` string, with no `errorCode`. List the user's quotes again and use the address that is already there.

## Confidential balance

Use the same create request. Set `recipientType` to `CONFIDENTIAL_INTENTS` and `confidentiality` to `"basic"`. Leave `depositType` as `INTENTS`. Other people cannot see who owns the address.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.