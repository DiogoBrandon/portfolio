document.addEventListener("DOMContentLoaded", function () {
  carregarSecao("navbar", "pages/navbar.html");
  carregarSecao("hero", "pages/hero.html");
  carregarSecao("sobre", "pages/sobre.html");
  carregarSecao("habilidades", "pages/habilidades.html");
  carregarSecao("projetos", "pages/projetos.html");
  carregarSecao("experiencia", "pages/experiencia.html");
  carregarSecao("contato", "pages/contato.html");
});

function carregarSecao(idElemento, caminhoArquivo) {
  fetch(caminhoArquivo)
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Erro ao carregar: " + caminhoArquivo);
      }

      return response.text();
    })
    .then(function (html) {
      document.getElementById(idElemento).innerHTML = html;
    })
    .catch(function (error) {
      console.error(error);
    });
}

const spaceLayer = document.querySelector('.space-layer');

let hasActiveSquad = false;
let animationFrameId = null;
let nextShipTimeout = null;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function scheduleNextShip() {
  clearTimeout(nextShipTimeout);

  nextShipTimeout = setTimeout(() => {
    createShipSquad();
  }, rand(2500, 6500));
}

function getBlockingCards() {
  return Array
    .from(document.querySelectorAll(`
        .card,
        [class$="-card"],
        [class*="-card "]
      `))
    .filter(element => {
      const rect = element.getBoundingClientRect();

      const isTooLarge =
        rect.width > window.innerWidth * 0.9 ||
        rect.height > window.innerHeight * 0.75;

      return !isTooLarge;
    });
}

function isColliding(rectA, rectB) {
  return !(
    rectA.right < rectB.left ||
    rectA.left > rectB.right ||
    rectA.bottom < rectB.top ||
    rectA.top > rectB.bottom
  );
}

function watchCardCollision(squad) {
  const content = squad.querySelector('.ship-squad-content');

  function checkCollision() {
    if (!document.body.contains(squad)) {
      return;
    }

    const contentRect = content.getBoundingClientRect();
    const cards = getBlockingCards();

    const isOverCard = cards.some(card => {
      const cardRect = card.getBoundingClientRect();
      return isColliding(contentRect, cardRect);
    });

    squad.classList.toggle('is-over-card', isOverCard);

    animationFrameId = requestAnimationFrame(checkCollision);
  }

  checkCollision();
}

let lastShipSide = 'right';

function getRandomRoute() {
  const margin = 260;

  /*
    Quanto maior, mais longe do conteúdo.
    Aqui a nave fica mais próxima da borda da tela.
  */
  const edgeGap = 24;

  /*
    Largura real do grupo antes do scale.
    Tem que bater com o width do .ship-squad no CSS.
  */
  const squadWidth = 210;

  /*
    Alterna entre esquerda e direita.
    Assim garante que o lado direito também vai aparecer.
  */
  const side = lastShipSide === 'right' ? 'left' : 'right';
  lastShipSide = side;

  const fromTop = Math.random() > 0.5;

  let startX;

  if (side === 'left') {
    startX = edgeGap;
  } else {
    startX = window.innerWidth - squadWidth - edgeGap;
  }

  if (fromTop) {
    return {
      startX,
      startY: -margin,
      tx: 0,
      ty: window.innerHeight + margin * 2,
      rotate: '90deg'
    };
  }

  return {
    startX,
    startY: window.innerHeight + margin,
    tx: 0,
    ty: -(window.innerHeight + margin * 2),
    rotate: '-90deg'
  };
}

function getFallbackVerticalRoute() {
  const margin = 260;
  const squadWidth = 210;
  const fromTop = Math.random() > 0.5;

  /*
    Fallback mais colado nas bordas para não invadir o conteúdo.
  */
  const startX = Math.random() > 0.5
    ? rand(20, 70)
    : rand(window.innerWidth - squadWidth - 70, window.innerWidth - squadWidth - 20);

  if (fromTop) {
    return {
      startX,
      startY: -margin,
      tx: rand(-10, 10),
      ty: window.innerHeight + margin * 2,
      rotate: '90deg'
    };
  }

  return {
    startX,
    startY: window.innerHeight + margin,
    tx: rand(-10, 10),
    ty: -(window.innerHeight + margin * 2),
    rotate: '-90deg'
  };
}

function createShipSquad() {
  if (hasActiveSquad || !spaceLayer) {
    scheduleNextShip();
    return;
  }

  hasActiveSquad = true;

  const route = getRandomRoute();

  const squad = document.createElement('div');
  squad.className = 'ship-squad';

  squad.innerHTML = `
      <div class="ship-squad-content">
        <span class="ship"></span>
        <span class="ship"></span>
        <span class="ship"></span>
      </div>
    `;

  squad.style.left = `${route.startX}px`;
  squad.style.top = `${route.startY}px`;

  squad.style.setProperty('--tx', `${route.tx}px`);
  squad.style.setProperty('--ty', `${route.ty}px`);
  squad.style.setProperty('--rotate', route.rotate);

  /*
    Um pouco menor para caber melhor nas laterais.
  */
  squad.style.setProperty('--scale', rand(0.52, 0.78).toFixed(2));

  /*
    Opacidade discreta.
  */
  squad.style.setProperty('--opacity', rand(0.22, 0.42).toFixed(2));

  /*
    Duração do voo.
  */
  squad.style.setProperty('--dur', `${rand(9, 15).toFixed(2)}s`);

  spaceLayer.appendChild(squad);

  watchCardCollision(squad);

  squad.addEventListener('animationend', () => {
    squad.remove();
    hasActiveSquad = false;

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    scheduleNextShip();
  });
}

window.addEventListener('load', () => {
  scheduleNextShip();
});

window.addEventListener('resize', () => {
  document.querySelectorAll('.ship-squad').forEach(squad => squad.remove());

  hasActiveSquad = false;

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  scheduleNextShip();
});