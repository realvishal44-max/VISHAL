// ============================================
// BATCH PAGE JAVASCRIPT
// ============================================

/**
 * Initialize batch page with specific batch ID and data
 */
function initBatchPage(batchId, batchIcon, batchName) {
    // Update page title
    document.title = `${batchName} | Elite Plus`;
    
    // Load content from Firebase
    loadBatchPageContent(batchId);
    
    // Set up real-time listener for updates
    setupBatchPageListener(batchId);
}

/**
 * Load all content for the batch from Firebase
 */
function loadBatchPageContent(batchId) {
    const sections = ['notes', 'dpp', 'videos', 'live'];
    
    sections.forEach(sectionType => {
        loadBatchSectionContent(batchId, sectionType);
    });
}

/**
 * Load specific section content from Firebase
 */
function loadBatchSectionContent(batchId, sectionType) {
    const db = firebase.database();
    const ref = db.ref(`elitePlus/${batchId}/${sectionType}`);
    
    ref.once('value', (snapshot) => {
        const data = snapshot.val();
        const containerMap = {
            'notes': 'notesContainer',
            'dpp': 'dppContainer',
            'videos': 'videosContainer',
            'live': 'liveContainer'
        };
        
        const countMap = {
            'notes': document.querySelector('#notesSection .section-count'),
            'dpp': document.querySelector('#dppSection .section-count'),
            'videos': document.querySelector('#videosSection .section-count'),
            'live': document.querySelector('#liveSection .section-count')
        };
        
        const containerId = containerMap[sectionType];
        const container = document.getElementById(containerId);
        const countElement = countMap[sectionType];
        
        if (data) {
            const items = Object.values(data);
            container.innerHTML = '';
            
            items.forEach((item, index) => {
                const contentElement = createContentItem(item);
                container.appendChild(contentElement);
            });
            
            // Update count
            if (countElement) {
                countElement.textContent = items.length;
            }
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <h3>No content yet</h3>
                    <p>Content will be added soon</p>
                </div>
            `;
            if (countElement) {
                countElement.textContent = '0';
            }
        }
    }).catch((error) => {
        console.error('Error loading batch content:', error);
    });
}

/**
 * Create a content item DOM element
 */
function createContentItem(item) {
    const div = document.createElement('div');
    div.className = 'content-item';
    
    const title = item.title || 'Untitled';
    const link = item.link || '#';
    const uploadedAt = new Date(item.uploadedAt).toLocaleDateString('en-IN');
    
    div.innerHTML = `
        <h3 class="content-item-title">${title}</h3>
        <a href="${link}" target="_blank" rel="noopener noreferrer" class="content-item-link">
            Open Link
        </a>
        <div class="content-item-meta">
            📅 Added: ${uploadedAt}
        </div>
    `;
    
    return div;
}

/**
 * Set up real-time listener for batch updates
 */
function setupBatchPageListener(batchId) {
    const db = firebase.database();
    const ref = db.ref(`elitePlus/${batchId}`);
    
    ref.on('child_changed', (snapshot) => {
        const sectionType = snapshot.key;
        console.log(`Updates in ${sectionType}`);
        loadBatchSectionContent(batchId, sectionType);
    });
    
    ref.on('child_added', (snapshot) => {
        const sectionType = snapshot.key;
        // Only update if this is a new section (not already loaded)
        const container = document.getElementById(`${sectionType}Container`);
        if (container && container.querySelector('.empty-state')) {
            loadBatchSectionContent(batchId, sectionType);
        }
    });
}

/**
 * Get batch data by ID
 */
function getBatchData(batchId) {
    const ELITE_PLUS_BATCHES = {
        "c-programming": {
            name: "C Programming",
            icon: "⌨️",
            subtitle: "Master the fundamentals of C",
            sections: ["notes", "dpp", "videos", "live"]
        },
        "cpp": {
            name: "C++",
            icon: "🚀",
            subtitle: "Object-oriented programming",
            sections: ["notes", "dpp", "videos", "live"]
        },
        "java": {
            name: "Java",
            icon: "☕",
            subtitle: "Enterprise Java programming",
            sections: ["notes", "dpp", "videos", "live"]
        },
        "javascript": {
            name: "JavaScript",
            icon: "✨",
            subtitle: "Web development with JavaScript",
            sections: ["notes", "dpp", "videos", "live"]
        },
        "python": {
            name: "Python",
            icon: "🐍",
            subtitle: "Versatile Python programming",
            sections: ["notes", "dpp", "videos", "live"]
        },
        "dsa": {
            name: "Data Structures & Algorithms",
            icon: "🌲",
            subtitle: "Master DSA concepts",
            sections: ["notes", "dpp", "videos", "live"]
        },
        "web-development": {
            name: "Web Development",
            icon: "🌐",
            subtitle: "Complete web development",
            sections: ["notes", "dpp", "videos", "live"]
        },
        "react-js": {
            name: "React JS",
            icon: "⚛️",
            subtitle: "Modern frontend with React",
            sections: ["notes", "dpp", "videos", "live"]
        },
        "node-js": {
            name: "Node JS",
            icon: "🔧",
            subtitle: "Backend development",
            sections: ["notes", "dpp", "videos", "live"]
        },
        "sql-database": {
            name: "SQL & Database",
            icon: "🗄️",
            subtitle: "Database mastery",
            sections: ["notes", "dpp", "videos", "live"]
        }
    };
    
    return ELITE_PLUS_BATCHES[batchId];
}

/**
 * Handle scroll to top
 */
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll for back button
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', (e) => {
            // Navigation is handled by href, no need for special handling
        });
    }
    
    // Add scroll-to-top functionality
    const scrollButton = document.createElement('button');
    scrollButton.id = 'scrollToTop';
    scrollButton.className = 'scroll-to-top';
    scrollButton.innerHTML = '⬆️';
    scrollButton.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg, #8b5cf6, #3b82f6);
        color: white;
        font-size: 20px;
        cursor: pointer;
        display: none;
        z-index: 1000;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
    `;
    
    document.body.appendChild(scrollButton);
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollButton.style.display = 'flex';
            scrollButton.style.alignItems = 'center';
            scrollButton.style.justifyContent = 'center';
        } else {
            scrollButton.style.display = 'none';
        }
    });
    
    scrollButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    scrollButton.addEventListener('mouseover', () => {
        scrollButton.style.transform = 'scale(1.1)';
        scrollButton.style.boxShadow = '0 6px 25px rgba(139, 92, 246, 0.4)';
    });
    
    scrollButton.addEventListener('mouseout', () => {
        scrollButton.style.transform = 'scale(1)';
        scrollButton.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)';
    });
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initBatchPage,
        loadBatchPageContent,
        loadBatchSectionContent,
        getBatchData,
        createContentItem
    };
}
