# Frontend (React + TypeScript + Vite)

Ši direktorija yra Pet‑Sitting Platform frontend aplikacija.

## Paleidimas

```bash
# iš repo root
npm --prefix frontend install
npm --prefix frontend run dev
```

Frontend pagal nutylėjimą pasiekiamas per:

- `http://localhost:5173`

## Pagrindiniai UI/UX sprendimai

- **Auto-save (debounce) redagavimas** profilyje / augintiniuose / atmestos rezervacijos redagavime.
- **Toast pranešimai** po sėkmingo išsaugojimo.
- **Viršutinėje navigacijoje badge** su `PENDING` užsakymų kiekiu:
  - Owner: prie `Rezervacijos`
  - Sitter: prie `Mano darbai`
- **Mobile UX**:
  - hamburger meniu su uždarymu paspaudus šalia / `Esc`
  - `active:` tap feedback pagrindiniams mygtukams

## Scriptai

```bash
npm --prefix frontend run dev
npm --prefix frontend run build
npm --prefix frontend run preview
npm --prefix frontend run lint
```
