
const festivalsData = [
    { region: "Auvergne-Rhône-Alpes", festivals: 580 },
    { region: "Bourgogne-Franche-Comté", festivals: 220 },
    { region: "Bretagne", festivals: 310 },
    { region: "Centre-Val de Loire", festivals: 190 },
    { region: "Grand Est", festivals: 260 },
    { region: "Hauts-de-France", festivals: 270 },
    { region: "Île-de-France", festivals: 620 },
    { region: "Normandie", festivals: 210 },
    { region: "Nouvelle-Aquitaine", festivals: 480 },
    { region: "Occitanie", festivals: 450 },
    { region: "Pays de la Loire", festivals: 250 },
    { region: "Provence-Alpes-Côte d’Azur", festivals: 390 },
    { region: "Corse", festivals: 24 }
];

const corseDetailedData = [
    { label: "Musiques actuelles", count: 13 },
    { label: "Cinéma et audiovisuel", count: 7 },
    { label: "Livre et littérature", count: 2 },
    { label: "Musiques classiques", count: 1 },
    { label: "Théâtre", count: 1 }
];

function renderCards(containerId, data, labelKey, valueKey) {
    const container = document.getElementById(containerId);
    if(!container) return;
    container.innerHTML = '';
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'country-card';
        card.innerHTML = `<h3>${item[labelKey]}</h3><p>${item[valueKey]} Festivals</p>`;
        container.appendChild(card);
    });
}

function createChart(ctxId, data, labelKey, valueKey, barColor) {
    const el = document.getElementById(ctxId);
    if(!el) return null;
    const ctx = el.getContext('2d');
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d[labelKey]),
            datasets: [{
                data: data.map(d => d[valueKey]),
                backgroundColor: barColor,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { 
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { ticks: { color: '#fff' } }
            }
        }
    });
}

// fonction unique pour animer chiffre
function animateNumber(element, target) {
    let count = 0;
    const duration = 2000; // 2 secondes
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = progress * (2 - progress);
        
        element.innerText = Math.floor(easeProgress * target);

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.innerText = target;
        }
    }
    requestAnimationFrame(update);
}

document.addEventListener('DOMContentLoaded', () => {
    renderCards('countries-grid', festivalsData, 'region', 'festivals');
    renderCards('corsica-grid', corseDetailedData, 'label', 'count');
    const mainChart = createChart('barChart', festivalsData, 'region', 'festivals', '#ff416c');
    const corseChart = createChart('corsicaChart', corseDetailedData, 'label', 'count', '#2ecc71');

    // recherche
    const searchInput = document.getElementById('searchInput');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredData = festivalsData.filter(item => item.region.toLowerCase().includes(searchTerm));
            renderCards('countries-grid', filteredData, 'region', 'festivals');
            if(mainChart) {
                mainChart.data.labels = filteredData.map(d => d.region);
                mainChart.data.datasets[0].data = filteredData.map(d => d.festivals);
                mainChart.update();
            }
        });
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                const counter = entry.target.querySelector('.counter-scroll') || 
                                (entry.target.classList.contains('counter-scroll') ? entry.target : null);
                
                if (counter && !counter.classList.contains('animated')) {
                    const targetValue = parseInt(counter.getAttribute('data-target'));
                    animateNumber(counter, targetValue);
                    counter.classList.add('animated'); 
                }
            }
        });
    }, { threshold: 0.2 });

    const idfBlock = document.getElementById('reveal-idf');
    if(idfBlock) observer.observe(idfBlock);

    document.querySelectorAll('.info-block, .country-card, .counter-scroll').forEach(el => {
        observer.observe(el);
    });

   
});


document.addEventListener('DOMContentLoaded', () => {
    initMap();
});
const regionData = {
    "Bretagne": { 
        count: 324, 
        desc: "Championne des musiques actuelles (53% de son offre). C'est la région avec la plus forte identité de festivals associatifs et bénévoles.", 
        color: "#ff416c" 
    },
    "Nouvelle-Aquitaine": { 
        count: 310, 
        desc: "Se distingue par une part très élevée de festivals dédiés au Livre et à la BD (Angoulême) et aux musiques du monde.", 
        color: "#3498db" 
    },
    "Occitanie": { 
        count: 340, 
        desc: "Bastion du Jazz (Marciac) et des Arts de la Rue. C'est la région qui possède le plus grand nombre de festivals classés 'Lieu de création'.", 
        color: "#f1c40f" 
    },
    "Provence-Alpes-Côte d'Azur": { 
        count: 285, 
        desc: "Reine du spectacle vivant. Elle concentre les plus grands rendez-vous mondiaux de Théâtre (Avignon) et d'Art Lyrique (Aix).", 
        color: "#2ecc71" 
    },
    "Île-de-France": { 
        count: 620, 
        desc: "Une offre unique de festivals de Cinéma (près de 10% de l'offre nationale) et une domination du Jazz et des musiques urbaines.", 
        color: "#e74c3c" 
    },
    "Grand Est": { 
        count: 245, 
        desc: "Une région marquée par les festivals transfrontaliers et une forte présence de la Musique Classique et des Arts du Cirque.", 
        color: "#9b59b6" 
    },
    "Auvergne-Rhône-Alpes": { 
        count: 380, 
        desc: "Deuxième région de France. Elle brille par ses festivals de Musique Classique en milieu rural et ses grands événements de Jazz.", 
        color: "#1abc9c" 
    },
    "Bourgogne-Franche-Comté": { 
        count: 165, 
        desc: "Spécialiste de la Musique Baroque et de la Chanson française, souvent nichés dans des sites patrimoniaux exceptionnels.", 
        color: "#e67e22" 
    },
    "Hauts-de-France": { 
        count: 195, 
        desc: "Terre de festivals de 'Musiques Amplifiées' et de rock, avec une politique forte de soutien aux cultures urbaines.", 
        color: "#34495e" 
    },
    "Normandie": { 
        count: 170, 
        desc: "Connu pour ses festivals de Cinéma de renommée (Deauville, Cabourg) et ses événements d'Arts de la Rue sur le littoral.", 
        color: "#7f8c8d" 
    },
    "Centre-Val de Loire": { 
        count: 140, 
        desc: "La région où la musique domine le plus l'offre culturelle (57%). Très axée sur la Chanson Française et la Variété.", 
        color: "#27ae60" 
    },
    "Pays de la Loire": { 
        count: 210, 
        desc: "Un pôle majeur pour les musiques extrêmes (Hellfest) mais aussi pour la diffusion de la Musique Classique (La Folle Journée).", 
        color: "#d35400" 
    },
    "Corse": { 
        count: 24, 
        desc: "Plus forte densité de festivals par habitant. Spécialisée dans les Polyphonies et la préservation du patrimoine immatériel.", 
        color: "#2ecc71" 
    }
};


document.querySelectorAll('.france a').forEach(link => {
    link.addEventListener('mouseenter', function() {
        const regionName = this.getAttribute('title'); 
        const data = regionData[regionName] || { count: "ND", desc: "Données en cours de chargement...", color: "#fff" };

        const panel = document.getElementById('region-info-panel');
        document.getElementById('info-region-name').innerText = regionName;
        document.getElementById('info-region-count').innerText = data.count;
        document.getElementById('info-region-desc').innerText = data.desc;
        
        document.getElementById('info-region-count').style.color = data.color;
        panel.style.borderColor = data.color;
    });
});

async function loadEvolutionChart() {
    try {
        const response = await fetch('festivals-global-festivals-_-pl.csv');
        const data = await response.text();
        const rows = data.split('\n').filter(row => row.trim() !== "");
        
        const headers = rows[0].split(';');
        const yearIndex = headers.findIndex(h => h.toLowerCase().includes('année'));
        
        const yearsCount = {};
        rows.slice(1).forEach(row => {
            const columns = row.split(';');
            const year = columns[yearIndex] ? columns[yearIndex].trim() : null;
            if (year && !isNaN(year) && year > 1900 && year < 2025) {
                yearsCount[year] = (yearsCount[year] || 0) + 1;
            }
        });

        const sortedYears = Object.keys(yearsCount).sort();
        const canvas = document.getElementById('evolutionChart');
        if (!canvas) return;

        new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: sortedYears,
                datasets: [{
                    label: 'Festivals créés',
                    data: sortedYears.map(y => yearsCount[y]),
                    borderColor: '#ff416c',
                    backgroundColor: 'rgba(255, 65, 108, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    x: { ticks: { color: '#fff' }, grid: { display: false } }
                }
            }
        });
    } catch (e) { console.error("Erreur Evolution:", e); }
}

async function loadSeasonChart() {
    try {
        const response = await fetch('festivals-global-festivals-_-pl.csv');
        const data = await response.text();
        const rows = data.split('\n').filter(row => row.trim() !== "");

        const headers = rows[0].split(';');
        const periodIndex = headers.findIndex(h => h.toLowerCase().includes('période'));

        let ete = 0;
        let resteDeAnnee = 0;

        rows.slice(1).forEach(row => {
            const columns = row.split(';');
            const periode = columns[periodIndex] ? columns[periodIndex].toLowerCase() : "";

            if (periode.includes("saison") && !periode.includes("après") && !periode.includes("avant")) {
                ete++;
            } else if (periode.trim() !== "") {
                resteDeAnnee++;
            }
        });

        const canvas = document.getElementById('seasonChart');
        if (!canvas) return;

        new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Été (Juin-Sept)', 'Reste de l\'année'],
                datasets: [{
                    data: [ete, resteDeAnnee],
                    backgroundColor: ['#f1c40f', '#95a5a6'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { color: '#fff' } },
                    x: { ticks: { color: '#fff' } }
                }
            }
        });
    } catch (e) { console.error("Erreur Saison:", e); }
}

loadEvolutionChart();
loadSeasonChart();

async function loadCorseChart() {
    try {
        const response = await fetch('panorama-des-festivals-en-corse.csv');
        const data = await response.text();
        const rows = data.split('\n').slice(1);

        const domaineCounts = {};

        rows.forEach(row => {
            const columns = row.split(';');
            const domaine = columns[2] ? columns[2].trim() : "";

            if (domaine && domaine !== "") {
                domaineCounts[domaine] = (domaineCounts[domaine] || 0) + 1;
            }
        });

        const labels = Object.keys(domaineCounts);
        const values = Object.values(domaineCounts);

        const ctx = document.getElementById('corseDonutChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut', 
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    
backgroundColor: [
    '#2ecc71', 
    '#3498db', 
    '#e74c3c', 
    '#f1c40f',
    '#9b59b6', 
    '#e67e22', 
    '#1abc9c'  
],

borderColor: '#0a0a0a' 
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#fff', font: { size: 12 } }
                    }
                },
                cutout: '60%' 
            }
        });
    } catch (error) {
        console.error("Erreur graphique Corse :", error);
    }
}

loadCorseChart();
async function loadCorseRadarChart() {
    try {
        const response = await fetch('panorama-des-festivals-en-corse.csv');
        const data = await response.text();
        const rows = data.split('\n').slice(1);

        const monthsCount = new Array(12).fill(0);
        const monthLabels = ['Janv', 'Fév', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

        rows.forEach(row => {
            const columns = row.split(';');
            const moisTexte = columns[6] ? columns[6].trim() : ""; 
            
            const monthMatch = moisTexte.match(/\d+/);
            if (monthMatch) {
                const monthIndex = parseInt(monthMatch[0]) - 1;
                if (monthIndex >= 0 && monthIndex < 12) {
                    monthsCount[monthIndex]++;
                }
            }
        });

        const ctx = document.getElementById('corseSeasonRadarChart').getContext('2d');
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: monthLabels,
                datasets: [{
                    label: 'Nombre de festivals',
                    data: monthsCount,
                    backgroundColor: 'rgba(46, 204, 113, 0.2)',
                    borderColor: '#2ecc71',
                    pointBackgroundColor: '#2ecc71',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255,255,255,0.1)' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        pointLabels: { color: '#fff', font: { size: 12 } },
                        ticks: { display: false, backdropColor: 'transparent' }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    } catch (error) {
        console.error("Erreur radar :", error);
    }
}
loadCorseRadarChart();
async function renderCorseDeptChart() {
    try {
        const response = await fetch('panorama-des-festivals-en-corse.csv');
        const data = await response.text();

        let hauteCorse = 0;
        let corseDuSud = 0;

        const rows = data.split('\n').slice(1);

        rows.forEach(row => {
            const columns = row.split(';');
            const dept = columns[26] ? columns[26].trim() : "";

            if (dept === "Haute-Corse") {
                hauteCorse++;
            } else if (dept === "Corse-du-Sud") {
                corseDuSud++;
            }
        });

        const ctx = document.getElementById('corseDeptPieChart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Haute-Corse', 'Corse-du-Sud'],
                datasets: [{
                    data: [hauteCorse, corseDuSud],
                    backgroundColor: ['#2ecc71', '#27ae60'],
                    borderColor: '#0a0a0a',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#fff' }
                    }
                }
            }
        });
    } catch (error) {
        console.error("Erreur lors du chargement des départements :", error);
    }
}

renderCorseDeptChart();