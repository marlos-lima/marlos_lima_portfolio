(async function () {
  const $ = (s, el = document) => el.querySelector(s);
  const conteudo = $("#conteudo");
  const menu = $("#menu");

  // caminhos "/images/x.jpg" viram relativos ao site; links http ficam como estão
  const src = (p) => (/^https?:\/\//i.test(p) ? p : String(p).replace(/^\//, ""));
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let site, projetos;
  try {
    const [a, b] = await Promise.all([
      fetch("data/site.json").then((r) => r.json()),
      fetch("data/projetos.json").then((r) => r.json()),
    ]);
    site = a;
    projetos = b.projetos || [];
  } catch (e) {
    conteudo.innerHTML =
      '<p class="vazio">Não foi possível carregar os dados. Abra o site por um servidor (por exemplo: python3 -m http.server) e não clicando direto no arquivo.</p>';
    return;
  }

  const porSlug = (slug) => projetos.find((p) => p.slug === slug);
  const daCategoria = (id) => projetos.filter((p) => (p.categorias || []).includes(id));
  const capa = (p) => p.capa || (p.imagens || [])[0];

  /* ---------- logo ---------- */
  function montarLogo(el, pequeno) {
    const img = new Image();
    img.alt = site.nome;
    img.src = src(site.logo);
    img.addEventListener("error", () => {
      const t = document.createElement("span");
      t.className = "logo-text";
      t.textContent = site.nome;
      img.replaceWith(t);
    });
    el.replaceChildren(img);
  }

  /* ---------- menu lateral ---------- */
  function renderMenu() {
    const digitos = (site.telefone || "").replace(/\D/g, "");
    const insta = site.instagram || "";
    const instaUrl = /^https?:/i.test(insta) ? insta : "https://" + insta;
    let html = `<div class="contato"><h2>Contact</h2>`;
    if (site.telefone) html += `<p><a href="tel:+${esc(digitos)}">${esc(site.telefone)}</a></p>`;
    if (site.email) html += `<p><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>`;
    if (insta) html += `<p class="insta"><a href="${esc(instaUrl)}" target="_blank" rel="noopener">${esc(insta)}</a></p>`;
    html += `</div>`;
    for (const c of site.categorias || []) {
      const lista = daCategoria(c.id);
      if (!lista.length) continue;
      html += `<h2><a href="#/categoria/${esc(c.id)}" data-cat="${esc(c.id)}">${esc(c.titulo)}</a></h2><ul>`;
      html += lista
        .map((p) => `<li><a href="#/projeto/${encodeURIComponent(p.slug)}" data-slug="${esc(p.slug)}">${esc(p.titulo)}</a></li>`)
        .join("");
      html += `</ul>`;
    }
    menu.innerHTML = html;
  }

  function marcarAtivo(rota) {
    menu.querySelectorAll("a.ativo").forEach((a) => a.classList.remove("ativo"));
    if (rota.tipo === "projeto") menu.querySelectorAll(`a[data-slug="${CSS.escape(rota.id)}"]`).forEach((a) => a.classList.add("ativo"));
    if (rota.tipo === "categoria") menu.querySelectorAll(`a[data-cat="${CSS.escape(rota.id)}"]`).forEach((a) => a.classList.add("ativo"));
  }

  /* ---------- páginas ---------- */
  function grade(lista) {
    if (!lista.length) return '<p class="vazio">Nenhum projeto aqui ainda.</p>';
    return (
      '<div class="grid">' +
      lista
        .map(
          (p) => `<a class="tile" href="#/projeto/${encodeURIComponent(p.slug)}">
            <img loading="lazy" src="${esc(src(capa(p) || ""))}" alt="${esc(p.titulo)}">
            <span class="t">${esc(p.titulo)}</span></a>`
        )
        .join("") +
      "</div>"
    );
  }

  function embed(url) {
    let m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (m)
      return `<div class="video"><iframe src="https://player.vimeo.com/video/${m[1]}" title="Vídeo" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
    m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/i);
    if (m)
      return `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${m[1]}" title="Vídeo" loading="lazy" allow="fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
    const nome = /behance\.net/i.test(url) ? "Ver no Behance" : "Ver vídeo";
    return `<p class="ext"><a href="${esc(url)}" target="_blank" rel="noopener">${nome} ↗</a></p>`;
  }

  function paginaProjeto(p) {
    const videos = (p.links_video || []).map(embed).join("");
    const imgs = (p.imagens || [])
      .map((i, n) => `<img ${n < 2 ? "" : 'loading="lazy"'} src="${esc(src(i))}" alt="${esc(p.titulo)} ${n + 1}">`)
      .join("");
    return `<article class="projeto"><h1>${esc(p.titulo)}</h1>${videos}${imgs}</article><a class="voltar" href="#/">← Voltar</a>`;
  }

  /* ---------- rotas ---------- */
  function rotaAtual() {
    const [, tipo, ...resto] = location.hash.split("/");
    const id = decodeURIComponent(resto.join("/") || "");
    if (tipo === "projeto" && porSlug(id)) return { tipo, id };
    if (tipo === "categoria" && (site.categorias || []).some((c) => c.id === id)) return { tipo, id };
    return { tipo: "home" };
  }

  function render() {
    const r = rotaAtual();
    if (r.tipo === "projeto") {
      const p = porSlug(r.id);
      conteudo.innerHTML = paginaProjeto(p);
      document.title = `${p.titulo} — ${site.nome}`;
    } else if (r.tipo === "categoria") {
      const c = site.categorias.find((x) => x.id === r.id);
      conteudo.innerHTML = `<h1 class="titulo-cat">${esc(c.titulo)}</h1>` + grade(daCategoria(r.id));
      document.title = `${c.titulo} — ${site.nome}`;
    } else {
      conteudo.innerHTML = grade(daCategoria("works"));
      document.title = site.nome;
    }
    marcarAtivo(r);
    window.scrollTo(0, 0);
    $("#menu-box").classList.remove("aberto");
    $("#menu-btn").setAttribute("aria-expanded", "false");
  }

  /* ---------- menu no celular ---------- */
  $("#menu-btn").addEventListener("click", () => {
    const box = $("#menu-box");
    const aberto = box.classList.toggle("aberto");
    $("#menu-btn").setAttribute("aria-expanded", String(aberto));
  });

  montarLogo($("#logo-mobile"));
  renderMenu();
  window.addEventListener("hashchange", render);
  render();
})();
