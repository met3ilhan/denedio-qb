from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
out = root / "e2e" / "fixtures" / "ottoman-adaletname-question.png"
out.parent.mkdir(parents=True, exist_ok=True)

image = Image.new("RGB", (1800, 1200), "white")
draw = ImageDraw.Draw(image)
font_path = "C:/Windows/Fonts/arial.ttf"
font = ImageFont.truetype(font_path, 27)
title_font = ImageFont.truetype(font_path, 30)

lines = [
    "Osmanlı Devleti'nde, halkın yerel yöneticiler veya memurlar tarafından",
    "uğradığı haksızlıkları gidermek, yolsuzlukları önlemek ve kanuna aykırı",
    "uygulamaları düzeltmek amacıyla padişah tarafından yayınlanan özel belgeye",
    "ne ad verilir?",
    "",
    "A) Ahidnâme",
    "B) Amannâme",
    "C) Adaletnâme",
    "D) Berat",
    "E) Ferman",
]

y = 70
for line in lines:
    draw.text((80, y), line, fill="black", font=font)
    y += 82

draw.text(
    (80, 1020),
    "Tarih — Osmanlı yönetim ve hukuk belgeleri",
    fill="#173b70",
    font=title_font,
)
image.save(out, format="PNG")
print(out)
