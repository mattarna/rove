# ROVE Chatbot Agent - Risk & Constraints Report

> **Cos'è questo documento:** L'analisi dei rischi tecnici e dei vincoli del progetto, prodotta nella fase di CTO Risk Analysis. Identifica tutto quello che puo andare storto prima che si scriva una riga di codice. Ogni piano (Master Plan e Sub-Plan) deve tenere conto di questo documento. Se un rischio non e mitigato in almeno uno sprint, il piano e incompleto.

---

## 1. Rischi Architetturali

### R1 — Context window overflow con conversazioni lunghe
- **Gravita:** MEDIO
- **Quando si manifesta:** Dopo 15-20 scambi di messaggi, la cronologia + Shared KB + Vertical KB + system prompt superano il limite di contesto del modello
- **Mitigazione:** Troncare la cronologia ai messaggi piu recenti (ultimi 20 messaggi). La Shared KB e le Vertical KB sono abbastanza corte da stare nel contesto. Monitorare la lunghezza totale prima di ogni chiamata API

### R2 — Routing del Manager incoerente
- **Gravita:** CRITICO
- **Quando si manifesta:** Quando il Manager switcha agente ad ogni messaggio invece di mantenere la continuita, oppure non switcha quando dovrebbe
- **Mitigazione:** Il Manager riceve sempre l'agente attualmente attivo e ha una regola esplicita: "Non cambiare agente a meno che ci sia un segnale chiaro di cambio di intento". Usare JSON mode per output strutturato e deterministico

### R3 — Latenza doppia chiamata API
- **Gravita:** MEDIO
- **Quando si manifesta:** Ogni messaggio richiede due chiamate LLM (Manager + Agente). Se il modello e lento, l'utente aspetta 5-10 secondi
- **Mitigazione:** Usare il modello piu veloce disponibile per il Manager (es: Gemini Flash, GPT-4o-mini, Claude Haiku). Usare streaming per la risposta dell'agente cosi l'utente vede le parole apparire progressivamente

### R4 — Streaming non supportato o mal configurato
- **Gravita:** MEDIO
- **Quando si manifesta:** Se lo streaming non funziona, il frontend resta vuoto per secondi prima di mostrare la risposta completa
- **Mitigazione:** Usare il Vercel AI SDK (`ai` + provider specifico) che gestisce lo streaming nativamente con il hook `useChat`. Avere un fallback non-streaming che mostra la risposta completa dopo il caricamento

### R5 — API key esposta nel frontend
- **Gravita:** CRITICO
- **Quando si manifesta:** Se l'API key viene inclusa nel codice frontend o in un file committato su Git
- **Mitigazione:** L'API key vive SOLO in `.env.local` (gia nel `.gitignore`). Tutte le chiamate LLM passano dall'API route server-side. Il frontend non fa MAI chiamate dirette al provider LLM

---

## 2. Vincoli Tecnici

- **V1** — Tutte le chiamate LLM passano dall'API route `/api/chat`. Il frontend non chiama mai direttamente il provider LLM.
- **V2** — La Knowledge Base e composta da file `.md` statici nella cartella `/knowledge-base/`. Non ci sono embeddings, vector store, o database.
- **V3** — La conversazione vive nello stato React del frontend. Non viene persistita. Refresh pagina = conversazione persa.
- **V4** — Il Manager Agent usa JSON mode (output strutturato) per garantire routing deterministico e parsabile.
- **V5** — Ogni agente riceve: system prompt + KB condivisa + KB verticale + cronologia conversazione. Nient'altro.
- **V6** — Il file `.env.local` contiene l'API key e non viene mai committato su Git.
- **V7** — Il progetto usa un solo framework (Next.js). Non ci sono microservizi, container, o servizi separati.

---

## 3. Decisioni di Scalabilita

### Memoria conversazione
- **Decisione:** Teniamo semplice — stato React, nessun database
- **Motivazione:** Il progetto e un MVP didattico. Aggiungere un database (Redis, Supabase) raddoppierebbe la complessita senza beneficio per l'esercitazione
- **Punto di rottura:** Se servisse persistenza tra sessioni o storico conversazioni per analytics

### Knowledge Base
- **Decisione:** Teniamo semplice — file .md letti a runtime
- **Motivazione:** La KB dell'Astrolabio e abbastanza piccola da stare nel contesto LLM. Un RAG aggiungerebbe embeddings, vector store, e una pipeline di indicizzazione senza necessita
- **Punto di rottura:** Se la KB superasse i 50.000 token o se servisse ricerca semantica su cataloghi di centinaia di prodotti

### Modello LLM
- **Decisione:** Provider-agnostic nel design, specifico nell'implementazione
- **Motivazione:** Ogni studente sceglie il proprio provider. Il codice deve essere strutturato in modo che cambiare provider richieda la modifica di un solo file (la configurazione del client LLM)
- **Punto di rottura:** Se si usassero feature specifiche di un provider (function calling di OpenAI, tool use di Anthropic) che non hanno equivalente negli altri

---

## 4. Dipendenze Critiche

### Provider LLM API (Claude / Gemini / GPT)
- **Ruolo:** Genera tutte le risposte del chatbot. Senza API, il chatbot non funziona.
- **Rischio:** Rate limiting, API key non valida, servizio down, crediti esauriti
- **Piano B:** Configurare un secondo provider come fallback. In contesto didattico: se un'API non funziona, lo studente switcha al provider alternativo

### Vercel
- **Ruolo:** Hosting e deployment dell'applicazione
- **Rischio:** Deploy fallito, problemi di build, timeout sulle serverless function (default 10s su free tier)
- **Piano B:** Testare in locale con `npm run dev` durante lo sviluppo. Il deploy su Vercel e l'ultimo step. Aumentare il timeout delle function a 30s se necessario

### Vercel AI SDK (`ai` package)
- **Ruolo:** Gestisce streaming delle risposte LLM e hook React (`useChat`)
- **Rischio:** Breaking changes nella libreria, incompatibilita con il provider scelto
- **Piano B:** Implementare streaming manuale con `ReadableStream` se il SDK da problemi. E piu codice ma elimina la dipendenza

---

## 5. Domande Aperte e Risposte

- **D:** Quale modello specifico usare per il Manager (routing)?
- **R:** Il modello piu veloce e economico disponibile nel provider scelto. Per Claude: `claude-haiku`. Per Gemini: `gemini-2.0-flash`. Per GPT: `gpt-4o-mini`. Il Manager non genera testo creativo — classifica e basta.

- **D:** Il chatbot deve rispondere in italiano anche se le KB sono in inglese?
- **R:** Si. Le KB sono in inglese (standard del corso), ma l'agente comunica sempre in italiano con l'utente. Questo va specificato nel system prompt di ogni agente.

- **D:** Cosa succede se lo studente non ha una API key?
- **R:** Ogni studente deve arrivare con la propria API key configurata. Se non ce l'ha, non puo completare l'esercitazione. Comunicare questo prerequisito prima della lezione.
