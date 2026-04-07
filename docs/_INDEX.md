# ROVE Chatbot Agent - Indice Documentazione

> **Cos'è questo file:** La mappa completa di tutta la documentazione di progetto. Ogni file è numerato nell'ordine in cui va letto. Se sei un sistema AI (AntiGravity, Cursor, Claude), leggi questo file per primo per capire cosa c'è e dove trovarlo. Se sei un umano, usalo come sommario per navigare i documenti.

---

## Documenti di Progetto

| # | File | Cosa contiene | Quando serve |
|---|------|---------------|-------------|
| 01 | `01_Master_Brief.md` | Brief completo del progetto: obiettivo, stack, architettura, vincoli, anti-goal | Sempre. Contesto iniziale di ogni sessione AI |
| 02 | `02_Risk_and_Constraints.md` | CTO Risk Analysis: rischi architetturali, vincoli tecnici, dipendenze, scalabilità | Quando si creano o validano piani |
| 03 | `03_Shared_KB.md` | Knowledge Base condivisa dell'Astrolabio: identità, contatti, 5 destinazioni, policy, prezzi | Contesto per tutti gli agenti |
| 04 | `04_Discovery_Prompt.md` | System prompt STARS completo di ROVE Discovery | Codice: va nel system message dell'agente Discovery |
| 05 | `05_Discovery_KB.md` | KB verticale Discovery: qualificazione, profiling, handoff | Codice: contesto specifico dell'agente Discovery |
| 06 | `06_Sales_Prompt.md` | System prompt STARS completo di ROVE Sales | Codice: va nel system message dell'agente Sales |
| 07 | `07_Sales_KB.md` | KB verticale Sales: urgency, upsell, obiezioni, closing | Codice: contesto specifico dell'agente Sales |
| 08 | `08_Support_Prompt.md` | System prompt STARS completo di ROVE Support | Codice: va nel system message dell'agente Support |
| 09 | `09_Support_KB.md` | KB verticale Support: procedure operative, escalation, comunicazione | Codice: contesto specifico dell'agente Support |
| 10 | `10_Manager_Prompt.md` | System prompt del Manager Agent: routing rules, logica di switch tra agenti | Codice: il cervello che decide quale agente attivare |

## File nella Root del Progetto

| File | Cosa contiene |
|------|---------------|
| `.antigravity/rules.md` | IDE Rules: naming convention, struttura file, pattern obbligatori/vietati, librerie, sicurezza |
| `README.md` | Panoramica del progetto per GitHub |

---

## Ordine di Lettura Consigliato

1. `01_Master_Brief.md` — per capire cosa stiamo costruendo
2. `02_Risk_and_Constraints.md` — per capire i vincoli e i rischi
3. `03_Shared_KB.md` — per capire i dati reali dell'azienda
4. `10_Manager_Prompt.md` — per capire come funziona il routing
5. `04-09` — per capire i singoli agenti nel dettaglio
