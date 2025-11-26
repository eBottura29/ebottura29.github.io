/* ---------- Utility: load data (localStorage fallback to files) ---------- */
async function loadJSONpreferLocal(key, path) {
    // key: localStorage key name (without prefix)
    // path: path to static file to fetch if no local
    const lsKey = `demonlist_${key}`;
    const ls = localStorage.getItem(lsKey);
    if (ls) {
        try {
            return JSON.parse(ls);
        } catch (e) {
            console.warn("Failed parsing localStorage", lsKey, e);
            localStorage.removeItem(lsKey);
        }
    }
    // else fetch file
    const res = await fetch(path);
    if (!res.ok) {
        console.error("Failed to fetch", path, res.status);
        return [];
    }
    return await res.json();
}

async function getAllData() {
    const demons = await loadJSONpreferLocal("demons", "data/demons.json");
    const players = await loadJSONpreferLocal("players", "data/players.json");
    const records = await loadJSONpreferLocal("records", "data/records.json");
    return { demons, players, records };
}

function formatLength(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function getParam(name) {
    return new URLSearchParams(location.search).get(name);
}

/* ---------- NAV helper: set Players top link to first player by rank ---------- */
async function setNavToFirstPlayer() {
    const { players } = await getAllData();
    if (!players || players.length === 0) return;
    // find player with smallest rank value
    players.sort((a,b)=> (a.rank||Infinity) - (b.rank||Infinity));
    const first = players[0];
    const link = document.getElementById("nav-player-link");
    if (link) link.href = `player.html?id=${encodeURIComponent(first.id)}`;
}

/* ========== INDEX PAGE ========== */
async function initIndex() {
    await setNavToFirstPlayer();
    await loadDemonList();
    await loadPlayerList();
}

function loadDemonList() {
    fetch("data/demons.json")
        .then(r => r.json())
        .then(demons => {
            demons.sort((a, b) => a.placement - b.placement);

            const list = document.getElementById("demonList");
            list.innerHTML = "";

            demons.forEach(demon => {
                list.innerHTML += `
                <div class="list-entry">
                    <span class="placement">#${demon.placement}</span>
                    <a href="demon.html?id=${demon.id}" class="name">${demon.name}</a>
                    <span class="aredl">AREDL #${demon.aredlRank}</span>
                    <span class="points">${demon.points} pts</span>
                    <img src="assets/faces/${demon.difficulty}.png" class="diff-face">
                </div>`;
            });
        })
        .catch(err => console.error("Failed to load demons:", err));
}


/* ========== PLAYER SIDEBAR ========== */
async function loadPlayerList() {
    const players = await fetch("data/players.json").then(r => r.json());
    players.sort((a,b)=> (a.rank||Infinity) - (b.rank||Infinity));
    const container = document.getElementById("playerList");
    container.innerHTML = "";
    players.forEach(p => {
        const div = document.createElement("div");
        div.className = "player-entry";
        div.innerHTML = `
            <span class="placement">#${p.rank}</span>
            <img class="flag" src="assets/flags/${p.country.toLowerCase()}.png" alt="">
            <a href="player.html?id=${encodeURIComponent(p.id)}">${p.name}</a>
        `;
        container.appendChild(div);
    });
}


/* ========== DEMON PAGE ========== */
async function initDemonPage() {
    await setNavToFirstPlayer();
    await loadDemonPage();
}

async function loadDemonPage() {
    const id = getParam("id");
    if (!id) { document.getElementById("title").innerText = "No ID provided"; return; }

    const { demons, records, players } = await getAllData();
    const demon = demons.find(d => d.id === id);
    if (!demon) { document.getElementById("title").innerText = "Demon not found"; return; }

    document.getElementById("title").innerText = demon.name;

    const dataDiv = document.getElementById("data");
    dataDiv.innerHTML = `
        <div style="display:flex;gap:16px;align-items:center;">
            <img src="assets/faces/${demon.difficultyIcon}" style="height:72px" alt="diff">
            <div>
                <div style="font-size:18px;font-weight:700">${escapeHtml(demon.name)} ${demon.aredlRank !== undefined ? `<span class="areadl-badge">AREDL #${demon.aredlRank}</span>` : ""}</div>
                <div style="color:var(--muted);margin-top:6px">Rank #${demon.placement ?? "?"} • ${demon.creator ?? ""}</div>
            </div>
        </div>

        <div style="margin-top:12px;">
            <p>Publisher: ${escapeHtml(demon.publisher ?? "")}</p>
            <p>Level ID: ${escapeHtml(String(demon.levelID ?? ""))}</p>
            <p>Length: ${formatLength(demon.lengthSeconds ?? 0)}</p>
            <p>Objects: ${escapeHtml(String(demon.objects ?? ""))}</p>
            <p>List Points: ${demon.listPoints ?? 0}</p>
            <p>Song: ${demon.song && demon.song.nongLink ? `<a href="${escapeAttr(demon.song.nongLink)}" target="_blank">NONG</a>` :
             demon.song && demon.song.ngID ? `<a href="https://www.newgrounds.com/audio/listen/${escapeAttr(demon.song.ngID)}" target="_blank">Newgrounds</a>` : "—"}</p>
        </div>
    `;

    // records
    const recDiv = document.getElementById("records");
    recDiv.innerHTML = "";
    const demonRecords = (records || []).filter(r => r.demonID === id);
    demonRecords.forEach(r => {
        const player = (players || []).find(p => p.id === r.playerID);
        const pName = player ? player.name : r.playerID;
        const countryCode = player && player.country ? String(player.country).toLowerCase() : null;
        const flagSrc = countryCode ? `assets/flags/${countryCode}.png` : null;

        const row = document.createElement("div");
        row.className = "record-entry";

        let imgHtml = flagSrc ? `<img class="flag" src="${flagSrc}" alt="">` : `<div style="width:32px"></div>`;
        let youtubeHtml = r.youtube ? `<a href="${escapeAttr(r.youtube)}" target="_blank">YouTube</a>` : `<span style="color:#777">YouTube</span>`;

        row.innerHTML = `
            ${imgHtml}
            <div style="flex:1;cursor:pointer" onclick="location.href='player.html?id=${encodeURIComponent(r.playerID)}'">${escapeHtml(pName)}</div>
            <div>${youtubeHtml}</div>
        `;
        recDiv.appendChild(row);
    });
}

/* ========== PLAYER PAGE ========== */
async function initPlayerPage() {
    await setNavToFirstPlayer();   // sets nav "Players" to first ranked player
    await loadPlayerList();        // load right sidebar
    await loadPlayerFromParam();   // loads player info and completions
}

async function loadPlayerPage() {
    const id = getParam("id");
    if (!id) { document.getElementById("title").innerText = "No ID provided"; return; }

    const { players, demons } = await getAllData();
    const p = players.find(x => x.id === id);
    if (!p) { document.getElementById("title").innerText = "Player not found"; return; }

    document.getElementById("title").innerText = p.name;
    const info = document.getElementById("info");

    const flagSrc = p.country ? `assets/flags/${String(p.country).toLowerCase()}.png` : null;
    const hardest = demons.find(d => d.id === p.hardest);

    info.innerHTML = `
        ${flagSrc ? `<img src="${flagSrc}" class="flag-big" alt="">` : ""}
        <p>GD Username: ${escapeHtml(p.gdUsername ?? "")}</p>
        <p>Clan: ${escapeHtml(p.clan ?? "")}</p>
        <p>Rank: #${p.rank ?? "?"}</p>
        <p>List Points: ${p.listPoints ?? 0}</p>
        <p>Hardest: ${hardest ? `<a href="demon.html?id=${encodeURIComponent(hardest.id)}">${escapeHtml(hardest.name)}</a>` : "—"}</p>
    `;

    // completions
    const container = document.getElementById("completions");
    container.innerHTML = "";
    (p.beatenDemons || []).forEach(did => {
        const d = demons.find(x => x.id === did);
        if (!d) return;
        const el = document.createElement("div");
        el.className = "completion";
        el.innerHTML = `<a href="demon.html?id=${encodeURIComponent(d.id)}">${escapeHtml(d.name)}</a>`;
        container.appendChild(el);
    });
}

async function loadPlayerFromParam() {
    const players = await fetch("data/players.json").then(r => r.json());
    if (!players || players.length === 0) return;

    let playerId = getParam("id");
    if (!playerId) {
        // pick first-ranked player
        players.sort((a,b)=> (a.rank||Infinity) - (b.rank||Infinity));
        playerId = players[0].id;
        // update URL so refresh keeps correct player
        history.replaceState(null, "", `player.html?id=${playerId}`);
    }

    const player = players.find(p => p.id === playerId);
    if (!player) return;

    // populate player info
    document.getElementById("playerName").textContent = player.name;
    const infoDiv = document.getElementById("info");
    infoDiv.innerHTML = `
        ${player.country ? `<img src="assets/flags/${player.country.toLowerCase()}.png" class="flag-big">` : ""}
        <p>GD Username: ${player.gdUsername ?? ""}</p>
        <p>Clan: ${player.clan ?? ""}</p>
        <p>Rank: #${player.rank ?? "?"}</p>
        <p>List Points: ${player.listPoints ?? 0}</p>
        <p>Hardest Demon: ${player.hardest ? `<a href="demon.html?id=${encodeURIComponent(player.hardest)}">${player.hardest}</a>` : "—"}</p>
    `;

    // populate completed demons
    const completionsDiv = document.getElementById("completions");
    completionsDiv.innerHTML = "";
    const demons = await fetch("data/demons.json").then(r => r.json());
    (player.beatenDemons || []).forEach(did => {
        const demon = demons.find(d => d.id === did);
        if (!demon) return;
        const div = document.createElement("div");
        div.className = "list-entry";
        div.innerHTML = `<a href="demon.html?id=${encodeURIComponent(demon.id)}">${demon.name}</a>`;
        completionsDiv.appendChild(div);
    });
}

async function setNavToFirstPlayer() {
    const players = await fetch("data/players.json").then(r => r.json());
    if (!players || players.length === 0) return;
    players.sort((a,b)=> (a.rank||Infinity) - (b.rank||Infinity));
    const link = document.getElementById("nav-first-player");
    if (link) link.href = `player.html?id=${encodeURIComponent(players[0].id)}`;
}

/* ========== ADMIN (localStorage only) ========== */
async function initAdmin() {
    await setNavToFirstPlayer();
    // load site JSON files into editors by default
    await loadAdminFromFiles();
}

async function loadAdminFromFiles() {
    // fetch files and place raw JSON into editors
    const demons = await fetch("data/demons.json").then(r=>r.ok? r.json(): []).catch(()=>[]);
    const players = await fetch("data/players.json").then(r=>r.ok? r.json(): []).catch(()=>[]);
    const records = await fetch("data/records.json").then(r=>r.ok? r.json(): []).catch(()=>[]);

    document.getElementById("demonsEditor").value = JSON.stringify(demons, null, 2);
    document.getElementById("playersEditor").value = JSON.stringify(players, null, 2);
    document.getElementById("recordsEditor").value = JSON.stringify(records, null, 2);
}

function loadAdminFromLocalStorage() {
    const ld = localStorage.getItem("demonlist_demons");
    const lp = localStorage.getItem("demonlist_players");
    const lr = localStorage.getItem("demonlist_records");

    if (ld) document.getElementById("demonsEditor").value = JSON.stringify(JSON.parse(ld), null, 2);
    if (lp) document.getElementById("playersEditor").value = JSON.stringify(JSON.parse(lp), null, 2);
    if (lr) document.getElementById("recordsEditor").value = JSON.stringify(JSON.parse(lr), null, 2);
    alert("Loaded saved edits from localStorage to editors (if any).");
}

function saveAdminData(which) {
    try {
        if (which === "demons") {
            const txt = document.getElementById("demonsEditor").value;
            const parsed = JSON.parse(txt);
            localStorage.setItem("demonlist_demons", JSON.stringify(parsed));
            alert("Saved demons to localStorage.");
        } else if (which === "players") {
            const txt = document.getElementById("playersEditor").value;
            const parsed = JSON.parse(txt);
            localStorage.setItem("demonlist_players", JSON.stringify(parsed));
            alert("Saved players to localStorage.");
        } else if (which === "records") {
            const txt = document.getElementById("recordsEditor").value;
            const parsed = JSON.parse(txt);
            localStorage.setItem("demonlist_records", JSON.stringify(parsed));
            alert("Saved records to localStorage.");
        }
    } catch (e) {
        alert("Invalid JSON — fix the editor content first.\n" + e.message);
    }
}

function exportAdminData(which) {
    try {
        let filename = which + ".json";
        let content;
        if (which === "demons") content = document.getElementById("demonsEditor").value;
        if (which === "players") content = document.getElementById("playersEditor").value;
        if (which === "records") content = document.getElementById("recordsEditor").value;

        // validate JSON
        JSON.parse(content);

        const blob = new Blob([content], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (e) {
        alert("Invalid JSON — cannot export.\n" + e.message);
    }
}

function clearAdminLocalStorage() {
    if (!confirm("Clear all localStorage edits? This will make the site use the static files again.")) return;
    localStorage.removeItem("demonlist_demons");
    localStorage.removeItem("demonlist_players");
    localStorage.removeItem("demonlist_records");
    alert("Cleared local edits. Reload the site to see static files again.");
}

/* ========== Helpers ========== */
function escapeHtml(str) {
    if (str === undefined || str === null) return "";
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;");
}
function escapeAttr(str) {
    if (str === undefined || str === null) return "";
    return String(str).replaceAll('"','&quot;').replaceAll("'", '&#39;');
}
