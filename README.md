# Jogo da Cobrinha (Vercel Free)

Jogo clássico da cobrinha em HTML/CSS/JS puro, pronto para deploy na Vercel gratuita.

## Como usar suas fotos como pecinhas

1. Coloque suas imagens em `pieces/` com nomes sequenciais:
   - `pieces/1.png`
   - `pieces/2.png`
   - `pieces/3.png`
2. O jogo carrega automaticamente as imagens encontradas e usa como comida da cobrinha.
3. Se nenhuma imagem for encontrada, o jogo usa uma bolinha padrão.

## Rodar localmente

Você pode abrir `index.html` direto no navegador, mas para simular ambiente de servidor:

```bash
npx serve .
```

Depois acesse a URL mostrada no terminal (normalmente `http://localhost:3000`).

## Deploy na Vercel (gratuito)

### Opção 1: pela interface web
1. Suba este projeto para um repositório no GitHub.
2. Entre em https://vercel.com e conecte sua conta GitHub.
3. Clique em **Add New Project**.
4. Selecione o repositório.
5. Framework preset: **Other** (ou sem framework).
6. Build command: vazio.
7. Output directory: vazio.
8. Deploy.

### Opção 2: via CLI

```bash
npm i -g vercel
vercel
```

Siga o assistente e confirme deploy de projeto estático.

## Controles

- Teclado: setas ou `W A S D`
- Também há botões na tela para celular

## Observações

- Funciona no plano gratuito da Vercel.
- Recorde salvo no navegador com `localStorage`.
