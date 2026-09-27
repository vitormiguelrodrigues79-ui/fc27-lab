# FC LAB — B612 v1.0

MVP pessoal para EA Sports FC 27, pensado para 2 utilizadores.

## Incluído
- Login Google via Supabase Auth
- Base de jogadores manual
- Fit rating local por perfil de jogador
- My Squad 4-2-3-1
- Squad Doctor inicial
- Tactical Lab
- Watchlist e observações manuais de preço partilhadas
- Supabase com RLS e dados pessoais separados por utilizador

## Supabase
Projeto já configurado: `boyhtywhuumbayejfbse`.
Usa apenas a publishable key no frontend. Nunca colocar service role/secret key no cliente.

## Correr
```bash
npm install
npm run dev
```

## Produção
```bash
npm run build
```

Configurar no Supabase Auth > URL Configuration as URLs do staging/produção nos Redirect URLs para o Google OAuth funcionar fora de localhost.
