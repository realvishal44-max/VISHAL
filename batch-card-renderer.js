// ============================================================
// BATCH CARD RENDERER - Universal Batch Rendering Module
// ============================================================
// Renders unified batch cards across all pages
// Ensures consistent UI and functionality everywhere
// ============================================================

/**
 * Batch Card Renderer - Unified batch card rendering across the platform
 */
class BatchCardRenderer {
  /**
   * Generate batch card HTML
   * @param {string} batchId - Batch ID
   * @param {object} batchData - Batch data
   * @param {object} options - Rendering options
   * @returns {string} HTML for batch card
   */
  static renderBatchCard(batchId, batchData, options = {}) {
    const {
      showEnrollBtn = true,
      showDetailsLink = true,
      onEnroll = null,
      onDetails = null,
      className = 'batch-card',
      style = ''
    } = options;

    const isElite = batchData.isElitePlus || batchData.badge === 'Elite+';
    const enrolled = JSON.parse(localStorage.getItem('enrolledBatches') || '[]');
    const isEnrolled = enrolled.includes(batchId);

    const thumbnail = batchData.thumbnail || '';
    const icon = batchData.icon || '📚';
    const color = batchData.color || '#3b82f6';
    const badge = batchData.badge || (isElite ? 'Elite+' : 'BCA');

    let html = `
      <div class="${className} batch-card-container" data-batch-id="${batchId}" style="${style}">
        <div class="batch-card-wrapper" style="border-color: ${color}20;">
          <!-- Card Header with Badge -->
          <div class="batch-card-header" style="background: linear-gradient(135deg, ${color}15 0%, ${color}05 100%);">
            <div class="batch-card-thumbnail">
              ${thumbnail ? `<img src="${thumbnail}" alt="${batchData.name}" style="width: 100%; height: 100%; object-fit: cover;">` : `<div style="font-size: 2.5rem; display: flex; align-items: center; justify-content: center; height: 100%;">${icon}</div>`}
            </div>
            <div class="batch-card-badge" style="background: linear-gradient(135deg, ${color}, ${color}80);">
              ${badge}
            </div>
          </div>

          <!-- Card Content -->
          <div class="batch-card-content">
            <h3 class="batch-card-title">${batchData.name || batchData.batchName || 'Untitled Batch'}</h3>
            <p class="batch-card-subtitle">${batchData.description || batchData.subtitle || 'No description available'}</p>

            <!-- Meta Information -->
            <div class="batch-card-meta">
              <div class="meta-item">
                <span class="meta-icon">👨‍🏫</span>
                <span class="meta-text">${batchData.faculty || batchData.instructor || 'Admin'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-icon">📊</span>
                <span class="meta-text">${batchData.level || 'Beginner'}</span>
              </div>
            </div>

            <!-- Features/Tags -->
            ${batchData.features && batchData.features.length > 0 ? `
              <div class="batch-card-features">
                ${batchData.features.slice(0, 2).map(feature => `
                  <span class="feature-tag">${feature}</span>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <!-- Card Footer -->
          <div class="batch-card-footer">
            ${showDetailsLink ? `
              <a href="batch-details.html?id=${batchId}" class="btn-text-link" onclick="${onDetails ? `${onDetails}('${batchId}')` : ''}" title="View batch details">
                View Details →
              </a>
            ` : ''}
            
            ${showEnrollBtn ? `
              <button class="btn-card-action ${isEnrolled ? 'enrolled' : ''}" 
                onclick="${onEnroll ? `${onEnroll}('${batchId}')` : `enrollBatch('${batchId}')`}"
                ${isEnrolled ? 'disabled' : ''}>
                ${isEnrolled ? '✅ Enrolled' : '📚 Enroll'}
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Render multiple batch cards in a container
   * @param {string|Element} container - Container selector or element
   * @param {Map|array} batches - Batch map or array
   * @param {object} options - Rendering options
   */
  static renderBatchGrid(container, batches, options = {}) {
    const {
      gridColumns = 3,
      gap = 20,
      filterFn = null,
      sortFn = null,
      onBatchRendered = null
    } = options;

    // Get container element
    let containerEl = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;

    if (!containerEl) {
      console.error('Container not found:', container);
      return;
    }

    // Convert Map to array if needed
    let batchArray = batches instanceof Map 
      ? Array.from(batches.entries()).map(([id, data]) => ({ id, ...data }))
      : Array.isArray(batches) ? batches : [];

    // Filter batches
    if (filterFn) {
      batchArray = batchArray.filter(filterFn);
    }

    // Sort batches
    if (sortFn) {
      batchArray.sort(sortFn);
    }

    // Clear container
    containerEl.innerHTML = '';

    // Setup grid
    containerEl.style.display = 'grid';
    containerEl.style.gridTemplateColumns = `repeat(auto-fill, minmax(${100 / gridColumns}%, 1fr))`;
    containerEl.style.gap = `${gap}px`;

    // Render cards
    if (batchArray.length === 0) {
      containerEl.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
          <div style="font-size: 2rem; margin-bottom: 10px;">📭</div>
          <p>No batches available yet</p>
        </div>
      `;
      return;
    }

    batchArray.forEach((batch, index) => {
      const card = document.createElement('div');
      card.innerHTML = this.renderBatchCard(batch.id, batch, options);
      containerEl.appendChild(card.firstElementChild);

      if (onBatchRendered) {
        onBatchRendered(batch, index);
      }
    });
  }

  /**
   * Create a mini batch card (for sidebars, lists, etc.)
   * @param {string} batchId - Batch ID
   * @param {object} batchData - Batch data
   * @returns {string} HTML for mini batch card
   */
  static renderMiniBatchCard(batchId, batchData) {
    const icon = batchData.icon || '📚';
    const isElite = batchData.isElitePlus || batchData.badge === 'Elite+';

    return `
      <div class="mini-batch-card" data-batch-id="${batchId}">
        <div class="mini-batch-icon">${icon}</div>
        <div class="mini-batch-info">
          <div class="mini-batch-name">${batchData.name || batchData.batchName || 'Batch'}</div>
          <div class="mini-batch-meta">${batchData.level || 'Beginner'}</div>
        </div>
        ${isElite ? '<div class="mini-batch-badge">💎</div>' : ''}
      </div>
    `;
  }

  /**
   * Create mini batch list
   * @param {string|Element} container - Container
   * @param {Map|array} batches - Batches
   */
  static renderMiniBatchList(container, batches) {
    let containerEl = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;

    if (!containerEl) {
      console.error('Container not found:', container);
      return;
    }

    let batchArray = batches instanceof Map 
      ? Array.from(batches.entries()).map(([id, data]) => ({ id, ...data }))
      : Array.isArray(batches) ? batches : [];

    containerEl.innerHTML = '';
    batchArray.forEach(batch => {
      const div = document.createElement('div');
      div.innerHTML = this.renderMiniBatchCard(batch.id, batch);
      div.addEventListener('click', () => {
        window.location.href = `batch-details.html?id=${batch.id}`;
      });
      containerEl.appendChild(div.firstElementChild);
    });
  }

  /**
   * Update single batch card
   * @param {string} batchId - Batch ID
   * @param {object} updates - Updated batch data
   */
  static updateBatchCard(batchId, updates) {
    const card = document.querySelector(`[data-batch-id="${batchId}"]`);
    if (!card) return;

    // Update title if changed
    if (updates.name) {
      const titleEl = card.querySelector('.batch-card-title');
      if (titleEl) titleEl.textContent = updates.name;
    }

    // Update description if changed
    if (updates.description) {
      const descEl = card.querySelector('.batch-card-subtitle');
      if (descEl) descEl.textContent = updates.description;
    }

    // Update faculty if changed
    if (updates.faculty) {
      const facultyEl = card.querySelector('.meta-text');
      if (facultyEl) facultyEl.textContent = updates.faculty;
    }
  }

  /**
   * Add animations to batch cards
   */
  static addCardAnimations() {
    const style = document.createElement('style');
    style.textContent = `
      .batch-card-container {
        animation: batchCardSlideIn 0.5s ease-out;
      }

      @keyframes batchCardSlideIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .batch-card-wrapper {
        transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
      }

      .batch-card-wrapper:hover {
        transform: translateY(-8px);
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
      }

      [data-theme="dark"] .batch-card-wrapper:hover {
        box-shadow: 0 15px 40px rgba(139, 92, 246, 0.15);
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Global batch card styles
 */
function injectBatchCardStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Batch Card Styles */
    .batch-card-wrapper {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 100%;
      backdrop-filter: blur(10px);
    }

    [data-theme="dark"] .batch-card-wrapper {
      background: rgba(15, 23, 42, 0.3);
      border-color: rgba(255, 255, 255, 0.05);
    }

    .batch-card-header {
      position: relative;
      height: 180px;
      overflow: hidden;
    }

    .batch-card-thumbnail {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #8b5cf6, #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .batch-card-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: #8b5cf6;
      color: white;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    }

    .batch-card-content {
      padding: 20px;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }

    .batch-card-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 8px;
      line-height: 1.3;
    }

    .batch-card-subtitle {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 12px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .batch-card-meta {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
      font-size: 0.8rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--text-secondary);
    }

    .meta-icon {
      font-size: 0.9rem;
    }

    .batch-card-features {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }

    .feature-tag {
      display: inline-flex;
      padding: 4px 10px;
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 6px;
      font-size: 0.75rem;
      color: #8b5cf6;
      white-space: nowrap;
    }

    .batch-card-footer {
      display: flex;
      gap: 8px;
      padding: 16px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      align-items: center;
      justify-content: space-between;
    }

    .btn-text-link {
      flex: 1;
      background: none;
      border: none;
      color: #8b5cf6;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.3s ease;
      padding: 4px 0;
    }

    .btn-text-link:hover {
      color: #a78bfa;
    }

    .btn-card-action {
      padding: 8px 16px;
      background: linear-gradient(135deg, #8b5cf6, #6d28d9);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-card-action:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    }

    .btn-card-action.enrolled {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
      cursor: default;
    }

    /* Mini Batch Card */
    .mini-batch-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .mini-batch-card:hover {
      background: rgba(139, 92, 246, 0.1);
      border-color: rgba(139, 92, 246, 0.3);
    }

    .mini-batch-icon {
      font-size: 1.5rem;
    }

    .mini-batch-info {
      flex: 1;
    }

    .mini-batch-name {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.9rem;
    }

    .mini-batch-meta {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .mini-batch-badge {
      font-size: 0.9rem;
    }

    /* Responsive Grid */
    @media (max-width: 1024px) {
      .batch-card-wrapper {
        border-radius: 12px;
      }
    }

    @media (max-width: 768px) {
      .batch-card-header {
        height: 140px;
      }

      .batch-card-content {
        padding: 16px;
      }

      .batch-card-footer {
        padding: 12px 16px;
        flex-direction: column;
      }

      .btn-text-link,
      .btn-card-action {
        width: 100%;
        text-align: center;
      }
    }
  `;
  document.head.appendChild(style);
}

// Initialize styles when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectBatchCardStyles);
} else {
  injectBatchCardStyles();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BatchCardRenderer };
}
