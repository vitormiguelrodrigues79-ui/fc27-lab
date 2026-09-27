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

## v1.1 — Pesquisa por nome
- Em Jogadores > Adicionar, pesquisar pelo nome (mínimo 3 caracteres) e escolher uma carta base FC 27 da fonte pública de ratings da EA.
- No Plantel, tocar numa posição para pesquisar e colocar o jogador diretamente.
- Seleção explícita e confirmação antes de guardar; reutiliza cartas já existentes.
- Entrada manual continua disponível para cartas especiais/Evolutions. Não há sincronização automática de preços.
- `supabase/functions/fc27-player-search` valida sessão, recusa acesso anónimo, limita pedidos e confirma a edição FC 27 antes de devolver dados.
- Fonte: https://www.ea.com/games/ea-sports-fc/ratings. A integração depende do formato público dessa página e pode necessitar de manutenção. Não é uma API licenciada nem uma associação à EA.
- Deploy da função com `verify_jwt = true`. Não incluir chaves secretas no frontend.

Build da v1.1 validado. Parser verificado com pesquisa real por João Neves, normalização de acentos e rejeição de edições diferentes. O fluxo completo de guardar/colocar necessita de uma sessão do utilizador para validação real.
