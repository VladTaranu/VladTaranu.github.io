const totalFiles = 13; 
let type = 'acasa'; 
let page = 1; 
const filesPerPage = 6; 
let totalPages = Math.ceil(totalFiles / filesPerPage); 

function updateHeader() {
    const headerButtons = document.querySelectorAll('.navbar-nav .nav-link');
    headerButtons.forEach(button => {
        const buttonType = button.textContent.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); 
        if (buttonType === type) {
            button.classList.add('active'); 
        } else {
            button.classList.remove('active'); 
        }
    });
}

function updatePagination() {
    const pagination = document.querySelector('.pagination');
    const contentPanel = document.querySelector('#contentPanel');

    // Hide pagination if contentPanel is visible (view mode) or if the type is "contact" or "adeziune"
    if ((contentPanel && contentPanel.style.display === 'block') || type === 'contact' || type === 'adeziune') {
        pagination.style.display = 'none';
    } else {
        pagination.style.display = 'flex';
    }

    const paginationItems = document.querySelectorAll('.pagination .page-item');
    paginationItems.forEach(item => {
        const pageNumber = parseInt(item.textContent, 10);
        if (pageNumber === page) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    const firstButton = document.querySelector('.pagination .page-item:first-child');
    const lastButton = document.querySelector('.pagination .page-item:last-child');
    if (page === 1) {
        firstButton.classList.add('disabled');  
        lastButton.classList.remove('disabled'); 
    } else if (page === totalPages) {
        lastButton.classList.add('disabled'); 
        firstButton.classList.remove('disabled'); 
    } else {
        firstButton.classList.remove('disabled');
        lastButton.classList.remove('disabled');
    }    
    logMarkdownMetadata();
}

async function logMarkdownMetadata() {
    console.clear(); 
    console.log(`Found ${totalFiles} markdown files`);
    const cardElements = document.querySelectorAll('.col-md-6 .card'); 
    const recentCarousel = document.querySelector('#recentCarousel');
    recentCarousel.style.display = (page === 1 && type === 'acasa') ? 'block' : 'none';
    if (recentCarousel.style.display === 'block') {
        const carouselFile1 = 1;
        const carouselFile2 = 2;
        const carouselFile3 = 3;
        const carouselFiles = [carouselFile1, carouselFile2, carouselFile3];
        const carouselItems = recentCarousel.querySelectorAll('.carousel-item');
        for (let j = 0; j < carouselFiles.length && j < carouselItems.length; j++) {
            const filePath = `https://vladtaranu.github.io//content/${carouselFiles[j]}.md`;
            const metadata = await fetchMarkdownFile(filePath);
            if (metadata) {
                const carouselItem = carouselItems[j];
                const cardLink = carouselItem.querySelector('a');
                const cardImg = carouselItem.querySelector('.card-img-top');
                const cardBody = carouselItem.querySelector('.card-body');
                const cardDate = cardBody.querySelector('.small');
                const cardTitle = cardBody.querySelector('.card-title');
                const cardText = cardBody.querySelector('.card-text');
                cardImg.src = metadata.cover || cardImg.src;
                cardTitle.textContent = metadata.title || cardTitle.textContent;
                cardDate.textContent = `${metadata.date} · ${metadata.type || 'Blog'}`;
                cardText.textContent = metadata.summary || cardText.textContent;
            }
        }
    }
    if (cardElements.length < filesPerPage) {
        console.warn('Not enough card elements available');
        return;
    }
    let matchingFiles = [];
    for (let i = 0; i < totalFiles; i++) {
        const filePath = `https://vladtaranu.github.io//content/${i + 1}.md`;
        const metadata = await fetchMarkdownFile(filePath);
        if (metadata) {
            if (type === 'acasa' || metadata.type.toLowerCase() === type) {
                matchingFiles.push({ metadata, index: i + 1 });
            }
        }
    }
    matchingFiles.sort((a, b) => b.index - a.index);
    const totalMatching = matchingFiles.length;
    totalPages = Math.ceil(totalMatching / filesPerPage);
    const paginationItems = document.querySelectorAll('.pagination .page-item');
    const numericPageItem = paginationItems[paginationItems.length - 2];
    numericPageItem.querySelector('.page-link').textContent = totalPages;
    const startIdx = (page - 1) * filesPerPage;
    const endIdx = Math.min(startIdx + filesPerPage, totalMatching);
    if (startIdx >= totalMatching) {
        console.warn("No matching files for the current page");
        cardElements.forEach(card => card.style.display = 'none');
        return;
    }
    let cardIndex = 0;
    for (let i = startIdx; i < endIdx; i++) {
        const { metadata, index } = matchingFiles[i];
        console.log(`Metadata for file ${index}:`);
        console.log(`Title: ${metadata.title}`);
        console.log(`Summary: ${metadata.summary}`);
        console.log(`Type: ${metadata.type}`);
        console.log(`Date: ${metadata.date}`);
        console.log(`Cover: ${metadata.cover}`);
        const card = cardElements[cardIndex];
        if (card) {
            card.setAttribute('data-file-index', index); // Assign the correct file index
            card.style.display = 'block';
            const cardImg = card.querySelector('.card-img-top');
            const cardTitle = card.querySelector('.card-title');
            const cardDate = card.querySelector('.small');
            const cardText = card.querySelector('.card-text');
            cardImg.src = metadata.cover || './res/preview1.jpg'; 
            cardTitle.textContent = metadata.title || 'Titlu';
            cardDate.textContent = `${metadata.date} · ${metadata.type || 'Blog'}`;
            cardText.textContent = metadata.summary || 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Reiciendis aliquid atque, nulla.';
        }
        cardIndex++;
    }
    for (let i = cardIndex; i < cardElements.length; i++) {
        cardElements[i].style.display = 'none';
    }
}

async function displayMarkdownContent(filePath, updateUrl = true) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${filePath}`);
        }
        const text = await response.text();
        const content = text.replace(/^---\n[\s\S]+?\n---/, '').trim();
        const cardElements = document.querySelectorAll('.col-md-6 .card');
        cardElements.forEach(card => card.style.display = 'none'); // Hide all cards
        const recentCarousel = document.querySelector('#recentCarousel');
        recentCarousel.style.display = 'none';
        let contentPanel = document.querySelector('#contentPanel');
        if (!contentPanel) {
            contentPanel = document.createElement('div');
            contentPanel.id = 'contentPanel';
            contentPanel.classList.add('card', 'mb-4');
            document.querySelector('.container1 .row').appendChild(contentPanel);
        }
        if (typeof showdown !== 'undefined') {
            const converter = new showdown.Converter();
            const htmlContent = converter.makeHtml(content);
            contentPanel.innerHTML = `<div class="card-body">${htmlContent}</div>`;
        } else {
            console.error('showdown is not defined');
            contentPanel.innerHTML = `<div class="card-body">Error: Unable to load content</div>`;
        }
        contentPanel.style.display = 'block';

        // Hide pagination when displaying content
        const pagination = document.querySelector('.pagination');
        pagination.style.display = 'none';

        // Update the URL with the postare parameter
        if (updateUrl) {
            const postIndex = filePath.match(/(\d+)\.md$/)[1];
            const newUrl = postIndex === '1' ? `${window.location.origin}` : `${window.location.origin}/?postare=${postIndex}`;
            history.pushState({ filePath }, '', newUrl);
        }
    } catch (error) {
        console.error(error);
    }
}

function loadContent(type) {
    const filePath = `/content/${type}.md`;
    displayMarkdownContent(filePath);
    const newUrl = `${window.location.origin}/${type}`;
    history.pushState({}, '', newUrl);
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postIndex = urlParams.get('postare');
    const pageIndex = urlParams.get('pagina');
    const typeParam = window.location.pathname.split('/').pop();

    if (typeParam && typeParam !== 'index.html') {
        type = typeParam;
    }

    if (pageIndex) {
        page = parseInt(pageIndex, 10);
    }

    if (postIndex) {
        displayMarkdownContent(`https://vladtaranu.github.io//content/${postIndex}.md`);
    } else if (type === 'obiective' || type === 'manifest') {
        displayMarkdownContent(`/content/${type}.md`, false);
    } else {
        const contentPanel = document.querySelector('#contentPanel');
        const contactPanel = document.querySelector('#contactPanel');
        const adeziunePanel = document.querySelector('#adeziunePanel');
        if (contentPanel) {
            contentPanel.style.display = 'none';
        }
        if (contactPanel) {
            contactPanel.style.display = type === 'contact' ? 'block' : 'none';
        }
        if (adeziunePanel) {
            adeziunePanel.style.display = type === 'adeziune' ? 'block' : 'none';
        }
        updateHeader();
        updatePagination();
        logMarkdownMetadata();
    }
});

document.querySelectorAll('.navbar-nav .nav-link, .btn.update-url').forEach(button => {
    button.addEventListener('click', (event) => {
        event.preventDefault(); 
        const selectedType = event.target.textContent.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ /g, '-'); 

        // Only call loadContent for specific buttons
        if (selectedType === 'obiective' || selectedType === 'manifest') {
            loadContent(selectedType);
        } else {
            type = selectedType;
            page = 1; 
            console.log(`Header button clicked! Type: ${type}, Page: ${page}`);
            updateHeader(); 

            // Hide the content panel when changing types
            const contentPanel = document.querySelector('#contentPanel');
            const contactPanel = document.querySelector('#contactPanel');
            const adeziunePanel = document.querySelector('#adeziunePanel');
            if (contentPanel) {
                contentPanel.style.display = 'none';
            }
            if (contactPanel) {
                contactPanel.style.display = type === 'contact' ? 'block' : 'none';
            }
            if (adeziunePanel) {
                adeziunePanel.style.display = type === 'adeziune' ? 'block' : 'none';
            }

            updatePagination(); 
            logMarkdownMetadata(); 

            // Update the URL without the postare parameter
            const newUrl = type === 'acasa' ? `${window.location.origin}` : `${window.location.origin}/${type}`;
            history.pushState({}, '', newUrl);
        }
    });
});

document.querySelectorAll('.pagination .page-item').forEach(button => {
    button.addEventListener('click', (event) => {
        event.preventDefault(); 
        if (!event.target.classList.contains('disabled')) {
            const selectedPage = parseInt(event.target.textContent, 10);
            if (selectedPage) {
                page = selectedPage;
                console.log(`Pagination button clicked! Type: ${type}, Page: ${page}`);
                updatePagination(); 

                // Update the URL with the page parameter
                const newUrl = type === 'acasa' ? (page === 1 ? `${window.location.origin}` : `${window.location.origin}/?pagina=${page}`) : (page === 1 ? `${window.location.origin}/${type}` : `${window.location.origin}/${type}?pagina=${page}`);
                history.pushState({}, '', newUrl);
            }
        }
    });
});

document.querySelector('.pagination .page-item:last-child').addEventListener('click', (event) => {
    event.preventDefault();
    page = Math.ceil(totalFiles / filesPerPage); 
    console.log(`Noi button clicked! Type: ${type}, Page: ${page}`);
    updatePagination(); 

    // Update the URL with the page parameter
    const newUrl = type === 'acasa' ? `${window.location.origin}/?pagina=${page}` : `${window.location.origin}/${type}?pagina=${page}`;
    history.pushState({}, '', newUrl);
});

document.querySelector('.pagination .page-item:first-child').addEventListener('click', (event) => {
    event.preventDefault();
    page = 1; 
    console.log(`Vechi button clicked! Type: ${type}, Page: ${page}`);
    updatePagination(); 

    // Update the URL with the page parameter
    const newUrl = type === 'acasa' ? `${window.location.origin}` : `${window.location.origin}/${type}`;
    history.pushState({}, '', newUrl);
});

document.querySelectorAll('.card a, .card-img-top').forEach((element, index) => {
    element.addEventListener('click', (event) => {
        event.preventDefault();
        const fileIndex = element.closest('.card').getAttribute('data-file-index');
        displayMarkdownContent(`/content/${fileIndex}.md`);
    });
});

document.querySelectorAll('.card').forEach((element) => {
    element.addEventListener('click', (event) => {
        event.preventDefault();
        const fileIndex = element.getAttribute('data-file-index');
        displayMarkdownContent(`/content/${fileIndex}.md`);
    });
});

async function fetchMarkdownFile(filePath) {
    try {
        const response = await fetch(filePath); 
        if (!response.ok) {
            throw new Error(`Failed to fetch ${filePath}`);
        }
        const text = await response.text();
        const frontMatterRegex = /^---\n([\s\S]+?)\n---/;
        const match = text.match(frontMatterRegex);
        if (match && match[1]) {
            const metadata = match[1];
            const metadataObj = {};
            metadata.split("\n").forEach(line => {
                const [key, ...rest] = line.split(":").map(item => item.trim());
                if (key && rest.length > 0) {
                    const value = rest.join(":"); 
                    metadataObj[key] = value.replace(/"/g, ''); 
                }
            });
            return metadataObj;
        } else {
            throw new Error("No front matter found");
        }
    } catch (error) {
        console.error("Error fetching or parsing file:", error);
    }
}

window.addEventListener('popstate', (event) => {
    const urlParams = new URLSearchParams(window.location.search);
    const postIndex = urlParams.get('postare');
    const pageIndex = urlParams.get('pagina');
    const typeParam = window.location.pathname.split('/').pop();

    if (typeParam && typeParam !== 'index.html') {
        type = typeParam;
    }

    if (pageIndex) {
        page = parseInt(pageIndex, 10);
    }

    if (postIndex) {
        displayMarkdownContent(`https://vladtaranu.github.io//content/${postIndex}.md`);
    } else {
        const contentPanel = document.querySelector('#contentPanel');
        if (contentPanel) {
            contentPanel.style.display = 'none';
        }
        updateHeader();
        updatePagination();
        logMarkdownMetadata();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postIndex = urlParams.get('postare');
    const pageIndex = urlParams.get('pagina');
    const typeParam = window.location.pathname.split('/').pop();

    if (typeParam && typeParam !== 'index.html') {
        type = typeParam;
    }

    if (pageIndex) {
        page = parseInt(pageIndex, 10);
    }

    if (postIndex) {
        displayMarkdownContent(postIndex);
    } else {
        const contentPanel = document.querySelector('#contentPanel');
        const contactPanel = document.querySelector('#contactPanel');
        const adeziunePanel = document.querySelector('#adeziunePanel');
        if (contentPanel) {
            contentPanel.style.display = 'none';
        }
        if (contactPanel) {
            contactPanel.style.display = type === 'contact' ? 'block' : 'none';
        }
        if (adeziunePanel) {
            adeziunePanel.style.display = type === 'adeziune' ? 'block' : 'none';
        }
        updateHeader();
        updatePagination();
        logMarkdownMetadata();
    }
});

document.getElementById('contactForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    console.log(`Contact form submitted: Name: ${name}, Email: ${email}, Message: ${message}`);
    alert('Mesajul a fost trimis cu succes!');
    document.getElementById('contactForm').reset();
});

document.getElementById('adeziuneForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('adeziuneName').value;
    const prenume = document.getElementById('adeziunePrenume').value;
    const localitate = document.getElementById('adeziuneLocalitate').value;
    const judet = document.getElementById('adeziuneJudet').value;
    const varsta = document.getElementById('adeziuneVarsta').value;
    const email = document.getElementById('adeziuneEmail').value;
    const telefon = document.getElementById('adeziuneTelefon').value;
    const studii = document.getElementById('adeziuneStudii').value;
    const ocupatie = document.getElementById('adeziuneOcupatie').value;
    const motiv = document.getElementById('adeziuneMotiv').value;
    console.log(`Adeziune form submitted: Name: ${name}, Prenume: ${prenume}, Localitate: ${localitate}, Judet: ${judet}, Varsta: ${varsta}, Email: ${email}, Telefon: ${telefon}, Studii: ${studii}, Ocupatie: ${ocupatie}, Motiv: ${motiv}`);
    alert('Mesajul a fost trimis cu succes!');
    document.getElementById('adeziuneForm').reset();
});

document.getElementById('button-search').addEventListener('click', async (event) => {
    event.preventDefault();
    const searchTerm = document.querySelector('.input-group input').value.trim().toLowerCase();
    if (!searchTerm) {
        alert('Please enter a search term.');
        return;
    }

    const cardElements = document.querySelectorAll('.col-md-6 .card');
    const recentCarousel = document.querySelector('#recentCarousel');
    recentCarousel.style.display = 'none';

    let matchingFiles = [];
    for (let i = 0; i < totalFiles; i++) {
        const filePath = `https://vladtaranu.github.io//content/${i + 1}.md`;
        const metadata = await fetchMarkdownFile(filePath);
        if (metadata) {
            const content = await fetch(filePath).then(response => response.text());
            if (content.toLowerCase().includes(searchTerm) || metadata.title.toLowerCase().includes(searchTerm) || metadata.summary.toLowerCase().includes(searchTerm)) {
                matchingFiles.push({ metadata, index: i + 1 });
            }
        }
    }

    matchingFiles.sort((a, b) => b.index - a.index);
    const totalMatching = matchingFiles.length;
    const resultText = document.createElement('p');
    resultText.textContent = `Found ${totalMatching} results for "${searchTerm}"`;
    document.querySelector('.container1 .row').insertBefore(resultText, document.querySelector('.col-lg-8'));

    if (totalMatching === 0) {
        console.warn("No matching files found");
        cardElements.forEach(card => card.style.display = 'none');
        return;
    }

    let cardIndex = 0;
    for (let i = 0; i < totalMatching && cardIndex < cardElements.length; i++) {
        const { metadata, index } = matchingFiles[i];
        const card = cardElements[cardIndex];
        if (card) {
            card.setAttribute('data-file-index', index);
            card.style.display = 'block';
            const cardImg = card.querySelector('.card-img-top');
            const cardTitle = card.querySelector('.card-title');
            const cardDate = card.querySelector('.small');
            const cardText = card.querySelector('.card-text');
            cardImg.src = metadata.cover || './res/preview1.jpg';
            cardTitle.textContent = metadata.title || 'Titlu';
            cardDate.textContent = `${metadata.date} · ${metadata.type || 'Blog'}`;
            cardText.textContent = metadata.summary || 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Reiciendis aliquid atque, nulla.';
        }
        cardIndex++;
    }

    for (let i = cardIndex; i < cardElements.length; i++) {
        cardElements[i].style.display = 'none';
    }
});
