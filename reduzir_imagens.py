#!/usr/bin/env python3
"""
Prepara a pasta de imagens do site antes de publicar no Cloudflare.

O que faz:
1) Se as pastas dos projetos ficaram em images/portfolio_imagens/,
   sobe um nível, para ficar images/<projeto>/001.jpg (o que o site espera).
2) Reduz imagens maiores que o limite (o Cloudflare aceita até 25 MB por
   arquivo; o padrão aqui é 20 MB, com folga). A imagem vira JPG, e o
   data/projetos.json é atualizado automaticamente.
   PNGs com transparência ficam com fundo preto (igual ao site).
3) Confere se todas as imagens citadas no projetos.json existem.

Uso (com o terminal aberto DENTRO da pasta do site):
    python reduzir_imagens.py
    python reduzir_imagens.py 10      <- limite de 10 MB (site mais leve)

Precisa do Pillow:   pip install pillow
"""

import json
import shutil
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Falta o Pillow. Rode:  pip install pillow   e tente de novo.")

Image.MAX_IMAGE_PIXELS = None

RAIZ = Path(__file__).resolve().parent
IMAGES = RAIZ / "images"
DADOS = RAIZ / "data" / "projetos.json"
LIMITE_MB = float(sys.argv[1]) if len(sys.argv) > 1 else 20.0
LIMITE = int(LIMITE_MB * 1024 * 1024)
CONVERTE = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"}


def subir_pasta_aninhada():
    aninhada = IMAGES / "portfolio_imagens"
    if not aninhada.is_dir():
        return
    print("Arrumando images/portfolio_imagens/ ...")
    for sub in sorted(aninhada.iterdir()):
        if not sub.is_dir():
            continue
        destino = IMAGES / sub.name
        if destino.exists():
            print(f"  images/{sub.name} já existe, pulei")
        else:
            shutil.move(str(sub), str(destino))
    restos = [p for p in aninhada.iterdir()]
    print(f"  pronto. Sobraram {len(restos)} item(ns) em portfolio_imagens (pode apagar a pasta depois).")


def reduzir(arq):
    """Salva como JPG abaixo do limite. Devolve o caminho novo."""
    im = Image.open(arq)
    im.load()
    if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
        im = im.convert("RGBA")
        fundo = Image.new("RGB", im.size, (0, 0, 0))
        fundo.paste(im, mask=im.split()[3])
        im = fundo
    else:
        im = im.convert("RGB")

    destino = arq.with_suffix(".jpg")
    if destino.exists() and destino != arq:
        destino = arq.with_name(arq.stem + "_reduzida.jpg")

    maior = max(im.size)
    for lado_max in (4000, 3200, 2560, 2000):
        t = im if maior <= lado_max else im.resize(
            tuple(round(x * lado_max / maior) for x in im.size), Image.LANCZOS
        )
        for q in (92, 88, 82, 75):
            t.save(destino, "JPEG", quality=q, optimize=True, progressive=True)
            if destino.stat().st_size <= LIMITE:
                return destino
    return destino


def reduzir_grandes():
    trocas = {}  # "/images/a/b.png" -> "/images/a/b.jpg"
    if not IMAGES.is_dir():
        sys.exit("Não achei a pasta 'images'. Rode o script dentro da pasta do site.")
    grandes = [p for p in IMAGES.rglob("*") if p.is_file() and p.stat().st_size > LIMITE]
    print(f"{len(grandes)} arquivo(s) acima de {LIMITE_MB:g} MB.")
    for arq in sorted(grandes):
        rel = arq.relative_to(IMAGES).as_posix()
        tamanho = arq.stat().st_size / 1024 / 1024
        if arq.suffix.lower() not in CONVERTE:
            print(f"  AVISO: {rel} ({tamanho:.0f} MB) não é imagem comum; reduza à mão.")
            continue
        try:
            novo = reduzir(arq)
        except Exception as e:
            print(f"  ERRO em {rel}: {e}")
            continue
        novo_rel = novo.relative_to(IMAGES).as_posix()
        if novo != arq:
            arq.unlink()
            trocas["/images/" + rel] = "/images/" + novo_rel
        print(f"  {rel}: {tamanho:.0f} MB -> {novo.stat().st_size / 1024 / 1024:.1f} MB")
    return trocas


def atualizar_json(trocas):
    if not DADOS.exists():
        print("Aviso: data/projetos.json não encontrado.")
        return
    dados = json.loads(DADOS.read_text(encoding="utf-8"))
    mudou = 0
    ausentes = []
    for p in dados.get("projetos", []):
        lista = p.get("imagens", [])
        for i, caminho in enumerate(lista):
            if caminho in trocas:
                lista[i] = trocas[caminho]
                mudou += 1
        if p.get("capa") in trocas:
            p["capa"] = trocas[p["capa"]]
        for caminho in lista + ([p["capa"]] if p.get("capa") else []):
            if caminho.startswith("/images/") and not (RAIZ / caminho.lstrip("/")).exists():
                ausentes.append(caminho)
    if mudou:
        DADOS.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"projetos.json atualizado ({mudou} caminho(s)).")
    if ausentes:
        print(f"\nATENÇÃO: {len(ausentes)} imagem(ns) citadas no projetos.json não existem na pasta. Exemplos:")
        for c in ausentes[:5]:
            print("  ", c)
        print("Confira se as pastas dos projetos estão direto em images/.")
    else:
        print("Conferência OK: todas as imagens do projetos.json existem.")


if __name__ == "__main__":
    subir_pasta_aninhada()
    atualizar_json(reduzir_grandes())
    print("\nPronto. Agora, no GitHub Desktop: Commit to main e depois Push origin.")
