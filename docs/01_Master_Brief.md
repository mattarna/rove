# ROVE Chatbot Agent - Master Brief

> **Cos'è questo documento:** Il brief completo del progetto. Contiene tutto quello che serve per capire cosa stiamo costruendo, per chi, con quale tecnologia, e quali sono i confini. Ogni sistema AI coinvolto nel progetto (AntiGravity, Claude, ChatGPT) deve leggere questo documento come primo contesto prima di fare qualsiasi cosa.

---

## 1. Obiettivo del Progetto

Costruire un chatbot web per L'Astrolabio, un'agenzia di viaggi italiana premium, che permetta ai visitatori del sito di interagire con un sistema di assistenti AI specializzati. Il chatbot gestisce l'intero percorso del cliente: dalla scoperta delle destinazioni, alla vendita dei pacchetti, fino all'assistenza post-acquisto.

Il sistema è composto da 4 agenti AI:

- **Manager Agent** — legge la conversazione, capisce l'intento dell'utente, e attiva autonomamente l'agente specializzato corretto
- **ROVE Discovery** — qualifica il prospect (budget, stile di viaggio, composizione gruppo) senza mai vendere o quotare prezzi
- **ROVE Sales** — converte i prospect qualificati in prenotazioni, gestendo obiezioni, urgency e upsell
- **ROVE Support** — risolve problemi post-acquisto (voli, hotel, emergenze mediche, documenti)

L'interfaccia web mostra chiaramente quale agente sta parlando in ogni momento, cambiando nome e colore nell'UI.

## 2. Stack Tecnologico

- **Framework:** Next.js (App Router)
- **Frontend:** React con Tailwind CSS
- **Backend:** Next.js API Routes (serverless)
- **LLM:** Il docente usa Claude API (Anthropic). Ogni studente deve dichiarare all'inizio quale API usa tra: Claude API, Gemini API (Google), o GPT API (OpenAI). La scelta impatta le dipendenze e la struttura delle chiamate.
- **Deploy:** Vercel (Git-based deployment)
- **IDE:** Google AntiGravity (AI-assisted IDE)
- **Version Control:** Git

## 3. Architettura di Massima

```
┌─────────────────────────────────┐
│         FRONTEND (React)         │
│  Chat UI con indicatore agente   │
│  Nome + colore cambiano per      │
│  agente attivo                   │
└──────────────┬──────────────────┘
               │ POST /api/chat
               ▼
┌─────────────────────────────────┐
│      API ROUTE (Next.js)         │
│                                  │
│  1. Riceve messaggio + history   │
│  2. MANAGER classifica intent    │
│     → JSON: { agent: "sales" }   │
│  3. Carica system prompt +       │
│     KB dell'agente selezionato   │
│  4. AGENTE genera risposta       │
│  5. Ritorna: { agent, message,   │
│     color }                      │
└──────────────┬──────────────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│DISCOVERY│ │ SALES  │ │SUPPORT │
│ Prompt │ │ Prompt │ │ Prompt │
│  + KB  │ │  + KB  │ │  + KB  │
└────────┘ └────────┘ └────────┘
               │
         ┌─────┘
         ▼
┌─────────────────────────────────┐
│     KNOWLEDGE BASE (file .md)    │
│  Shared KB + 3 Vertical KBs     │
│  Letti a runtime dal server      │
│  Iniettati nel contesto LLM      │
└─────────────────────────────────┘
```

**Flusso per ogni messaggio utente:**

1. Il frontend invia il messaggio + l'intera cronologia della conversazione + l'agente attualmente attivo
2. Il backend chiama il Manager (LLM call leggera, JSON mode) che decide quale agente deve rispondere
3. Il backend carica il system prompt e la KB dell'agente selezionato
4. Il backend chiama l'agente selezionato (LLM call completa, con streaming) passandogli la cronologia e il contesto
5. La risposta viene restituita al frontend con il nome e il colore dell'agente

## 4. Vincoli

- **Tempo:** Il progetto deve essere costruito in circa 4 ore durante una lezione universitaria
- **Competenze:** Gli studenti hanno esperienza media nello sviluppo. Hanno completato Lezione 1 (prompting) e Lezione 2 (costruzione assistenti con KB)
- **Nessun database:** La memoria della conversazione vive nello stato React del frontend (session-based). Se l'utente ricarica la pagina, la conversazione riparte da zero
- **Knowledge Base statica:** I file .md vengono letti dal filesystem del server a runtime. Non c'è RAG, non ci sono embeddings, non c'è vector store
- **API key:** Ogni studente usa la propria API key, configurata in `.env.local`

## 5. Definizione di "Finito"

Il progetto è completo quando:

- L'utente apre la pagina web e vede un chatbot con un messaggio di benvenuto da ROVE Discovery
- L'utente può scrivere messaggi e ricevere risposte in streaming
- Il nome e il colore dell'agente attivo cambiano automaticamente nell'UI in base al contesto della conversazione
- Discovery qualifica l'utente senza mai quotare prezzi, poi passa a Sales
- Sales presenta pacchetti con prezzi reali dalla KB, gestisce obiezioni, e chiude la vendita
- Support si attiva solo quando l'utente menziona un viaggio già acquistato o ha un problema post-acquisto
- Il chatbot è deployato su Vercel e accessibile tramite un URL pubblico

## 6. Anti-Goal

- **Non ci serve autenticazione utente.** Il chatbot è pubblico, non ci sono account o login.
- **Non ci serve un database.** Nessun dato viene persistito tra sessioni. Zero infrastruttura backend oltre Vercel.
- **Non ci serve il supporto multilingua.** Il chatbot risponde in italiano. Le KB sono in inglese ma l'agente comunica in italiano con l'utente.
- **Non stiamo costruendo un pannello admin.** Nessuna dashboard, nessuna interfaccia di configurazione.
- **Non ci serve un sistema di pagamento.** Il chatbot guida alla prenotazione ma non processa transazioni.
- **Non ci serve analytics o tracking.** Nessun sistema di monitoraggio delle conversazioni.
- **Non ci serve il test automatizzato.** La validazione è manuale (conversazione di test in aula).
- **Non stiamo ottimizzando per SEO, performance, o accessibilità avanzata.** È un MVP funzionale per validazione didattica.

---

## Contesto Didattico

Questo progetto è la **Lezione 3** del modulo "Technology for Entrepreneurs" presso H-Farm College (BSc Level 5, 20 crediti). Il caso studio L'Astrolabio attraversa tutte e tre le lezioni con complessità crescente:

- **Lezione 1:** Fondamenti di prompting e task decomposition
- **Lezione 2:** Costruzione manuale di assistenti AI — Knowledge Base condivisa, KB verticali, system prompt STARS, test e meta-prompt
- **Lezione 3 (questa):** Deploy di un sistema multi-agente funzionante come web chatbot, usando un IDE AI-assisted (AntiGravity) con il metodo Plan and Solve

Gli studenti hanno già costruito a mano tutti gli asset che questo chatbot usa (KB, prompt STARS, routing logic). Ora li vedono prendere vita in un prodotto reale deployato.

## Identità Visiva degli Agenti

| Agente | Nome UI | Colore |
|--------|---------|--------|
| Discovery | ROVE Discovery | `#6475FA` (viola) |
| Sales | ROVE Sales | `#E8650A` (arancio) |
| Support | ROVE Support | `#22C55E` (verde) |
