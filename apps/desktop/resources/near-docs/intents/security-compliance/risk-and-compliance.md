> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near-intents.org/llms.txt
> Use this file to discover all available pages before exploring further.

# Risk & Compliance

> How NEAR Intents implements compliance screening and financial integrity measures

At NEAR Intents, we are deeply committed to implementing best practices in compliance and financial integrity. Transparency, accountability, and adherence to international standards are not just regulatory requirements for us they are guiding principles.

Our goal is to ensure that all transactions routed through NEAR Intents are secure, transparent, and fully aligned with global efforts to combat money laundering, sanctions violations, and other forms of financial crime.

For platform security posture and incident controls, see [Proactive Intents Security](https://docs.near-intents.org/security-compliance/proactive-intents-security.md).

## Law Enforcement Requests

For any formal request, law enforcement authorities are required to submit the request and supporting documentation through our designated portal:

[https://app.kodexglobal.com/nearintents/signin](https://app.kodexglobal.com/nearintents/signin)

Please note that we are only able to process requests received through this channel.

If you have any questions, please do not hesitate to contact us.

## Current Implementation

### Real-time compliance screening

NEAR Intents applies automated compliance screening on integrated quote flows against multiple trusted data sources:

> [card] [NEAR Intents AML Portal](https://aml.near-intents.org)
>
> Internal AML screening database

> [card] Binance AML
>
> Exchange-level compliance data

> [card] AMLBot & PureFi
>
> Third-party AML intelligence

> [card] [TRM Labs](https://www.trmlabs.com/)
>
> Enhanced screening for non-dry quotes

These checks identify overlap between addresses in the request and addresses flagged in external databases.

> [!NOTE]
>
> Coverage can vary by flow and integration path. The compliance and Shield stack is expanding toward broader, end-to-end enforcement across additional surfaces.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.