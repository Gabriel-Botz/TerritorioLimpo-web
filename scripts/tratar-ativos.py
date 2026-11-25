"""Trata os ativos visuais do TerritorioLimpo-web (executar uma vez).

- Recorta as margens dos logotipos usando o bounding box do canal alfa.
- Converte a foto do herói para WebP e JPEG com largura máx. 1600 px e ~200 KB.
- Gera o favicon a partir do logotipo do projeto.
"""

import io
import os

from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGINAIS = os.path.join(RAIZ, "src", "assets", "originais")
DESTINO = os.path.join(RAIZ, "src", "assets")
PUBLICO = os.path.join(RAIZ, "public")

LARGURA_MAX_HERO = 1600
LIMITE_BYTES = 200 * 1024


def recortar_por_alfa(img: Image.Image, preenchimento: float = 0.03) -> Image.Image:
    alfa = img.getchannel("A")
    caixa = alfa.point(lambda a: 255 if a > 10 else 0).getbbox()
    if caixa is None:
        raise ValueError("imagem sem conteúdo visível")
    largura = caixa[2] - caixa[0]
    altura = caixa[3] - caixa[1]
    px = int(max(largura, altura) * preenchimento)
    novo = (
        max(0, caixa[0] - px),
        max(0, caixa[1] - px),
        min(img.width, caixa[2] + px),
        min(img.height, caixa[3] + px),
    )
    return img.crop(novo)


def redimensionar_largura(img: Image.Image, largura: int) -> Image.Image:
    if img.width <= largura:
        return img
    proporcao = largura / img.width
    return img.resize((largura, max(1, round(img.height * proporcao))), Image.LANCZOS)


def salvar_com_limite(img: Image.Image, caminho: str, formato: str, **opcoes) -> None:
    """Salva reduzindo a qualidade até caber no limite de bytes."""
    qualidade = opcoes.pop("qualidade_inicial", 85)
    while qualidade >= 55:
        buffer = io.BytesIO()
        img.save(buffer, format=formato, quality=qualidade, **opcoes)
        if buffer.tell() <= LIMITE_BYTES:
            with open(caminho, "wb") as arquivo:
                arquivo.write(buffer.getvalue())
            print(f"  {os.path.basename(caminho)}: {buffer.tell()} bytes (q{qualidade})")
            return
        qualidade -= 5
    img.save(caminho, format=formato, quality=55, **opcoes)
    print(f"  {os.path.basename(caminho)}: acima do limite mesmo em q55")


def tratar_logo(nome_origem: str, nome_destino: str) -> Image.Image:
    img = Image.open(os.path.join(ORIGINAIS, nome_origem)).convert("RGBA")
    recortado = recortar_por_alfa(img)
    recortado = redimensionar_largura(recortado, 960)
    caminho = os.path.join(DESTINO, nome_destino)
    recortado.save(caminho, format="PNG", optimize=True)
    print(f"  {nome_destino}: {recortado.size} ({os.path.getsize(caminho)} bytes)")
    return recortado


def tratar_hero() -> None:
    img = Image.open(os.path.join(ORIGINAIS, "Fotopetropolis.PNG")).convert("RGB")
    img = redimensionar_largura(img, LARGURA_MAX_HERO)
    salvar_com_limite(img, os.path.join(DESTINO, "hero-territorio.webp"), "WEBP", qualidade_inicial=80)
    salvar_com_limite(img, os.path.join(DESTINO, "hero-territorio.jpg"), "JPEG", qualidade_inicial=80)


def gerar_favicon(logo: Image.Image) -> None:
    lado = max(logo.size)
    quadrado = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    quadrado.paste(logo, ((lado - logo.width) // 2, (lado - logo.height) // 2))
    favicon = quadrado.resize((64, 64), Image.LANCZOS)
    caminho = os.path.join(PUBLICO, "favicon.png")
    favicon.save(caminho, format="PNG", optimize=True)
    print(f"  favicon.png: {os.path.getsize(caminho)} bytes")


def principal() -> None:
    print("Logotipos:")
    logo_projeto = tratar_logo("Logoprojeto.png", "logo-projeto.png")
    tratar_logo("Logofaculdade.png", "logo-unifase.png")
    print("Herói:")
    tratar_hero()
    print("Favicon:")
    gerar_favicon(logo_projeto)


if __name__ == "__main__":
    principal()
