# Terminal Commands Cheat Sheet (Docker)

All commands below are intended to be run from the repository root:

```
/Users/simonas/Desktop/Projects /pet-sitting-platform
```

## Docker (start/stop/rebuild)

- **Start everything**

```bash
docker compose up -d
```

- **Stop everything**

```bash
docker compose down
```

- **Rebuild + restart frontend**

```bash
docker compose up -d --build frontend
```

- **Rebuild + restart backend**

```bash
docker compose up -d --build backend
```

- **Rebuild + restart all services**

```bash
docker compose up -d --build
```

- **List running containers**

```bash
docker ps
```

- **View logs**

```bash
docker logs petsitting-frontend --tail 50
docker logs petsitting-backend --tail 50
docker logs petsitting-nginx --tail 50
docker logs petsitting-postgres --tail 50
```

## ESLint (run inside Docker)

- **Frontend lint**

```bash
docker exec petsitting-frontend npm run lint
```

- **Backend lint** (note: this script runs eslint with `--fix`)

```bash
docker exec petsitting-backend npm run lint
```

If you ever re-install backend deps (e.g. `npm ci`) and see Prisma/TypeScript-related lint errors, run:

```bash
docker exec petsitting-backend npx prisma generate
```

## Build / TypeScript compile (run inside Docker)

- **Frontend build** (`tsc -b` + `vite build`)

```bash
docker exec petsitting-frontend npm run build
```

- **Backend build** (`nest build`)

```bash
docker exec petsitting-backend npm run build
```

## Prisma (run inside backend Docker)

- **Create & apply migration**

```bash
docker exec -it petsitting-backend npx prisma migrate dev --name <migration_name>
```

- **Generate Prisma client**

```bash
docker exec petsitting-backend npx prisma generate
```

- **Prisma Studio**

```bash
docker exec -it petsitting-backend npx prisma studio --port 5555
```

## Tests

- **Backend unit tests**

```bash
docker exec petsitting-backend npm test
```

- **Backend e2e tests**

```bash
docker exec petsitting-backend npm run test:e2e
```

## Useful URLs

- **App via Nginx**

```text
http://localhost:80
```

- **Backend API**

```text
http://localhost:5000/api
```
