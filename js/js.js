"use strict";

// ===== APP INITIALISERING =====
document.addEventListener("DOMContentLoaded", initApp);

// Global var til spillene
let allGames = [];

// Change this id to the game you want shown in #intro (static, not editable live)
const INTRO_GAME_ID = 17; // <-- set the numeric id here
// Badge text for the intro card (leave empty to hide)
const INTRO_BADGE_TEXT = "Ugens<br>Spil!";

function initApp() {
  getGames();

  // Keep existing filter UI wired but adapt behaviour to games
  const searchInput = document.querySelector("#search-input");
  if (searchInput) searchInput.addEventListener("input", filterGames);

  const genreSelect = document.querySelector("#genre-select");
  if (genreSelect) genreSelect.addEventListener("change", filterGames);

  const sortSelect = document.querySelector("#sort-select");
  if (sortSelect) sortSelect.addEventListener("change", filterGames);

  // map year inputs to playtime filter (if present in HTML)
  const playFrom = document.querySelector("#year-from");
  const playTo = document.querySelector("#year-to");
  if (playFrom) playFrom.addEventListener("input", filterGames);
  if (playTo) playTo.addEventListener("input", filterGames);

  const ratingFrom = document.querySelector("#rating-from");
  const ratingTo = document.querySelector("#rating-to");
  if (ratingFrom) ratingFrom.addEventListener("input", filterGames);
  if (ratingTo) ratingTo.addEventListener("input", filterGames);

  const clearBtn = document.querySelector("#clear-filters");
  if (clearBtn) clearBtn.addEventListener("click", clearAllFilters);

  // filterbarbot toggle (if present)
  const filterToggle = document.querySelector(".filterbarbot-toggle");
  const filterContent = document.querySelector(".filterbarbot-content");
  if (filterToggle && filterContent) {
    filterToggle.addEventListener("click", () => {
      filterToggle.classList.toggle("active");
      filterContent.classList.toggle("active");
    });
  }
}

// Fetch games from provided JSON
async function getGames() {
  const url = "https://raw.githubusercontent.com/cederdorff/race/refs/heads/master/data/games.json";
  try {
    const res = await fetch(url);
    allGames = await res.json();
  } catch (err) {
    console.error("Could not load games:", err);
    allGames = [];
  }

  populateGenreDropdown();
  displayGames(allGames);

  // Render the chosen game (by id) into #intro; fall back to first game if id not found
  const introGame = allGames.find(g => g.id === INTRO_GAME_ID) || allGames[0];
  if (introGame) renderIntroCard(introGame);
}

// render a small card into #intro
function renderIntroCard(game) {
  const intro = document.querySelector("#intro");
  if (!intro) return;
  // clear previous intro content so switching id is visible
  intro.innerHTML = '';
  const html = `
    <article class="ugens-spil" tabindex="0">
      ${INTRO_BADGE_TEXT ? `<span class="corner-badge">${INTRO_BADGE_TEXT}</span>` : ''}
      <img src="${game.image}" alt="Poster of ${game.title}" class="movie-poster" />
      <div class="movie-info">
        <h3>${game.title}  <p class="movie-rating">${game.rating}</p> <span class="movie-year">${game.shelf ? '('+game.shelf+')' : ''}</span></h3>
      </div>
    </article>
  `;
  intro.insertAdjacentHTML('beforeend', html);
}
//        <p class="movie-genre">${game.genre}</p>
//        <p class="movie-director"><strong>Players:</strong> ${game.players.min}-${game.players.max} • <strong>Playtime:</strong> ${game.playtime}m</p>
//        <p class="movie-description">${truncate(game.description, 140)}</p>

function truncate(str, n) {
  return str && str.length > n ? str.slice(0, n-1) + '…' : str;
}

// Display games list
function displayGames(games) {
  const list = document.querySelector("#movie-list");
  if (!list) return;
  list.innerHTML = "";
  if (games.length ===0) {
    list.innerHTML = '<p class="no-results">Ingen spil😢</p>';
    return;
  }

  for (const game of games) displayGame(game);
}

function displayGame(game) {
  const list = document.querySelector("#movie-list");
  if (!list) return;

  const html = `
    <article class="movie-card" tabindex="0">
      <img src="${game.image}" alt="Poster of ${escapeHtml(game.title)}" class="movie-poster" />
      <div class="movie-info">
        <h3>${escapeHtml(game.title)} <span class="movie-year">${game.shelf ? ''+escapeHtml(game.shelf)+'' : ''}</span></h3>
        <p class="movie-genre">${escapeHtml(game.genre)}</p>
        <p class="movie-rating"> ${game.rating}</p>
        <p class="movie-director"><strong>Players:</strong> ${game.players.min}-${game.players.max} • <strong>Playtime:</strong> ${game.playtime}m</p>
        <p class="movie-description">${truncate(escapeHtml(game.description), 140)}</p>
      </div>
    </article>
  `;

  list.insertAdjacentHTML('beforeend', html);
  const newCard = list.lastElementChild;
  newCard.addEventListener('click', () => showGameModal(game));
  newCard.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showGameModal(game);
    }
  });
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
}

function populateGenreDropdown() {
  const genreSelect = document.querySelector('#genre-select');
  if (!genreSelect) return;
  const genres = new Set();
  for (const g of allGames) {
    if (g.genre) genres.add(g.genre);
  }
  genreSelect.innerHTML = `<option value="all">Alle genrer</option>`;
  [...genres].sort().forEach(g => genreSelect.insertAdjacentHTML('beforeend', `<option value="${g}">${g}</option>`));
}

function showGameModal(game) {
  const dialogContent = document.querySelector('#dialog-content');
  if (!dialogContent) return;
  dialogContent.innerHTML = `
    <img src="${game.image}" alt="Poster af ${escapeHtml(game.title)}" class="movie-poster">
    <div class="dialog-details">
      <h2>${escapeHtml(game.title)}</h2>
      <p><strong>Players:</strong> ${game.players.min} - ${game.players.max}</p>
      <p><strong>Playtime:</strong> ${game.playtime} minutes</p>
      <p class="movie-rating">⭐ ${game.rating}</p>
      <p><strong>Shelf:</strong> ${escapeHtml(game.shelf || '-')}</p>
      <p><strong>Difficulty:</strong> ${escapeHtml(game.difficulty || '-')}</p>
      <p><strong>Genre:</strong> ${escapeHtml(game.genre || '-')}</p>
      <div class="movie-description">${escapeHtml(game.rules || game.description || '')}</div>
    </div>
  `;
  const dlg = document.querySelector('#movie-dialog');
  if (dlg && typeof dlg.showModal === 'function') dlg.showModal();
}

function clearAllFilters() {
  const search = document.querySelector('#search-input'); if (search) search.value = '';
  const genre = document.querySelector('#genre-select'); if (genre) genre.value = 'all';
  const sort = document.querySelector('#sort-select'); if (sort) sort.value = 'none';
  const y1 = document.querySelector('#year-from'); if (y1) y1.value = '';
  const y2 = document.querySelector('#year-to'); if (y2) y2.value = '';
  const r1 = document.querySelector('#rating-from'); if (r1) r1.value = '';
  const r2 = document.querySelector('#rating-to'); if (r2) r2.value = '';
  filterGames();
}

function filterGames() {
  let filtered = allGames.slice();
  const searchValue = (document.querySelector('#search-input')?.value || '').toLowerCase();
  const genreValue = document.querySelector('#genre-select')?.value || 'all';
  const sortValue = document.querySelector('#sort-select')?.value || 'none';

  // year-from/year-to = antal spillere (min/max players)
  const playersFrom = Number(document.querySelector('#year-from')?.value) || 0;
  const playersTo = Number(document.querySelector('#year-to')?.value) || Infinity;
  
  // rating-from/rating-to = spilletid (min/max playtime in minutes)
  const playtimeFrom = Number(document.querySelector('#rating-from')?.value) || 0;
  const playtimeTo = Number(document.querySelector('#rating-to')?.value) || Infinity;

  if (searchValue) {
    filtered = filtered.filter(g => (g.title || '').toLowerCase().includes(searchValue) || (g.description || '').toLowerCase().includes(searchValue));
  }

  if (genreValue && genreValue !== 'all') {
    filtered = filtered.filter(g => g.genre === genreValue);
  }

  // Filter by antal spillere (players min/max)
  if (playersFrom || playersTo !== Infinity) {
    filtered = filtered.filter(g => {
      const minPlayers = g.players?.min || 0;
      const maxPlayers = g.players?.max || 0;
      // game overlaps with requested range if: game's max >= requested min AND game's min <= requested max
      return maxPlayers >= playersFrom && minPlayers <= playersTo;
    });
  }

  // Filter by spilletid (playtime min/max)
  if (playtimeFrom || playtimeTo !== Infinity) {
    filtered = filtered.filter(g => (typeof g.playtime === 'number') && g.playtime >= playtimeFrom && g.playtime <= playtimeTo);
  }

  if (sortValue === 'title') filtered.sort((a,b) => a.title.localeCompare(b.title));
  else if (sortValue === 'year') filtered.sort((a,b) => (b.playtime||0) - (a.playtime||0));
  else if (sortValue === 'rating') filtered.sort((a,b) => (b.rating||0) - (a.rating||0));

  displayGames(filtered);
}

