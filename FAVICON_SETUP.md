# Setup do Favicon - LomusTrack

## Passos para adicionar o favicon:

### 1. Salvar a imagem do logo
Salve a imagem do logo (fundo preto com símbolo branco) que você enviou.

### 2. Criar os arquivos necessários

#### Opção A: Usando um gerador online (RECOMENDADO)
1. Acesse: https://realfavicongenerator.net/
2. Faça upload da sua imagem
3. Baixe o pacote gerado
4. Copie os arquivos para `frontend/public/`

#### Opção B: Manualmente
Você precisa criar as seguintes versões:

**Arquivos necessários em `frontend/public/`:**
- `favicon.ico` (16x16, 32x32, 48x48 multi-size)
- `favicon.png` (32x32 ou 192x192)
- `icons/apple-touch-icon.png` (180x180)
- `icons/pwa-192.png` (192x192)
- `icons/pwa-512.png` (512x512)

### 3. Estrutura de diretórios

```
frontend/public/
├── favicon.ico
├── favicon.png
└── icons/
    ├── apple-touch-icon.png
    ├── pwa-192.png
    └── pwa-512.png
```

### 4. Ferramentas úteis

**Para criar .ico:**
- https://www.icoconverter.com/
- https://convertio.co/png-ico/

**Para redimensionar:**
- https://www.iloveimg.com/resize-image
- https://imageresizer.com/

### 5. Após adicionar os arquivos

Reinicie o servidor frontend:
```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
cd frontend
npm run dev
```

Limpe o cache do navegador:
- Chrome/Edge: Ctrl+Shift+Delete
- Firefox: Ctrl+Shift+Delete
- Safari: Cmd+Option+E

## ✅ Verificação

Depois de adicionar os arquivos, verifique:
1. Aba do navegador mostra o novo favicon
2. Favoritos mostram o novo ícone
3. PWA instalado mostra o ícone correto
4. Tela inicial do celular mostra o ícone correto

---

**Nota:** O `index.html` já foi atualizado para usar os novos arquivos!
