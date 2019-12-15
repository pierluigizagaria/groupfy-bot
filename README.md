[Groupfy Documento]

Groupfy è un bot telegram che permette agli utenti premium di spotify di creare gruppi di ascolto
in cui gli amici possono mettere in coda, fermare o saltare canzoni tramite il bot.

Facendo partire il bot ci saranno queste opzioni iniziali:

- Connetti Spotify
Il tasto permette la connessione del proprio account spotify al account telegram.
- Crea Gruppo
Permetterà di creare un gruppo fornendo un codice univoco del gruppo
Una funzione implementabile sarebbe quella di interire lo scan di un QR per entrare direttamente nel gruppo.
- Entra in un Gruppo
Sarà chiesto il codice della stanza che una volta inserito permetterà di entrare nel gruppo.


Connessione Spotify:
Il menu di telegram non è aggiornabile tramite eventi esterni. Questo sarebbe implementabile ma richiederebbe
un inutile spreco di tempo. Per ovviare all'auto aggiornamento del menu dopo aver connesso l'account spotify,
aggiorniamo il menu del bot alla pressione del tasto 'Crea Gruppo'.
- Mostrare il link di connessione dell account spotify.


Creare Gruppo:
- Nascondi testo 'Connetti a Spotify' e mostra sottomenu 'Spotify Connesso'
- Controllo se account è stato connesso ed è premium
- Creazione della stanza con nuovo 'Menu Stanza' che mostra il comandoi '/aiuto' per tutti i comandi con tasto 'Chiudi gruppo'


Spotify Connesso:
Nel messaggio sarà inserito il nome utente dell account spotify e lo stato premium dell'account.
I tasti disponibili saranno 'Logout', 'Indietro'

Entra nel Gruppo:
Sarà chiesto al bot di rispondere al messaggio con un codice gruppo.
Se il codice gruppo inserito esiste, mostrare il menu 'Menu Connesso' che mostra il comando /aiuto con il tasto 'Esci dal gruppo'

Comandi Stanza
/play                   Riproduce una canzone con il link o nome dato.
/pause                  Mette in pausa la canzone in riproduzione.
/resume                 Riprende la canzone in riproduzione.
/skip                   Salta la canzone corrente.
/remove                 Rimuove una canzone dalla coda.
/clear                  Pulisce la coda //Solo per creatore della stanza
/queue                  Mostra canzoni in coda
/playing                Mostra la canzone in riproduzione
/disconnect, close      Disconnette o chiude la stanza






