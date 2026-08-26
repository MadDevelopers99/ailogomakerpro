# LogoMaker

design.com jaisi ek simple **logo template gallery + editor** website. Categories browse karo, logo select karo, business name/tagline/colors customize karo, aur PNG download karo.

## Folder Structure

```
index.html          -> Homepage (categories grid)
category.html        -> Ek category ke sare logos
editor.html           -> Selected logo customize karne wala page
css/style.css
js/main.js            -> Homepage + category page logic
js/editor.js          -> Editor page logic
data/categories.json  -> Sari categories ki list
data/logos.json       -> Sare logos ki list
assets/logos/<category-id>/   -> Har category ka apna image folder
```

## Data Kaise Add Karein

### 1. Naya logo add karna
1. Apni image (SVG ya PNG, transparent background best) is folder mein paste karein:
   `assets/logos/<category-id>/apni-file.svg`
   (category-id list neeche di gayi hai)
2. `data/logos.json` mein ek naya object add karein:
   ```json
   {
     "id": "unique-id-123",
     "categoryId": "technology",
     "name": "Tech Circuit Logo",
     "image": "assets/logos/technology/apni-file.svg",
     "tags": ["blue", "minimal", "circuit"]
   }
   ```
   - `id` har logo ke liye unique hona chahiye.
   - `categoryId` neeche di gayi list mein se hona chahiye.
   - `image` path root se relative hai.

### 2. Nayi category add karna
`data/categories.json` mein add karein:
```json
{ "id": "my-category", "name": "My Category", "icon": "🚀" }
```
Phir `assets/logos/my-category/` naam ka folder bana kar usmein images daalein.

## Mojooda Categories (IDs)

- business, technology, food-restaurant, fashion-beauty, sports-fitness, education,
  real-estate, health-medical, animals-pets, art-entertainment, travel-hotel, automotive,
  music-audio, photography, construction, finance-legal, agriculture-farming, kids-baby,
  wedding-events, gaming-esports, church-religion, nature-environment

(Agar in mein se koi category nahi chahiye to `data/categories.json` se hata dein, aur
uska empty folder bhi delete kar sakte hain.)

## Website Chalane Ka Tareeqa

**Important:** `index.html` ko seedha double-click karke browser mein kholne se data load
nahi hoga (browsers `file://` se JSON fetch block karte hain). Ek local server chalayein:

**VS Code:** "Live Server" extension install karein, `index.html` par right-click → *Open with Live Server*.

**Ya PowerShell/terminal mein** (Python installed hone par):
```
python -m http.server 5500
```
Phir browser mein `http://localhost:5500` kholein.

## Bulk Data Add Karna

Agar aap ke paas bohot sara data (naam, category, image) ready hai, to CSV/list bhej dein —
main ek script bana kar automatically `data/logos.json` aur folders populate kar dun ga.
