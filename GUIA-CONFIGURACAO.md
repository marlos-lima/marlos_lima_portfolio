# Guia: colocar o site no ar e ativar o painel /admin

Os passos abaixo seguem a documentação das ferramentas (Cloudflare Pages, Sveltia CMS
e o script sveltia-cms-auth). Os nomes dos botões podem mudar um pouco com o tempo.
Se alguma tela for diferente, me mande uma captura que eu te ajudo.

## 1. Preparar os arquivos no seu computador
1. Copie as subpastas de `portfolio_imagens` para dentro da pasta `images` deste site
   (ficará, por exemplo, `images/polvo-ous/001.jpg`).
2. Salve o seu logo (a cabeça rosa) como `images/logo.png`. Sem ele, o site mostra o nome em texto.
3. Para testar antes de publicar, abra o terminal dentro da pasta do site e rode:
   `python3 -m http.server 8000`  e acesse http://localhost:8000
   (clicar duas vezes no index.html não funciona, o site precisa de um servidor).

## 2. GitHub (guarda os arquivos e faz o login do painel)
1. Crie uma conta gratuita em github.com.
2. Crie um repositório novo (sugestão: público, nome `portfolio`).
3. Envie todos os arquivos da pasta do site para o repositório. O mais fácil é o programa
   **GitHub Desktop**: adicione a pasta, faça o "Commit" e depois o "Push".
   Atenção: o envio pelo navegador tem limite de arquivos por vez. Como são ~700 imagens, use o GitHub Desktop.
4. Veja o tamanho da pasta `images`. Se passar de ~1 GB, me avise, pois existem alternativas.

## 3. Cloudflare Pages (hospedagem gratuita)
1. Crie uma conta gratuita em cloudflare.com.
2. Em Workers & Pages, crie um projeto Pages conectado ao seu repositório do GitHub.
3. Não precisa de comando de build. Deixe o campo de build vazio e a pasta de saída como a raiz (`/`).
4. Ao terminar, você recebe um endereço como `portfolio.pages.dev`. O site já está no ar.

## 4. Login do painel (uma vez só)
1. No GitHub: Settings > Developer settings > OAuth Apps > New OAuth App.
   - Homepage URL: o endereço do seu site (ex.: https://portfolio.pages.dev)
   - Authorization callback URL: `ENDERECO-DO-WORKER/callback` (você obtém o endereço do worker no próximo passo;
     pode voltar aqui e editar depois)
2. Publique o script **sveltia-cms-auth** no Cloudflare Workers (projeto github.com/sveltia/sveltia-cms-auth;
   há um botão de deploy no README). Anote o endereço, parecido com `https://sveltia-cms-auth.SEU-SUBDOMINIO.workers.dev`.
3. No painel do worker, em Settings > Variables, crie `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET`
   com os valores do OAuth App do GitHub. Salve e publique.
4. No GitHub, abra o arquivo `admin/config.yml` e preencha as 3 linhas de cima:
   - `repo`: seu-usuario/portfolio
   - `base_url`: o endereço do worker
   Faça o commit.
5. Acesse `seusite/admin`, clique em "Login with GitHub" e pronto.

## 5. Uso no dia a dia
- **Novo projeto:** Painel > Projetos > Adicionar projeto. Preencha título, endereço (sem espaços/acentos),
  categorias e envie as imagens. Salve/Publique e, em cerca de 1 minuto, o site atualiza.
- **Ordem dos projetos:** arraste na lista.
- **Menu 3D / 2D:** marque as categorias de cada projeto (a distribuição inicial foi um palpite, ajuste à vontade).
- **Contato e logo:** Painel > Contato e logo.

## 6. Domínio próprio (opcional)
No Cloudflare Pages, aba Custom domains. O endereço `.pages.dev` é grátis e funciona sem domínio próprio.
