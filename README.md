# Nitro Rush 3D

[![Nitro Rush 3D — clique para jogar no navegador](https://i.imgur.com/iCjKzM9.png)](https://vitormenoli.github.io/Nitro-Rush/)

**[Jogar agora no navegador](https://vitormenoli.github.io/Nitro-Rush/)**

Jogo de corrida 3D para navegador, criado do zero em vídeo no canal **[@vitor.menoli](https://www.youtube.com/@vitor.menoli)** no YouTube.

Todo o código foi gerado com o **Claude (Opus 5.5)** a partir de pedidos em português, num ciclo automático de **gerar → executar → corrigir**: o jogo era aberto no Chrome com a placa de vídeo real, testado e ajustado até todos os critérios passarem sem erros.

> Assista ao processo completo no canal: **https://www.youtube.com/@vitor.menoli**

---

## O que tem no jogo

- **6 circuitos reais**, com traçado e relevo tirados de dados abertos de mapas e satélite:
  | Circuito | País | Destaque | Nível |
  |---|---|---|---|
  | Interlagos | Brasil | S do Senna em forte declive | 1 |
  | Monza | Itália | Retas longas e a Parabolica | 1 |
  | Laguna Seca | EUA | O Saca-Rolhas (Corkscrew) | 3 |
  | Spa-Francorchamps | Bélgica | Eau Rouge com neve e pinheiros | 8 |
  | Mônaco | Mônaco | Ruas estreitas à noite, prédios em neon e porto | 15 |
  | Nürburgring Nordschleife | Alemanha | O "Inferno Verde", sobe e desce sem parar | 22 |
- **Campanha mundial**: um mapa-múndi com os circuitos ligados por uma rota. Cada etapa libera com o nível da conta **e** a vitória (1º lugar) na etapa anterior.
- **23 carros de marcas reais** em 4 classes (Urbana, Executiva, Exóticos e Hyper), com garagem, compra, pintura e tunagem de motor, pneus e turbo.
- **Modo Corrida** contra 10 carros controlados pelo computador, em 3 dificuldades.
- **Modo Treino (Ghost)**: você corre contra um carro fantasma que repete a sua melhor volta, salva no navegador.
- **Nível da conta (XP)**, moedas e recompensas por posição, drift e moedas coletadas.
- **Gráficos**: materiais PBR (asfalto, zebras, terreno), pintura com verniz e flocos metálicos, céu com nuvens e reflexos, sombras suaves e faróis que iluminam a pista de verdade.
- **Modelo 3D externo**: a Ferrari 488 GTB é carregada como modelo glTF/Draco da internet. Se o download falhar, o jogo usa automaticamente o carro gerado por código.
- **Física**: direção ágil, controle de estabilidade, drift no freio de mão, colisões e suspensão que acompanha o relevo.
- **Interface** no estilo de simuladores, com ícones vetoriais (SVG), velocímetro, minimapa e nome da curva atual.
- **Som** 100% sintetizado no navegador (motores diferentes por marca, turbo, pneus, nitro).
- Funciona com **teclado, controle (gamepad) e toque** no celular.

## Como jogar

**Online:** acesse **[https://vitormenoli.github.io/Nitro-Rush/](https://vitormenoli.github.io/Nitro-Rush/)** — não precisa instalar nada.

**No computador:**

1. Abra o arquivo `index.html` no **Google Chrome** ou no **Microsoft Edge** (dois cliques já funcionam).
2. É preciso estar **conectado à internet**: o motor gráfico (Three.js), as fontes e o modelo 3D da Ferrari são baixados na hora.
3. Recomendado: computador com placa de vídeo e WebGL 2 ativo.

### Controles

| Tecla | Ação |
|---|---|
| W ou seta para cima | Acelerar |
| S ou seta para baixo | Frear / ré |
| A / D ou setas laterais | Esterçar |
| Shift ou Espaço | Nitro |
| Ctrl | Freio de mão (drift) |
| C | Trocar câmera |
| R | Reposicionar o carro na pista |
| Esc ou P | Pausar |
| M | Silenciar o som |
| F | Tela cheia |

## Estrutura do projeto

```
index.html            Estrutura das telas e carregamento dos scripts
styles.css            Visual da interface (menus, HUD, mapa da campanha)
src/Engine.js         Motor gráfico: renderização, sombras, reflexos, texturas PBR e carregador glTF/Draco
src/PhysicsEngine.js  Física dos carros, colisões e controles (teclado, gamepad, toque)
src/Vehicles.js       Os 23 carros, sons de motor, modelo 3D externo, faróis e carro fantasma
src/TrackManager.js   Os 6 circuitos reais, relevo, vegetação e cenários
src/App.js            Regras, economia, campanha, interface, HUD e salvamento
```

O progresso fica salvo no próprio navegador (LocalStorage).

## Tecnologias

- [Three.js](https://threejs.org/) r160 (via CDN jsDelivr), com GLTFLoader e DRACOLoader
- JavaScript puro, HTML e CSS, sem etapa de build
- Web Audio API para todos os sons

## Créditos e dados

- **Traçados dos circuitos**: © contribuidores do [OpenStreetMap](https://www.openstreetmap.org/copyright) (licença ODbL); Mônaco: [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) (MIT)
- **Relevo**: NASA SRTM 30 m, via [OpenTopoData](https://www.opentopodata.org/)
- **Mapa-múndi da campanha**: [Natural Earth](https://www.naturalearthdata.com/) (domínio público)
- **Modelo 3D da Ferrari 458 Italia**: autor vicent091036 (Sketchfab), distribuído nos exemplos do three.js. A licença original do modelo não foi verificada; confira antes de qualquer uso comercial.
- **Motor gráfico**: three.js (licença MIT)

Os nomes de carros e circuitos pertencem aos seus respectivos donos e aparecem só como referência. Este é um projeto de demonstração, sem ligação com as marcas.

---

Feito em vídeo no canal **[@vitor.menoli](https://www.youtube.com/@vitor.menoli)** — inscreva-se para ver os próximos projetos.
